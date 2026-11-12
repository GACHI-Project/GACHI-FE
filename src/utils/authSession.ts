import { CanceledError } from 'axios';

let sessionVersion = 0;
let credentialsInvalidated = false;

export const getSessionVersion = (): number => sessionVersion;

export const isCurrentSession = (version: number): boolean => version === sessionVersion;

export const invalidateSession = (): void => {
  sessionVersion += 1;
  credentialsInvalidated = true;
};

export const assertCurrentSession = (version: number): void => {
  if (!isCurrentSession(version)) throw new CanceledError('Session ended');
};

export const assertSessionAuthenticated = (version: number): void => {
  assertCurrentSession(version);
  if (credentialsInvalidated) throw new CanceledError('Session credentials cleared');
};

export const markSessionAuthenticated = (version: number): void => {
  assertCurrentSession(version);
  credentialsInvalidated = false;
};

// 비동기 작업을 시작할 때 생성해, 세션 종료 후 도착한 결과를 무시한다.
export const withCurrentSession = <T>(callback: (value: T) => void): ((value: T) => void) => {
  const version = getSessionVersion();
  return (value) => {
    if (isCurrentSession(version)) callback(value);
  };
};
