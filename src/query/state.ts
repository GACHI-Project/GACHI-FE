import axios from 'axios';

export const isTransientQueryError = (error: unknown): boolean => {
  if (!error || axios.isCancel(error)) return false;
  const details = error as { status?: number; code?: string };
  const status =
    (axios.isAxiosError(error) ? error.response?.status : details.status) ??
    Number(details.code?.match(/[45]\d{2}/)?.[0]);
  if (status) return status >= 500 || status === 408 || status === 429;
  return details.code !== 'UNAUTHORIZED';
};

export const hasBlockingQueryError = (query: { data?: unknown; error?: unknown }): boolean =>
  !!query.error && (query.data === undefined || !isTransientQueryError(query.error));
