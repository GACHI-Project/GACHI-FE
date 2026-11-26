import { ApiError, toApiError } from './errors';
import { apiClient } from './client';
import { getAuthRequestConfig } from '../auth/session';

export class ChatApiError extends ApiError {}

const wrapError = (error: unknown) => toApiError(error, ChatApiError);

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

export const sendChatMessage = async (
  params: SendMessageParams,
  signal?: AbortSignal
): Promise<ChatResponse> => {
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
      { ...config, signal }
    );
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
