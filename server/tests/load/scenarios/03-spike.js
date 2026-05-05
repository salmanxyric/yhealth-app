/**
 * Scenario 3: Spike — Surge capacity test
 * 200 → 2000 VUs spike, hold 2 min, ramp down
 */
import { sleep } from 'k6';
import { defaultThresholds } from '../k6.config.js';
import { login, getTestUsers } from '../helpers/auth.js';
import { sendStreamMessage } from '../helpers/sse-client.js';

export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '30s', target: 2000 },   // Spike
    { duration: '2m', target: 2000 },    // Hold spike
    { duration: '30s', target: 200 },    // Recover
    { duration: '2m', target: 200 },     // Verify recovery
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    ...defaultThresholds,
    'ai_coach_stream_errors': ['count<100'], // Allow more errors during spike
  },
};

const users = getTestUsers(200);

export function setup() {
  const tokens = [];
  for (const user of users.slice(0, 100)) {
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

  if (!result.success && result.status !== 503) {
    console.warn(`VU ${__VU}: Unexpected failure (status=${result.status})`);
  }

  sleep(Math.random() * 2 + 1); // 1-3s think time (aggressive)
}
