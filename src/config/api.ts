// Expo replaces this exact environment access when bundling each build environment.
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://43.202.191.103'
).replace(/\/+$/, '');

export const API_TIMEOUT_MS = 10_000;
