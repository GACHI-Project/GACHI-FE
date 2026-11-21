import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  AuthApiError,
  checkEmail as checkEmailApi,
  sendEmailVerificationCode as sendEmailVerificationCodeApi,
  verifyEmailCode as verifyEmailCodeApi,
} from '../../api/auth';
import { queryClient, resourceKey } from '../../query/client';
import { useApiMutation, useSessionScope } from '../../query/hooks';
import { emailSchema } from '../../validation/auth';

interface EmailState {
  emailTimer: number | null;
  emailSent: boolean;
  verificationCode: string;
  verifiedEmail: string | null;
  emailValidation: 'success' | 'error' | undefined;
  emailMessageKey: string | undefined;
  emailChecking: boolean;
  codeValidation: 'success' | 'error' | undefined;
  codeMessageKey: string | undefined;
  codeChecking: boolean;
}

const initialState: EmailState = {
  emailTimer: null,
  emailSent: false,
  verificationCode: '',
  verifiedEmail: null,
  emailValidation: undefined,
  emailMessageKey: undefined,
  emailChecking: false,
  codeValidation: undefined,
  codeMessageKey: undefined,
  codeChecking: false,
};

const CODE_ERRORS: Record<string, string> = {
  COMMON4001: 'codeInvalid',
  AUTH4002: 'codeWrong',
  AUTH4003: 'codeExpired',
  AUTH4292: 'codeExceeded',
};

const useRegisterEmailVerification = () => {
  const scope = useSessionScope();
  const sendEmailVerificationCode = useApiMutation(sendEmailVerificationCodeApi);
  const verifyEmailCode = useApiMutation(verifyEmailCodeApi);
  const checkEmail = (email: string) =>
    queryClient.fetchQuery({
      queryKey: resourceKey(scope.version, scope.language, 'availability', 'email', email),
      queryFn: ({ signal }) => checkEmailApi(email, signal),
      staleTime: 0,
      gcTime: 0,
      retry: false,
    });
  const [state, setState] = useState(initialState);
  const focusedRef = useRef(true);
  const emailRef = useRef('');
  const sentEmailRef = useRef<string | null>(null);
  const verifiedEmailRef = useRef<string | null>(null);
  const codeRef = useRef('');
  const sendRequestRef = useRef<object | null>(null);
  const codeRequestRef = useRef<object | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiresAtRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const expireVerification = useCallback(() => {
    stopTimer();
    codeRequestRef.current = null;
    expiresAtRef.current = null;
    verifiedEmailRef.current = null;
    setState((current) => ({
      ...current,
      emailTimer: null,
      verifiedEmail: null,
      codeChecking: false,
      codeValidation: 'error',
      codeMessageKey: 'auth.register.basic.error.codeExpired',
    }));
  }, [stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    const tick = () => {
      if (!focusedRef.current || expiresAtRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
      if (remaining === 0) {
        expireVerification();
        return;
      }
      setState((current) => ({
        ...current,
        emailTimer: remaining,
      }));
      timerRef.current = setTimeout(tick, 1000);
    };
    tick();
  }, [expireVerification, stopTimer]);

  const updateEmail = (email: string) => {
    emailRef.current = email;
    sendRequestRef.current = null;
    codeRequestRef.current = null;
    sentEmailRef.current = null;
    verifiedEmailRef.current = null;
    codeRef.current = '';
    expiresAtRef.current = null;
    stopTimer();
    setState(initialState);
  };

  const updateCode = (value: string) => {
    const code = value.replace(/\D/g, '').slice(0, 6);
    codeRef.current = code;
    verifiedEmailRef.current = null;
    codeRequestRef.current = null;
    setState((current) => ({
      ...current,
      verificationCode: code,
      verifiedEmail: null,
      codeValidation: undefined,
      codeMessageKey: undefined,
      codeChecking: false,
    }));
  };

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      setState((current) => ({ ...current, emailChecking: false, codeChecking: false }));
      startTimer();
      return () => {
        focusedRef.current = false;
        sendRequestRef.current = null;
        codeRequestRef.current = null;
        stopTimer();
      };
    }, [startTimer, stopTimer])
  );

  const send = async (email: string) => {
    if (!focusedRef.current || sendRequestRef.current) return;
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setState((current) => ({
        ...current,
        emailValidation: 'error',
        emailMessageKey: 'validation.emailFormat',
      }));
      return;
    }

    emailRef.current = email;
    const request = {};
    sendRequestRef.current = request;
    codeRequestRef.current = null;
    sentEmailRef.current = null;
    verifiedEmailRef.current = null;
    codeRef.current = '';
    expiresAtRef.current = null;
    stopTimer();
    setState({ ...initialState, emailChecking: true });
    const isCurrent = () =>
      focusedRef.current && sendRequestRef.current === request && emailRef.current === email;
    try {
      const { available } = await checkEmail(email);
      if (!isCurrent()) return;
      if (!available) {
        setState((current) => ({
          ...current,
          emailValidation: 'error',
          emailMessageKey: 'auth.register.basic.error.emailTaken',
        }));
        return;
      }
      const { codeTtlSeconds } = await sendEmailVerificationCode(email);
      if (!isCurrent()) return;
      sentEmailRef.current = email;
      expiresAtRef.current = Date.now() + codeTtlSeconds * 1000;
      setState((current) => ({
        ...current,
        emailSent: true,
        emailValidation: 'success',
        emailMessageKey: 'auth.register.basic.error.codeSent',
        emailTimer: codeTtlSeconds > 0 ? codeTtlSeconds : null,
      }));
      startTimer();
    } catch {
      if (!isCurrent()) return;
      setState((current) => ({
        ...current,
        emailValidation: 'error',
        emailMessageKey: 'auth.register.basic.error.sendError',
      }));
    } finally {
      if (isCurrent()) {
        sendRequestRef.current = null;
        setState((current) => ({ ...current, emailChecking: false }));
      }
    }
  };

  const confirm = async (email: string) => {
    if (!focusedRef.current || sendRequestRef.current || codeRequestRef.current) return;
    if (verifiedEmailRef.current === email) return;
    if (sentEmailRef.current !== email || emailRef.current !== email) return;
    if (expiresAtRef.current === null || expiresAtRef.current <= Date.now()) {
      expireVerification();
      return;
    }
    const code = codeRef.current.trim();
    if (!/^\d{6}$/.test(code)) {
      setState((current) => ({
        ...current,
        codeValidation: 'error',
        codeMessageKey: 'auth.register.basic.error.codeFormat',
      }));
      return;
    }
    const request = {};
    codeRequestRef.current = request;
    setState((current) => ({
      ...current,
      verifiedEmail: null,
      codeChecking: true,
      codeValidation: undefined,
      codeMessageKey: undefined,
    }));
    const isCurrent = () =>
      focusedRef.current && codeRequestRef.current === request && emailRef.current === email;
    try {
      await verifyEmailCode(email, code);
      if (!isCurrent()) return;
      if (expiresAtRef.current === null || expiresAtRef.current <= Date.now()) {
        expireVerification();
        return;
      }
      stopTimer();
      expiresAtRef.current = null;
      verifiedEmailRef.current = email;
      setState((current) => ({
        ...current,
        emailTimer: null,
        verifiedEmail: email,
        codeValidation: 'success',
        codeMessageKey: 'auth.register.basic.error.emailVerified',
        emailValidation: 'success',
        emailMessageKey: 'auth.register.basic.error.emailVerified',
      }));
    } catch (error) {
      if (!isCurrent()) return;
      const key = error instanceof AuthApiError ? CODE_ERRORS[error.code] : undefined;
      setState((current) => ({
        ...current,
        codeValidation: 'error',
        codeMessageKey: `auth.register.basic.error.${key ?? 'verifyError'}`,
      }));
    } finally {
      if (isCurrent()) {
        codeRequestRef.current = null;
        setState((current) => ({ ...current, codeChecking: false }));
      }
    }
  };

  const isVerified = (email: string) =>
    state.verifiedEmail === email &&
    state.codeValidation === 'success' &&
    !state.emailChecking &&
    !state.codeChecking;

  // Keep synchronous request guards out of render-time validation.
  const canSubmit = (email: string) =>
    focusedRef.current &&
    verifiedEmailRef.current === email &&
    emailRef.current === email &&
    sendRequestRef.current === null &&
    codeRequestRef.current === null &&
    isVerified(email);

  return { ...state, updateEmail, updateCode, send, confirm, isVerified, canSubmit };
};

export default useRegisterEmailVerification;
