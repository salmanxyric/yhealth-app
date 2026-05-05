export const defaultThresholds = {
  'ai_coach_ttfb': ['p(50)<2000', 'p(95)<5000', 'p(99)<10000'],
  'ai_coach_total': ['p(50)<8000', 'p(95)<15000', 'p(99)<30000'],
  'ai_coach_stream_errors': ['count<10'],
  'http_req_failed': ['rate<0.01'],
};

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
