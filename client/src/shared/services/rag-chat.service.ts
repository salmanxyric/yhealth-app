/**
 * RAG Chat Service
 * Client-side service for the AI Health Coach with vector-based retrieval
 */

import { api } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface RAGChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequenceNumber: number;
  createdAt: string;
}

export interface RAGConversation {
  id: string;
  userId: string;
  title: string | null;
  sessionType: string;
  status: string;
  messageCount: number;
  topics: string[];
  createdAt: string;
  lastMessageAt?: string;
  lastMessagePreview?: string | null;
  lastMessageRole?: string | null;
}

export interface ActionCommand {
  type: 'navigate' | 'update' | 'create' | 'delete' | 'open_modal' | 'music_control';
  target: string; // page/tab name or data type
  params?: Record<string, unknown>;
  sequence?: number; // for ordering multiple actions
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  messageId: string;
  actions?: ActionCommand[]; // Array of actions to execute on frontend
  toolCalls?: Array<{ tool: string; result: string }>; // Tools called by the AI during response
  context?: {
    retrievedDocs: number;
    historyUsed: number;
  };
}

export interface ConversationWithMessages {
  conversation: RAGConversation;
  messages: RAGChatMessage[];
}

export interface SearchResult {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  similarity: number;
  sequenceNumber: number;
  createdAt: string;
}

export interface KnowledgeSearchResult {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  content: string;
  tags: string[];
  similarity: number;
  trustScore: number;
}

export type SessionType =
  | 'quick_checkin'
  | 'coaching_session'
  | 'emergency_support'
  | 'goal_review'
  | 'health_coach'
  | 'nutrition'
  | 'fitness'
  | 'wellness';
export type ProfileSection = 'goals' | 'conditions' | 'preferences' | 'history' | 'metrics';

// Streaming SSE event types for the agentic execution timeline
export interface StreamThinkingStartEvent {
  type: 'thinking_start';
  label: string;
  timestamp: number;
}

export interface StreamThinkingEndEvent {
  type: 'thinking_end';
  label: string;
  durationMs: number;
}

export interface StreamToolCallEvent {
  type: 'tool_call';
  operationId: string;
  toolName: string;
  label: string;
  icon?: string;
}

export interface StreamToolResultEvent {
  type: 'tool_result';
  operationId: string;
  toolName: string;
  success: boolean;
  delta: string;
  icon?: string;
  undoable: boolean;
  label?: string;
}

export interface StreamTokenEvent {
  type: 'token';
  content: string;
}

export interface StreamConversationIdEvent {
  type: 'conversation_id';
  conversationId: string;
}

export interface StreamDoneEvent {
  type: 'done';
  message: string;
  conversationId: string;
  messageId: string;
  agentTurnId?: string;
  actions?: ActionCommand[];
  toolCalls?: Array<{ tool: string; result: string }>;
}

export interface StreamErrorEvent {
  type: 'error';
  error: string;
  code?: string;
  retryable?: boolean;
}

export interface StreamArtifactEvent {
  type: 'artifact';
  artifact: Record<string, unknown>;
  toolName: string;
}

export interface StreamAnalysisStepEvent {
  type: 'analysis_step';
  step: {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    durationMs?: number;
    resultSummary?: string;
  };
}

export type StreamEvent =
  | StreamThinkingStartEvent
  | StreamThinkingEndEvent
  | StreamToolCallEvent
  | StreamToolResultEvent
  | StreamTokenEvent
  | StreamConversationIdEvent
  | StreamDoneEvent
  | StreamErrorEvent
  | StreamArtifactEvent
  | StreamAnalysisStepEvent;

// ============================================================================
// RAG Chat Service
// ============================================================================

class RAGChatService {
  private readonly baseUrl = '/rag-chat';

  /**
   * Send a message and get AI response with RAG context
   */
  async sendMessage(params: {
    message: string;
    conversationId?: string;
  }): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>(`${this.baseUrl}/message`, {
      message: params.message,
      conversationId: params.conversationId,
    }, {
      headers: { 'Idempotency-Key': `rag-chat-${Date.now()}-${Math.random().toString(36).substring(2, 10)}` },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to send message');
    }
    return response.data;
  }

  /**
   * Send a message via SSE streaming — emits tool calls, thinking labels,
   * token chunks, and the final done event through the onEvent callback.
   */
  async sendMessageStreaming(params: {
    message: string;
    conversationId?: string;
    imageBase64?: string;
    onEvent: (event: StreamEvent) => void;
    signal?: AbortSignal;
  }): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const token = typeof document !== 'undefined'
      ? document.cookie.split('; ').find(c => c.startsWith('balencia_access_token='))?.split('=')[1]
      : undefined;

    const idempotencyKey = `rag-stream-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const response = await fetch(`${apiUrl}${this.baseUrl}/message/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: params.message,
        conversationId: params.conversationId,
        imageBase64: params.imageBase64,
      }),
      signal: params.signal,
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      let code = 'UNKNOWN';
      try {
        const parsed = JSON.parse(text);
        if (parsed.code) code = parsed.code;
      } catch { /* not JSON */ }
      const err = new Error(`Stream request failed (${response.status}): ${text}`) as Error & {
        statusCode: number;
        code: string;
      };
      err.statusCode = response.status;
      err.code = code;
      throw err;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body for streaming');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const raw = JSON.parse(payload);
            const event = normalizeSSEEvent(raw);
            if (event) params.onEvent(event);
          } catch {
            // skip malformed SSE frames
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Undo a tool operation from the agentic execution timeline
   */
  async undoOperation(operationId: string): Promise<{ success: boolean; error?: string }> {
    const response = await api.post<{ success: boolean; error?: string }>(
      `${this.baseUrl}/operations/${operationId}/undo`,
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to undo operation');
    }
    return response.data;
  }

  /**
   * Create a new conversation
   */
  async createConversation(params?: {
    title?: string;
    sessionType?: SessionType;
  }): Promise<{ conversationId: string }> {
    const response = await api.post<{ conversationId: string }>(
      `${this.baseUrl}/conversations`,
      params || {}
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to create conversation');
    }
    return response.data;
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(
    conversationId: string,
    limit?: number
  ): Promise<ConversationWithMessages> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<ConversationWithMessages>(
      `${this.baseUrl}/conversations/${conversationId}${params}`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to get conversation');
    }
    return response.data;
  }

  /**
   * Get user's conversation list
   */
  async getConversations(params?: {
    limit?: number;
    status?: string;
  }): Promise<{ conversations: RAGConversation[] }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    else searchParams.set('status', 'active');

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await api.get<{ conversations: RAGConversation[] }>(
      `${this.baseUrl}/conversations${query}`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to get conversations');
    }
    return response.data;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/conversations/${conversationId}`);
  }

  /**
   * Rewind a conversation to a user message before resending edited content.
   */
  async truncateConversationFromMessage(
    conversationId: string,
    messageId: string
  ): Promise<{ deletedCount: number }> {
    const response = await api.delete<{ deletedCount: number }>(
      `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}/after`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to rewind conversation');
    }
    return response.data;
  }

  /**
   * Bulk delete multiple conversations
   */
  async deleteConversations(conversationIds: string[]): Promise<{ deletedCount: number }> {
    const response = await api.post<{ deletedCount: number }>(
      `${this.baseUrl}/conversations/bulk-delete`,
      { conversationIds }
    );
    return response.data ?? { deletedCount: 0 };
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    await api.patch(`${this.baseUrl}/conversations/${conversationId}/archive`);
  }

  /**
   * Generate title for a conversation
   */
  async generateTitle(conversationId: string): Promise<{ title: string }> {
    const response = await api.post<{ title: string }>(
      `${this.baseUrl}/conversations/${conversationId}/title`,
      undefined,
      { headers: { 'Idempotency-Key': `rag-title-${conversationId}-${Date.now()}` } }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to generate title');
    }
    return response.data;
  }

  /**
   * Generate summary for a conversation
   */
  async generateSummary(conversationId: string): Promise<{ summary: string }> {
    const response = await api.post<{ summary: string }>(
      `${this.baseUrl}/conversations/${conversationId}/summary`,
      undefined,
      { headers: { 'Idempotency-Key': `rag-summary-${conversationId}-${Date.now()}` } }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to generate summary');
    }
    return response.data;
  }

  /**
   * Search conversation history
   */
  async searchHistory(
    query: string,
    limit?: number
  ): Promise<{ results: SearchResult[] }> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set('limit', limit.toString());

    const response = await api.get<{ results: SearchResult[] }>(
      `${this.baseUrl}/search?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to search history');
    }
    return response.data;
  }

  /**
   * Update user health profile for RAG context
   */
  async updateHealthProfile(params: {
    section: ProfileSection;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const response = await api.post<{ id: string }>(
      `${this.baseUrl}/profile`,
      params
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to update health profile');
    }
    return response.data;
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(params: {
    query: string;
    category?: string;
    limit?: number;
  }): Promise<{ results: KnowledgeSearchResult[] }> {
    const searchParams = new URLSearchParams({ q: params.query });
    if (params.category) searchParams.set('category', params.category);
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const response = await api.get<{ results: KnowledgeSearchResult[] }>(
      `${this.baseUrl}/knowledge/search?${searchParams.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to search knowledge');
    }
    return response.data;
  }

  /**
   * Get personalized greeting from backend
   */
  async getGreeting(callPurpose?: string, language?: string, sessionType?: string): Promise<{ greeting: string }> {
    try {
      const params = new URLSearchParams();
      if (callPurpose) {
        params.append('callPurpose', callPurpose);
      }
      if (language) {
        // Extract base language code (e.g., "ur" from "ur-PK")
        const baseLang = language.split("-")[0];
        params.append('language', baseLang);
      }
      if (sessionType) {
        params.append('sessionType', sessionType);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get<{ greeting: string }>(
        `${this.baseUrl}/greeting${query}`
      );
      if (!response.success || !response.data) {
        throw new Error('Failed to get greeting');
      }
      return response.data;
    } catch (error) {
      // Fallback to simple greeting on error
      console.error('[RAGChatService] Error fetching greeting:', error);
      throw error; // Let caller handle fallback
    }
  }
}

/**
 * Normalize raw SSE payloads from the server into typed StreamEvent objects.
 * The server currently emits events without a `type` field:
 *   { token: "..." }
 *   { conversationId: "..." }
 *   { done: true, message: "...", ... }
 *   { error: "..." }
 * This function maps both the legacy format and the new typed format.
 */
function normalizeSSEEvent(raw: unknown): StreamEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const event = raw as Record<string, unknown>;
  // Already has a type field — new format
  if (event.type) {
    const supportedTypes = new Set([
      'token',
      'conversation_id',
      'done',
      'error',
      'thinking_start',
      'thinking_end',
      'tool_call',
      'tool_result',
      'artifact',
      'analysis_step',
    ]);
    return typeof event.type === 'string' && supportedTypes.has(event.type) ? raw as StreamEvent : null;
  }

  // Legacy: token chunk
  if ('token' in event && !event.done) {
    return { type: 'token', content: String(event.token || '') } as StreamTokenEvent;
  }

  // Legacy: conversation ID
  if ('conversationId' in event && !event.done) {
    return { type: 'conversation_id', conversationId: String(event.conversationId || '') } as StreamConversationIdEvent;
  }

  // Legacy: done event
  if (event.done) {
    return {
      type: 'done',
      message: String(event.message || ''),
      conversationId: String(event.conversationId || ''),
      messageId: String(event.messageId || `resp-${Date.now()}`),
      agentTurnId: typeof event.agentTurnId === 'string' ? event.agentTurnId : undefined,
      actions: event.actions as StreamDoneEvent['actions'],
      toolCalls: event.toolCalls as StreamDoneEvent['toolCalls'],
    } as StreamDoneEvent;
  }

  // Legacy: error
  if ('error' in event) {
    const primary = String(event.error || 'Unknown error');
    const detail = event.errorMessage ? String(event.errorMessage) : '';
    const combined = detail && detail !== primary ? `${primary}: ${detail}` : primary;
    return {
      type: 'error',
      error: combined,
      code: typeof event.code === 'string' ? event.code : undefined,
      retryable: typeof event.retryable === 'boolean' ? event.retryable : undefined,
    } as StreamErrorEvent;
  }

  return null;
}

// Export singleton instance
export const ragChatService = new RAGChatService();
export default ragChatService;
