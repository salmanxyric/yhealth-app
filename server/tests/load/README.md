# AI Coach Load Testing

k6 load test suite for the AI Coach SSE streaming pipeline.

## Prerequisites

1. Install k6: https://k6.io/docs/get-started/installation/
2. Seed test users: `psql $DATABASE_URL < seed/test-users.sql`
3. Ensure the server is running

## Quick Start

```bash
# Run sustained load test (200 VUs, 30 min)
k6 run scenarios/02-sustained.js

# Run against a specific environment
k6 run --env BASE_URL=https://staging.balancia.app scenarios/02-sustained.js
```

## Scenarios

| # | Script | VUs | Duration | Purpose |
|---|--------|-----|----------|---------|
| 1 | `01-ramp-up.js` | 0→500 | 6 min | Find breaking point |
| 2 | `02-sustained.js` | 200 | 31 min | Steady-state p50/p95/p99 |
| 3 | `03-spike.js` | 200→2000→200 | 8 min | Surge capacity |
| 4 | `04-soak.js` | 100 | 2 hours | Memory leaks, pool exhaustion |
| 5 | `05-cold-cache.js` | 100 | 10 min | Cache miss penalty |

## Custom Metrics

- `ai_coach_ttfb` — Time to first SSE token (ms)
- `ai_coach_total` — Full response time (ms)
- `ai_coach_tokens` — Total tokens streamed
- `ai_coach_stream_errors` — Failed/dropped streams

## Thresholds

| Metric | p50 | p95 | p99 |
|--------|-----|-----|-----|
| TTFB | < 2s | < 5s | < 10s |
| Total | < 8s | < 15s | < 30s |
| Errors | < 10 per run | | |

## Interpreting Results

After each run, k6 prints a summary with percentile data. Compare against thresholds above.

Check server health during tests:
```bash
curl http://localhost:5000/api/v1/health/detailed | jq .performance
```

## Environment Variables

- `BASE_URL` — Server URL (default: `http://localhost:5000`)
- `FLUSH_CACHE` — Set to `true` for cold-cache scenario
