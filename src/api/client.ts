import axios, { type GenericAbortSignal, type InternalAxiosRequestConfig } from 'axios';
import { getRetryAccessToken, isSessionClearing } from '../auth/session';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/api';
import {
  assertCurrentSession,
  assertSessionAuthenticated,
  getSessionVersion,
} from '../utils/authSession';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT_MS,
});

type InternalSessionRequestConfig = InternalAxiosRequestConfig & {
  retried?: boolean;
  sessionVersion?: number;
};

// Each caller can stop waiting without aborting the refresh shared by other requests.
const waitForRefresh = (promise: Promise<string>, signal?: GenericAbortSignal): Promise<string> => {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener?.('abort', abort);
    const abort = () => {
      cleanup();
      reject(new axios.CanceledError('Request cancelled during token refresh'));
    };
    signal.addEventListener?.('abort', abort, { once: true });
    if (signal.aborted) abort();
    void promise.then(
      (token) => {
        cleanup();
        resolve(token);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      }
    );
  });
};

apiClient.interceptors.request.use((config) => {
  const request = config as InternalSessionRequestConfig;
  request.sessionVersion ??= getSessionVersion();
  assertCurrentSession(request.sessionVersion);
  if (request.headers.Authorization) assertSessionAuthenticated(request.sessionVersion);
  if (isSessionClearing()) throw new axios.CanceledError('Session is being cleared');
  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    const request = response.config as InternalSessionRequestConfig;
    assertCurrentSession(request.sessionVersion!);
    return response;
  },
  async (error) => {
    if (axios.isCancel(error) || !axios.isAxiosError(error)) return Promise.reject(error);
    const originalRequest = error.config as InternalSessionRequestConfig | undefined;

    if (originalRequest?.sessionVersion !== undefined) {
      assertCurrentSession(originalRequest.sessionVersion);
    }

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest.retried ||
      !originalRequest.headers.Authorization
    ) {
      return Promise.reject(error);
    }

    const version = originalRequest.sessionVersion!;
    assertCurrentSession(version);
    originalRequest.retried = true;
    const token = await waitForRefresh(
      getRetryAccessToken(version, String(originalRequest.headers.Authorization)),
      originalRequest.signal
    );
    assertCurrentSession(version);
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return apiClient(originalRequest);
  }
);
