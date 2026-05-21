import { z } from 'zod';
import i18n from '../i18n';

const t = (key: string) => i18n.t(key);

interface PasswordContext {
  loginId?: string;
  email?: string;
  phoneNumber?: string;
}

const containsPersonalInfo = (password: string, info: string): boolean => {
  const p = password.toLowerCase();
  const v = info.toLowerCase().replace(/[-\s]/g, '');
  if (v.length < 4) return false;
  for (let i = 0; i <= v.length - 4; i += 1) {
    if (p.includes(v.slice(i, i + 4))) return true;
  }
  return false;
};

const hasSequential = (password: string): boolean => {
  for (let i = 0; i <= password.length - 4; i += 1) {
    const codes = [0, 1, 2, 3].map((j) => password.charCodeAt(i + j));
    const isInc = codes.every((c, j) => j === 0 || c === codes[j - 1] + 1);
    const isDec = codes.every((c, j) => j === 0 || c === codes[j - 1] - 1);
    if (isInc || isDec) return true;
  }
  return false;
};

export const validatePassword = (
  password: string,
  context: PasswordContext = {}
): string | null => {
  if (password.length < 8 || password.length > 20) {
    return t('validation.passwordLength');
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if ([hasLetter, hasNumber, hasSpecial].filter(Boolean).length < 2) {
    return t('validation.passwordTypes');
  }

  if (/\s/.test(password)) {
    return t('validation.passwordSpace');
  }

  if (/(.)\1{2}/.test(password)) {
    return t('validation.passwordRepeat');
  }

  if (hasSequential(password)) {
    return t('validation.passwordSequential');
  }

  if (context.loginId && containsPersonalInfo(password, context.loginId)) {
    return t('validation.passwordContainsId');
  }
  if (context.email) {
    const emailLocal = context.email.split('@')[0];
    if (emailLocal && containsPersonalInfo(password, emailLocal)) {
      return t('validation.passwordContainsEmail');
    }
  }
  if (context.phoneNumber && containsPersonalInfo(password, context.phoneNumber)) {
    return t('validation.passwordContainsPhone');
  }

  return null;
};

export const loginIdSchema = z
  .string()
  .min(4, () => t('validation.idMin'))
  .max(50, () => t('validation.idMax'))
  .regex(/^[a-zA-Z0-9._-]+$/, () => t('validation.idFormat'));

export const phoneNumberSchema = z
  .string()
  .regex(/^01[0-9]{8,9}$/, () => t('validation.phoneFormat'));

export const emailSchema = z.string().email(() => t('validation.emailFormat'));
