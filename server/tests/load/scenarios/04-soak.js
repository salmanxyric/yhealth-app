/**
 * Scenario 4: Soak — Memory leaks, connection pool exhaustion
 * 100 VUs for 2 hours
 */
import { sleep } from 'k6';
import { defaultThresholds } from '../k6.config.js';
import { login, getTestUsers } from '../helpers/auth.js';
import { sendStreamMessage } from '../helpers/sse-client.js';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '116m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    ...defaultThresholds,
    'ai_coach_stream_errors': ['count<50'],
  },
};

const users = getTestUsers(100);

export function setup() {
  const tokens = [];
  for (const user of users.slice(0, 50)) {
    const token = login(user.email, user.password);
    if (token) tokens.push(token);
  }
  if (tokens.length === 0) {
    throw new Error('No test users could authenticate. Run seed/test-users.sql first.');
  }
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];
  const result = sendStreamMessage(token);

  if (!result.success) {
    console.warn(`VU ${__VU} iter ${__ITER}: Stream failed (status=${result.status})`);
  }

  sleep(Math.random() * 10 + 10); // 10-20s think time (relaxed, long-running)
}
