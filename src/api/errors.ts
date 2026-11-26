import axios from 'axios';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = new.target.name;
  }
}

type ApiErrorConstructor = new (code: string, message: string, status?: number) => ApiError;

export const toApiError = (error: unknown, ErrorType: ApiErrorConstructor = ApiError): Error => {
  // Keep cancellation and transport metadata intact, including timeout/network error codes.
  if (axios.isCancel(error) || error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    if (!error.response) return error;
    const { status, data } = error.response;
    return new ErrorType(
      typeof data?.code === 'string' ? data.code : `HTTP${status}`,
      typeof data?.message === 'string' ? data.message : '알 수 없는 오류',
      status
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};
