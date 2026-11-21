/* eslint-env node */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { z } = require('zod');
const { hookHarness, queuedApi } = require('./helpers/hookHarness.cjs');

// These tests exercise request ordering; input formats are validated by the production schemas.
const schema = { safeParse: (value) => ({ success: value !== '' }) };

const availabilitySetup = (field) => {
  const api = queuedApi();
  const runner = hookHarness('src/hooks/auth/useRegisterAvailability.ts', {
    '../../api/auth': { checkLoginId: api.request, checkPhoneNumber: api.request },
    '../../validation/auth': { loginIdSchema: schema, phoneNumberSchema: schema },
  });
  runner.render(field);
  const input = (value) => {
    runner.result.check(value);
    runner.render();
  };
  return { runner, api, input };
};

['id', 'phone'].forEach((field) => {
  test(`${field}: a late success cannot overwrite the current rejection`, async () => {
    const { runner, api, input } = availabilitySetup(field);
    input('first');
    runner.runTimers();
    input('second');
    runner.runTimers();
    api.calls[1].resolve({ available: false });
    await runner.flush();
    api.calls[0].resolve({ available: true });
    await runner.flush();
    assert.equal(runner.result.validation, 'error');
    assert.equal(runner.result.isAvailable('second'), false);
    assert.equal(runner.result.messageKey, `auth.register.basic.error.${field}Taken`);
  });

  test(`${field}: stale failures cannot end the newer request or change its message`, async () => {
    const { runner, api, input } = availabilitySetup(field);
    input('first');
    runner.runTimers();
    input('second');
    runner.runTimers();
    api.calls[0].reject(new Error('Old request failed'));
    await runner.flush();
    assert.equal(runner.result.checking, true);
    assert.equal(runner.result.validation, undefined);
    api.calls[1].resolve({ available: true });
    await runner.flush();
    assert.equal(runner.result.isAvailable('second'), true);
    assert.equal(runner.result.isAvailable('first'), false);
  });

  test(`${field}: changing input invalidates a request before the next debounce fires`, async () => {
    const { runner, api, input } = availabilitySetup(field);
    input('first');
    runner.runTimers();
    input('second');
    api.calls[0].resolve({ available: true });
    await runner.flush();
    assert.equal(runner.result.validation, undefined);
    assert.equal(runner.result.checking, true);
    assert.equal(api.calls.length, 1);
    input('');
    runner.runTimers();
    assert.equal(api.calls.length, 1);
    assert.equal(runner.result.checking, false);
  });

  test(`${field}: returning to the same input does not revive its old request`, async () => {
    const { runner, api, input } = availabilitySetup(field);
    input('first');
    runner.runTimers();
    input('second');
    input('first');
    runner.runTimers();
    api.calls[0].resolve({ available: true });
    await runner.flush();
    assert.equal(runner.result.checking, true);
    assert.equal(runner.result.isAvailable('first'), false);
    api.calls[1].resolve({ available: false });
    await runner.flush();
    assert.equal(runner.result.validation, 'error');
  });

  test(`${field}: blur discards pending results and focus retries the interrupted check`, async () => {
    const { runner, api, input } = availabilitySetup(field);
    input('first');
    runner.runTimers();
    runner.blur();
    api.calls[0].resolve({ available: true });
    await runner.flush();
    assert.equal(runner.result.validation, undefined);
    runner.focus();
    runner.runTimers();
    assert.equal(api.calls.length, 2);
    api.calls[1].resolve({ available: true });
    await runner.flush();
    assert.equal(runner.result.isAvailable('first'), true);
    runner.blur();
    runner.focus();
    runner.runTimers();
    assert.equal(api.calls.length, 2);
  });

  test(`${field}: unmount cancels debounce and ignores an in-flight response`, async () => {
    const pending = availabilitySetup(field);
    pending.input('first');
    pending.runner.runTimers();
    pending.runner.unmount();
    pending.api.calls[0].reject(new Error('Late failure'));
    await pending.runner.flush();
    assert.equal(pending.runner.postUnmountUpdates, 0);
    const debouncing = availabilitySetup(field);
    debouncing.input('first');
    debouncing.runner.unmount();
    debouncing.runner.runTimers();
    assert.equal(debouncing.api.calls.length, 0);
  });

  test(`${field}: rendered validation uses state while submission immediately guards pending work`, async () => {
    const { runner, api, input } = availabilitySetup(field);
    input('first');
    runner.runTimers();
    api.calls[0].resolve({ available: true });
    await runner.flush();
    assert.equal(
      runner.renderValue((result) => result.isAvailable('first')),
      true
    );
    assert.equal(runner.result.canSubmit('first'), true);
    runner.result.check('first');
    // A committed render is a snapshot; an event guard sees pending work immediately.
    assert.equal(
      runner.renderValue((result) => result.isAvailable('first')),
      true
    );
    assert.equal(runner.result.canSubmit('first'), false);
    runner.render();
    assert.equal(
      runner.renderValue((result) => result.isAvailable('first')),
      false
    );
    runner.blur();
    assert.equal(runner.result.canSubmit('first'), false);
  });
});

class AuthApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const emailSetup = () => {
  const check = queuedApi();
  const send = queuedApi();
  const verify = queuedApi();
  let now = 100000;
  const runner = hookHarness(
    'src/hooks/auth/useRegisterEmailVerification.ts',
    {
      '../../api/auth': {
        AuthApiError,
        checkEmail: check.request,
        sendEmailVerificationCode: send.request,
        verifyEmailCode: verify.request,
      },
      '../../validation/auth': { emailSchema: schema },
    },
    { Date: { now: () => now } }
  );
  runner.render();
  const inputEmail = (email) => {
    runner.result.updateEmail(email);
    runner.render();
  };
  const inputCode = (code = '123456') => {
    runner.result.updateCode(code);
    runner.render();
  };
  const sendCode = async (email = 'first@example.com') => {
    inputEmail(email);
    const pending = runner.result.send(email);
    check.calls.at(-1).resolve({ available: true });
    await runner.flush();
    send.calls.at(-1).resolve({ codeTtlSeconds: 60 });
    await pending;
    await runner.flush();
  };
  const advance = (seconds, runTimers = true) => {
    now += seconds * 1000;
    if (runTimers) runner.runTimers();
  };
  return { runner, check, send, verify, inputEmail, inputCode, sendCode, advance };
};

test('email changes during availability checking prevent sending to the old address', async () => {
  const { runner, check, send, inputEmail } = emailSetup();
  inputEmail('first@example.com');
  const pending = runner.result.send('first@example.com');
  inputEmail('second@example.com');
  check.calls[0].resolve({ available: true });
  await pending;
  await runner.flush();
  assert.equal(send.calls.length, 0);
  assert.equal(runner.result.emailSent, false);
  assert.equal(runner.result.emailChecking, false);
});

test('a late email send cannot replace the newer send or its loading state', async () => {
  const { runner, check, send, inputEmail } = emailSetup();
  inputEmail('first@example.com');
  const first = runner.result.send('first@example.com');
  check.calls[0].resolve({ available: true });
  await runner.flush();
  inputEmail('second@example.com');
  const second = runner.result.send('second@example.com');
  send.calls[0].resolve({ codeTtlSeconds: 999 });
  await first;
  await runner.flush();
  assert.equal(runner.result.emailChecking, true);
  assert.equal(runner.result.emailSent, false);
  check.calls[1].resolve({ available: true });
  await runner.flush();
  send.calls[1].resolve({ codeTtlSeconds: 60 });
  await second;
  await runner.flush();
  assert.equal(runner.result.emailTimer, 60);
});

test('late email failures do not replace a successful current send', async () => {
  const { runner, check, inputEmail, sendCode } = emailSetup();
  inputEmail('first@example.com');
  const old = runner.result.send('first@example.com');
  await sendCode('second@example.com');
  check.calls[0].reject(new Error('Late failure'));
  await old;
  await runner.flush();
  assert.equal(runner.result.emailMessageKey, 'auth.register.basic.error.codeSent');
  assert.equal(runner.result.emailSent, true);
});

test('verification is bound to the email address and resets on email changes', async () => {
  const { runner, verify, inputEmail, inputCode, sendCode } = emailSetup();
  await sendCode();
  inputCode();
  const pending = runner.result.confirm('first@example.com');
  verify.calls[0].resolve();
  await pending;
  await runner.flush();
  assert.equal(runner.result.isVerified('first@example.com'), true);
  assert.equal(runner.result.isVerified('second@example.com'), false);
  await runner.result.confirm('first@example.com');
  await runner.flush();
  assert.equal(verify.calls.length, 1);
  assert.equal(runner.result.isVerified('first@example.com'), true);
  runner.blur();
  runner.focus();
  assert.equal(runner.result.isVerified('first@example.com'), true);
  inputEmail('second@example.com');
  assert.equal(runner.result.isVerified('second@example.com'), false);
  inputEmail('first@example.com');
  assert.equal(runner.result.isVerified('first@example.com'), false);
});

['email', 'code', 'resend'].forEach((change) => {
  test(`rendered email verification uses state and changing ${change} immediately blocks submission`, async () => {
    const { runner, verify, inputCode, sendCode, check, send } = emailSetup();
    await sendCode();
    inputCode();
    const confirmation = runner.result.confirm('first@example.com');
    verify.calls[0].resolve();
    await confirmation;
    await runner.flush();
    assert.equal(
      runner.renderValue((result) => result.isVerified('first@example.com')),
      true
    );
    assert.equal(runner.result.canSubmit('first@example.com'), true);
    let resend;
    if (change === 'email') runner.result.updateEmail('second@example.com');
    if (change === 'code') runner.result.updateCode('654321');
    if (change === 'resend') resend = runner.result.send('first@example.com');
    assert.equal(
      runner.renderValue((result) => result.isVerified('first@example.com')),
      true
    );
    assert.equal(runner.result.canSubmit('first@example.com'), false);
    runner.render();
    assert.equal(
      runner.renderValue((result) => result.isVerified('first@example.com')),
      false
    );
    if (resend) {
      check.calls[1].resolve({ available: true });
      await runner.flush();
      send.calls[1].resolve({ codeTtlSeconds: 60 });
      await resend;
    }
  });
});

test('equivalent normalized code edits preserve pending and completed verification', async () => {
  const { runner, verify, inputCode, sendCode } = emailSetup();
  await sendCode();
  inputCode();
  const pending = runner.result.confirm('first@example.com');
  inputCode('123-4567');
  assert.equal(runner.result.codeChecking, true);
  verify.calls[0].resolve();
  await pending;
  await runner.flush();
  inputCode('123 456');
  assert.equal(runner.result.canSubmit('first@example.com'), true);
});

['unavailable email', 'availability error'].forEach((failure) => {
  test(`a resend preserves the active code and its deadline after an ${failure}`, async () => {
    const { runner, check, send, verify, inputCode, sendCode, advance } = emailSetup();
    await sendCode();
    inputCode();
    const resend = runner.result.send('first@example.com');
    await runner.flush();
    assert.equal(runner.result.emailChecking, true);
    await runner.result.confirm('first@example.com');
    assert.equal(verify.calls.length, 0);
    advance(20);
    await runner.flush();
    assert.equal(runner.result.emailTimer, 40);
    if (failure === 'unavailable email') check.calls[1].resolve({ available: false });
    else check.calls[1].reject(new Error('Availability check failed'));
    await resend;
    await runner.flush();
    assert.equal(runner.result.emailChecking, false);
    assert.equal(runner.result.verificationCode, '123456');
    assert.equal(runner.result.emailTimer, 40);
    assert.equal(send.calls.length, 1);
    const confirmation = runner.result.confirm('first@example.com');
    assert.equal(verify.calls[0].args[1], '123456');
    verify.calls[0].resolve();
    await confirmation;
    await runner.flush();
    assert.equal(runner.result.canSubmit('first@example.com'), true);
  });
});

test('completed verification survives blur while the event guard rejects background submissions', async () => {
  const { runner, verify, inputCode, sendCode } = emailSetup();
  await sendCode();
  inputCode();
  const confirmation = runner.result.confirm('first@example.com');
  verify.calls[0].resolve();
  await confirmation;
  await runner.flush();
  runner.blur();
  assert.equal(
    runner.renderValue((result) => result.isVerified('first@example.com')),
    true
  );
  assert.equal(runner.result.canSubmit('first@example.com'), false);
  runner.focus();
  assert.equal(runner.result.canSubmit('first@example.com'), true);
});

['email', 'code', 'resend'].forEach((change) => {
  test(`changing ${change} invalidates an in-flight code confirmation`, async () => {
    const { runner, verify, inputEmail, inputCode, sendCode, check, send } = emailSetup();
    await sendCode();
    inputCode();
    const pending = runner.result.confirm('first@example.com');
    let resend;
    if (change === 'email') inputEmail('second@example.com');
    if (change === 'code') inputCode('654321');
    if (change === 'resend') {
      resend = runner.result.send('first@example.com');
      await runner.flush();
      assert.equal(runner.result.codeChecking, true);
      check.calls[1].resolve({ available: true });
      await runner.flush();
      assert.equal(send.calls.length, 2);
    }
    verify.calls[0].resolve();
    await pending;
    await runner.flush();
    assert.equal(runner.result.isVerified('first@example.com'), false);
    assert.notEqual(runner.result.codeValidation, 'success');
    if (resend) {
      send.calls[1].resolve({ codeTtlSeconds: 60 });
      await resend;
    }
  });
});

test('an old confirmation failure cannot unlock a newer code confirmation', async () => {
  const { runner, verify, inputCode, sendCode } = emailSetup();
  await sendCode();
  inputCode();
  const first = runner.result.confirm('first@example.com');
  inputCode('654321');
  const second = runner.result.confirm('first@example.com');
  verify.calls[0].reject(new AuthApiError('AUTH4002'));
  await first;
  await runner.flush();
  assert.equal(runner.result.codeChecking, true);
  assert.equal(runner.result.codeMessageKey, undefined);
  verify.calls[1].resolve();
  await second;
  await runner.flush();
  assert.equal(runner.result.isVerified('first@example.com'), true);
});

test('returning to the same email does not revive an old code send', async () => {
  const { runner, check, send, inputEmail } = emailSetup();
  inputEmail('first@example.com');
  const old = runner.result.send('first@example.com');
  check.calls[0].resolve({ available: true });
  await runner.flush();
  inputEmail('second@example.com');
  inputEmail('first@example.com');
  send.calls[0].resolve({ codeTtlSeconds: 60 });
  await old;
  await runner.flush();
  assert.equal(runner.result.emailSent, false);
  assert.equal(runner.result.emailTimer, null);
});

test('focus does not revive a send started before blur', async () => {
  const { runner, check, send, inputEmail } = emailSetup();
  inputEmail('first@example.com');
  const old = runner.result.send('first@example.com');
  runner.blur();
  runner.focus();
  const current = runner.result.send('first@example.com');
  check.calls[0].resolve({ available: true });
  await old;
  await runner.flush();
  assert.equal(send.calls.length, 0);
  assert.equal(runner.result.emailChecking, true);
  check.calls[1].resolve({ available: true });
  await runner.flush();
  send.calls[0].resolve({ codeTtlSeconds: 60 });
  await current;
  await runner.flush();
  assert.equal(runner.result.emailSent, true);
});

test('a rejected code can be corrected and retried for the same email', async () => {
  const { runner, verify, inputCode, sendCode } = emailSetup();
  await sendCode();
  inputCode();
  const wrong = runner.result.confirm('first@example.com');
  verify.calls[0].reject(new AuthApiError('AUTH4002'));
  await wrong;
  await runner.flush();
  assert.equal(runner.result.codeMessageKey, 'auth.register.basic.error.codeWrong');
  assert.equal(runner.result.codeChecking, false);
  assert.equal(runner.result.isVerified('first@example.com'), false);
  inputCode('654321');
  const corrected = runner.result.confirm('first@example.com');
  assert.equal(verify.calls[1].args[1], '654321');
  verify.calls[1].resolve();
  await corrected;
  await runner.flush();
  assert.equal(runner.result.isVerified('first@example.com'), true);
});

test('send and confirm prevent duplicate requests before a rerender', async () => {
  const { runner, check, send, verify, inputEmail, inputCode } = emailSetup();
  inputEmail('first@example.com');
  const pending = runner.result.send('first@example.com');
  await runner.result.send('first@example.com');
  assert.equal(check.calls.length, 1);
  check.calls[0].resolve({ available: true });
  await runner.flush();
  send.calls[0].resolve({ codeTtlSeconds: 60 });
  await pending;
  await runner.flush();
  inputCode();
  const confirmation = runner.result.confirm('first@example.com');
  await runner.result.confirm('first@example.com');
  assert.equal(verify.calls.length, 1);
  verify.calls[0].resolve();
  await confirmation;
});

[true, false].forEach((runTimers) => {
  test(`server success after the local deadline is accepted (timer ran: ${runTimers})`, async () => {
    const { runner, verify, inputCode, sendCode, advance } = emailSetup();
    await sendCode();
    inputCode();
    const pending = runner.result.confirm('first@example.com');
    advance(61, runTimers);
    await runner.flush();
    assert.equal(runner.result.codeChecking, true);
    verify.calls[0].resolve();
    await pending;
    runner.runTimers();
    await runner.flush();
    assert.equal(runner.result.emailTimer, null);
    assert.equal(runner.result.codeChecking, false);
    assert.equal(runner.result.canSubmit('first@example.com'), true);
  });
});

test('server expiry after the local countdown ends still rejects the pending confirmation', async () => {
  const { runner, verify, inputCode, sendCode, advance } = emailSetup();
  await sendCode();
  inputCode();
  const pending = runner.result.confirm('first@example.com');
  advance(61);
  verify.calls[0].reject(new AuthApiError('AUTH4003'));
  await pending;
  await runner.flush();
  assert.equal(runner.result.codeMessageKey, 'auth.register.basic.error.codeExpired');
  assert.equal(runner.result.codeChecking, false);
  assert.equal(runner.result.canSubmit('first@example.com'), false);
});

test('local expiry blocks new confirmations even before the countdown callback runs', async () => {
  const { runner, verify, inputCode, sendCode, advance } = emailSetup();
  await sendCode();
  inputCode();
  advance(61, false);
  await runner.result.confirm('first@example.com');
  await runner.flush();
  assert.equal(verify.calls.length, 0);
  assert.equal(runner.result.emailTimer, null);
  assert.equal(runner.result.codeMessageKey, 'auth.register.basic.error.codeExpired');
});

test('blur discards confirmation responses and recalculates expiry on returning', async () => {
  const { runner, verify, inputCode, sendCode, advance } = emailSetup();
  await sendCode();
  inputCode();
  const pending = runner.result.confirm('first@example.com');
  runner.blur();
  advance(61);
  verify.calls[0].resolve();
  await pending;
  await runner.flush();
  runner.focus();
  assert.equal(runner.result.emailTimer, null);
  assert.equal(runner.result.codeChecking, false);
  assert.equal(runner.result.isVerified('first@example.com'), false);
});

['check', 'send', 'verify'].forEach((stage) => {
  test(`unmount ignores pending email ${stage} responses`, async () => {
    const setup = emailSetup();
    const { runner, check, send, verify, inputEmail, inputCode, sendCode } = setup;
    let pending;
    if (stage === 'verify') {
      await sendCode();
      inputCode();
      pending = runner.result.confirm('first@example.com');
    } else {
      inputEmail('first@example.com');
      pending = runner.result.send('first@example.com');
      if (stage === 'send') {
        check.calls[0].resolve({ available: true });
        await runner.flush();
      }
    }
    runner.unmount();
    ({ check, send, verify })[stage].calls.at(-1).reject(new Error('Late failure'));
    await pending;
    await runner.flush();
    runner.runTimers();
    assert.equal(runner.postUnmountUpdates, 0);
  });
});

const registerScreenSetup = () => {
  const values = {
    name: 'Parent',
    id: 'first',
    phone: '010-1234-5678',
    email: 'first@example.com',
    password: 'example-password',
    passwordConfirm: 'example-password',
    agreed: true,
  };
  const guards = { id: true, phone: true, email: true };
  const saved = [];
  const navigations = [];
  let rendering = false;
  const check = (field, expected) => ({
    isAvailable: (value) => value === expected,
    canSubmit: (value) => {
      assert.equal(rendering, false, 'Synchronous request guards belong in event handlers');
      return guards[field] && value === expected;
    },
  });
  const store = {
    agreedToTerms: false,
    setAgreedToTerms: () => {},
    setBasicInfo: (payload) => saved.push(payload),
  };
  const jsx = (type, props) => ({ type, props });
  const runner = hookHarness('app/(auth)/register/basic.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { StyleSheet: { create: (styles) => styles } },
    'expo-router': { router: { push: (path) => navigations.push(path) } },
    'react-hook-form': {
      Controller: 'Controller',
      useForm: () => ({
        control: {},
        formState: { errors: {}, isValid: true },
        setValue: () => {},
        getValues: (field) => {
          assert.equal(rendering, false, 'Rendering must subscribe to values instead of getValues');
          return field ? values[field] : { ...values };
        },
      }),
      useWatch: ({ name }) => name.map((field) => values[field]),
    },
    '@hookform/resolvers/zod': { zodResolver: () => {} },
    zod: { z },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    '../../../src/components/common/StepHeader': { default: 'StepHeader' },
    '../../../src/components/common/Button': { PrimaryButton: 'PrimaryButton' },
    '../../../src/components/auth/FormField': { default: 'FormField' },
    '../../../src/components/auth/PasswordStrengthBar': {
      default: 'PasswordStrengthBar',
      getStrength: () => 3,
    },
    '../../../src/components/auth/TermsCheckbox': { default: 'TermsCheckbox' },
    '../../../src/hooks/auth/useRegisterAvailability': {
      default: (field) => check(field, field === 'id' ? 'first' : '01012345678'),
    },
    '../../../src/hooks/auth/useRegisterEmailVerification': {
      default: () => ({
        isVerified: (email) => email === 'first@example.com',
        canSubmit: (email) => {
          assert.equal(rendering, false);
          return guards.email && email === 'first@example.com';
        },
      }),
    },
    '../../../src/validation/auth': {
      loginIdSchema: z.string(),
      emailSchema: z.string(),
      validatePassword: () => null,
    },
    '../../../src/constants/colors': { default: { text: {}, secondary: {}, primary: {} } },
    '../../../src/constants/fonts': { default: {} },
    '../../../src/constants/layout': { default: {} },
    '../../../src/store/registerStore': { useRegisterStore: (select) => select(store) },
  });
  const collect = (tree) => {
    if (Array.isArray(tree)) return tree.flatMap(collect);
    if (!tree || typeof tree !== 'object') return [];
    return [tree, ...collect(tree.props?.children)];
  };
  const render = () => {
    rendering = true;
    try {
      runner.render();
    } finally {
      rendering = false;
    }
    return collect(runner.result).find((node) => node.type === 'PrimaryButton').props;
  };
  return { values, guards, saved, navigations, render };
};

test('the Next button follows subscribed form values without reading event guards during rendering', () => {
  const screen = registerScreenSetup();
  assert.equal(screen.render().disabled, false);
  screen.values.email = 'unverified@example.com';
  assert.equal(screen.render().disabled, true);
  screen.values.email = 'first@example.com';
  assert.equal(screen.render().disabled, false);
  screen.values.phone = '010-9999-9999';
  assert.equal(screen.render().disabled, true);
  screen.values.phone = '010-1234-5678';
  screen.render().onPress();
  assert.equal(screen.saved.length, 1);
  assert.equal(screen.saved[0].phoneNumber, '01012345678');
  assert.deepEqual(screen.navigations, ['/(auth)/register/child']);
});

['id', 'phone', 'email'].forEach((field) => {
  test(`the Next action rechecks the ${field} guard even before a new render`, () => {
    const screen = registerScreenSetup();
    const next = screen.render();
    assert.equal(next.disabled, false);
    screen.guards[field] = false;
    next.onPress();
    assert.equal(screen.saved.length, 0);
    assert.equal(screen.navigations.length, 0);
  });
});

test('the Next action reads current form values again instead of submitting a captured email', () => {
  const screen = registerScreenSetup();
  const next = screen.render();
  screen.values.email = 'unverified@example.com';
  next.onPress();
  assert.equal(screen.saved.length, 0);
  assert.equal(screen.navigations.length, 0);
});

test('the Next action validates and saves the current form even if the rendered validity is stale', () => {
  const screen = registerScreenSetup();
  const next = screen.render();
  assert.equal(next.disabled, false);
  screen.values.agreed = false;
  next.onPress();
  screen.values.agreed = true;
  screen.values.passwordConfirm = 'mismatch';
  next.onPress();
  assert.equal(screen.saved.length, 0);
  assert.equal(screen.navigations.length, 0);

  screen.values.passwordConfirm = screen.values.password;
  screen.values.name = '  Parent  ';
  next.onPress();
  assert.equal(screen.saved[0].name, 'Parent');
  assert.deepEqual(screen.navigations, ['/(auth)/register/child']);
});
