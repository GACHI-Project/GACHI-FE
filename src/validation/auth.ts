import { z } from 'zod';

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
    return '비밀번호는 8자 이상 20자 이하여야 해요';
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if ([hasLetter, hasNumber, hasSpecial].filter(Boolean).length < 2) {
    return '영문, 숫자, 특수문자 중 2종 이상을 포함해야 해요';
  }

  if (/\s/.test(password)) {
    return '비밀번호에 공백을 포함할 수 없어요';
  }

  if (/(.)\1{2}/.test(password)) {
    return '같은 문자를 3번 이상 연속 사용할 수 없어요';
  }

  if (hasSequential(password)) {
    return '연속된 문자나 숫자를 4자 이상 사용할 수 없어요';
  }

  if (context.loginId && containsPersonalInfo(password, context.loginId)) {
    return '아이디를 비밀번호에 포함할 수 없어요';
  }
  if (context.email) {
    const emailLocal = context.email.split('@')[0];
    if (emailLocal && containsPersonalInfo(password, emailLocal)) {
      return '이메일을 비밀번호에 포함할 수 없어요';
    }
  }
  if (context.phoneNumber && containsPersonalInfo(password, context.phoneNumber)) {
    return '전화번호를 비밀번호에 포함할 수 없어요';
  }

  return null;
};

export const loginIdSchema = z
  .string()
  .min(4, '아이디는 4자 이상이어야 해요')
  .max(50, '아이디는 50자 이하여야 해요')
  .regex(/^[a-zA-Z0-9._-]+$/, '영문, 숫자, ., _, -만 사용할 수 있어요');

export const phoneNumberSchema = z
  .string()
  .regex(/^01[0-9]{8,9}$/, '올바른 전화번호 형식이 아니에요');

export const emailSchema = z.string().email('올바른 이메일 형식이 아니에요');
