import axios from 'axios';

export const isTransientQueryError = (error: unknown): boolean => {
  if (!error || axios.isCancel(error)) return false;
  const details = error as { status?: number; code?: string };
  if (details.code === 'UNAUTHORIZED') return false;
  const status =
    (axios.isAxiosError(error) ? error.response?.status : details.status) ??
    Number(details.code?.match(/[45]\d{2}/)?.[0]);
  if (status) return status >= 500 || status === 408 || status === 429;
  return true;
};

export const hasBlockingQueryError = (query: { data?: unknown; error?: unknown }): boolean =>
  !!query.error && (query.data === undefined || !isTransientQueryError(query.error));
