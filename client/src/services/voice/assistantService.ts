/**
 * AgriDirect AI Voice Assistant API Client
 * Connects to /api/v1/voice/assistant/chat
 */

import type {
  AssistantChatRequest,
  AssistantChatResponse,
} from '@types';

export class AssistantService {
  /**
   * Send user message to AI assistant
   */
  public static async sendMessage(request: AssistantChatRequest): Promise<AssistantChatResponse> {
    const res = await fetch('/api/v1/voice/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(
        errBody?.error?.message || `Voice assistant request failed with status ${res.status}`
      );
    }

    const data = (await res.json()) as { data: AssistantChatResponse };
    return data.data;
  }
}
