/**
 * Scenario 5: Cold cache — Cache miss penalty measurement
 * Flush Redis, then 100 VUs for 10 minutes
 *
 * Run with: k6 run --env FLUSH_CACHE=true scenarios/05-cold-cache.js
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { defaultThresholds, BASE_URL } from '../k6.config.js';
import { login, getTestUsers } from '../helpers/auth.js';
import { sendStreamMessage } from '../helpers/sse-client.js';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '8m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    ...defaultThresholds,
    'ai_coach_stream_errors': ['count<20'],
  },
};

const users = getTestUsers(100);

export function setup() {
  // Note: Redis flush must be done externally before running this test
  // e.g., redis-cli FLUSHALL
  if (__ENV.FLUSH_CACHE === 'true') {
    console.log('⚠️  FLUSH_CACHE=true — ensure Redis was flushed before this run');
  }

  const tokens = [];
  for (const user of users.slice(0, 30)) {
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
    console.warn(`VU ${__VU}: Cold cache stream failed (status=${result.status}, ttfb=${result.ttfbMs}ms)`);
  }

  sleep(Math.random() * 3 + 3); // 3-6s think time
}
