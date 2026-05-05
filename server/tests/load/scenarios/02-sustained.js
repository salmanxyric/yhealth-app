/**
 * Scenario 2: Sustained load — Steady-state performance metrics
 * 200 VUs for 30 minutes
 */
import { sleep } from 'k6';
import { defaultThresholds } from '../k6.config.js';
import { login, getTestUsers } from '../helpers/auth.js';
import { sendStreamMessage } from '../helpers/sse-client.js';

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '28m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: defaultThresholds,
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
    console.warn(`VU ${__VU}: Stream failed (status=${result.status})`);
  }

  sleep(Math.random() * 5 + 5); // 5-10s think time (realistic chat pacing)
}
