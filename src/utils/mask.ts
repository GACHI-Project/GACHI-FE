export const maskEmail = (email: string): string => {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return email;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const visibleLength = Math.min(2, local.length);
  const visible = local.slice(0, visibleLength);
  const maskedLength = Math.max(local.length - visibleLength, 3);

  return `${visible}${'*'.repeat(maskedLength)}${domain}`;
};
