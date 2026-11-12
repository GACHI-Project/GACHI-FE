import axios from 'axios';
import { apiClient, getAuthRequestConfig } from './auth';

export class ChatApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new ChatApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthConfig = (version?: number) =>
  getAuthRequestConfig(() => new ChatApiError('UNAUTHORIZED', '로그인이 필요합니다.'), version);

export interface SendMessageParams {
  sessionId: string | null;
  message: string;
  chatType?: 'GENERAL' | 'DOCUMENT';
  newsletterId?: number;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  sentAt: string;
}

export const sendChatMessage = async (params: SendMessageParams): Promise<ChatResponse> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.post<{ result: ChatResponse }>(
      '/api/v1/chat/messages',
      {
        sessionId: params.sessionId,
        message: params.message,
        chatType: params.chatType ?? 'GENERAL',
        ...(params.newsletterId !== undefined &&
          Number.isInteger(params.newsletterId) &&
          params.newsletterId > 0 && { newsletterId: params.newsletterId }),
      },
      config
    );
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
