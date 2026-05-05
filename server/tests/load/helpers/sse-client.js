import http from 'k6/http';
import { ttfb, totalResponse, tokenCount, streamErrors } from './metrics.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const STREAM_URL = `${BASE_URL}/api/v1/rag-chat/message/stream`;

const TEST_MESSAGES = [
  'How did I sleep last night?',
  'What should I eat for lunch today?',
  'Can you analyze my workout trends this week?',
  'How is my recovery looking?',
  'Give me a summary of my health this week',
  'What exercises should I do today?',
  'Am I getting enough protein?',
  'How can I improve my sleep quality?',
  'What is my resting heart rate trend?',
  'Compare my activity this week vs last week',
];

export function sendStreamMessage(token, conversationId) {
  const message = TEST_MESSAGES[Math.floor(Math.random() * TEST_MESSAGES.length)];

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
    },
    timeout: '60s',
  };

  const payload = JSON.stringify({
    message,
    ...(conversationId ? { conversationId } : {}),
  });

  const startTime = Date.now();
  let firstTokenTime = null;
  let tokens = 0;
  let done = false;
  let error = false;

  const res = http.post(STREAM_URL, payload, params);

  if (res.status !== 200) {
    streamErrors.add(1);
    return { success: false, status: res.status, ttfbMs: 0, totalMs: 0, tokens: 0 };
  }

  const body = res.body || '';
  const lines = body.split('\n');

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const dataStr = line.substring(6);

    try {
      const data = JSON.parse(dataStr);

      if (data.token && !firstTokenTime) {
        firstTokenTime = Date.now();
      }

      if (data.token) {
        tokens++;
      }

      if (data.done) {
        done = true;
      }

      if (data.error) {
        error = true;
      }
    } catch {
      // Non-JSON SSE line, skip
    }
  }

  const totalMs = Date.now() - startTime;
  const ttfbMs = firstTokenTime ? firstTokenTime - startTime : totalMs;

  ttfb.add(ttfbMs);
  totalResponse.add(totalMs);
  tokenCount.add(tokens);

  if (error || !done) {
    streamErrors.add(1);
  }

  return {
    success: done && !error,
    status: res.status,
    ttfbMs,
    totalMs,
    tokens,
    conversationId: extractConversationId(body),
  };
}

function extractConversationId(body) {
  const lines = body.split('\n');
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    try {
      const data = JSON.parse(line.substring(6));
      if (data.conversationId) return data.conversationId;
    } catch { /* skip */ }
  }
  return null;
}
