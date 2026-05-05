import { Trend, Counter, Gauge } from 'k6/metrics';

export const ttfb = new Trend('ai_coach_ttfb', true);
export const totalResponse = new Trend('ai_coach_total', true);
export const tokenCount = new Counter('ai_coach_tokens');
export const streamErrors = new Counter('ai_coach_stream_errors');
export const activeVUs = new Gauge('ai_coach_active_vus');
