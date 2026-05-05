/**
 * @file Chatbot Metrics Service
 * @description Lightweight observability for chatbot performance.
 * Tracks TTFT, intent accuracy, tool selection, cache hits, prompt size.
 * Rolling window of last 200 requests stored in memory.
 */

import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface ChatMetricEntry {
  timestamp: number;
  userId: string;
  messageType: string;
  primaryIntent: string;
  intentConfidence: number;
  ttft: number;
  totalLatency?: number;
  toolsLoaded: number;
  toolsCalled: number;
  profileCacheHit: boolean;
  profileStale: boolean;
  systemPromptLength: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
}

export interface MetricsSummary {
  totalRequests: number;
  avgTtft: number;
  p95Ttft: number;
  avgTotalLatency: number;
  avgToolsLoaded: number;
  avgToolsCalled: number;
  profileCacheHitRate: number;
  avgSystemPromptLength: number;
  fallbackRate: number;
  messageTypeDistribution: Record<string, number>;
  intentDistribution: Record<string, number>;
  lightweightPct: number;
}

// ============================================
// SERVICE
// ============================================

const MAX_ENTRIES = 200;

class ChatbotMetricsService {
  private entries: ChatMetricEntry[] = [];

  record(params: Omit<ChatMetricEntry, 'timestamp'>): void {
    const entry: ChatMetricEntry = {
      ...params,
      timestamp: Date.now(),
    };

    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.shift();
    }

    logger.info('[ChatMetrics]', {
      messageType: params.messageType,
      intent: params.primaryIntent,
      confidence: params.intentConfidence,
      ttft: params.ttft,
      tools: `${params.toolsCalled}/${params.toolsLoaded}`,
      cacheHit: params.profileCacheHit,
      promptLen: params.systemPromptLength,
      fallback: params.fallbackUsed,
    });
  }

  recordTotalLatency(userId: string, totalLatency: number): void {
    let last: ChatMetricEntry | undefined;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].userId === userId) { last = this.entries[i]; break; }
    }
    if (last) {
      last.totalLatency = totalLatency;
    }
  }

  getSummary(): MetricsSummary {
    const n = this.entries.length;
    if (n === 0) {
      return {
        totalRequests: 0,
        avgTtft: 0,
        p95Ttft: 0,
        avgTotalLatency: 0,
        avgToolsLoaded: 0,
        avgToolsCalled: 0,
        profileCacheHitRate: 0,
        avgSystemPromptLength: 0,
        fallbackRate: 0,
        messageTypeDistribution: {},
        intentDistribution: {},
        lightweightPct: 0,
      };
    }

    const ttfts = this.entries.map(e => e.ttft).sort((a, b) => a - b);
    const latencies = this.entries.filter(e => e.totalLatency).map(e => e.totalLatency!);
    const p95Index = Math.floor(n * 0.95);

    const messageTypes: Record<string, number> = {};
    const intents: Record<string, number> = {};
    let lightweightCount = 0;

    for (const e of this.entries) {
      messageTypes[e.messageType] = (messageTypes[e.messageType] || 0) + 1;
      intents[e.primaryIntent] = (intents[e.primaryIntent] || 0) + 1;
      if (e.messageType === 'greeting' || e.messageType === 'casual_chat' || e.messageType === 'gratitude') {
        lightweightCount++;
      }
    }

    return {
      totalRequests: n,
      avgTtft: Math.round(ttfts.reduce((a, b) => a + b, 0) / n),
      p95Ttft: ttfts[p95Index] || ttfts[n - 1],
      avgTotalLatency: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
      avgToolsLoaded: Math.round(this.entries.reduce((a, e) => a + e.toolsLoaded, 0) / n * 10) / 10,
      avgToolsCalled: Math.round(this.entries.reduce((a, e) => a + e.toolsCalled, 0) / n * 10) / 10,
      profileCacheHitRate: Math.round(this.entries.filter(e => e.profileCacheHit).length / n * 100),
      avgSystemPromptLength: Math.round(this.entries.reduce((a, e) => a + e.systemPromptLength, 0) / n),
      fallbackRate: Math.round(this.entries.filter(e => e.fallbackUsed).length / n * 100),
      messageTypeDistribution: messageTypes,
      intentDistribution: intents,
      lightweightPct: Math.round(lightweightCount / n * 100),
    };
  }

  getRecentEntries(count: number = 20): ChatMetricEntry[] {
    return this.entries.slice(-count);
  }
}

export const chatbotMetricsService = new ChatbotMetricsService();
