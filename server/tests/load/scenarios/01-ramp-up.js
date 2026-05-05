/**
 * Scenario 1: Ramp-up — Find the breaking point
 * 0 → 500 VUs over 5 minutes, then ramp down
 */
import { sleep } from 'k6';
import { defaultThresholds } from '../k6.config.js';
import { login, getTestUsers } from '../helpers/auth.js';
import { sendStreamMessage } from '../helpers/sse-client.js';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 0 },
  ],
  thresholds: defaultThresholds,
};

const users = getTestUsers(100);

export function setup() {
  const tokens = [];
  for (const user of users.slice(0, 20)) {
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
    console.warn(`VU ${__VU}: Stream failed (status=${result.status}, ttfb=${result.ttfbMs}ms)`);
  }

  sleep(Math.random() * 3 + 2); // 2-5s think time
}
