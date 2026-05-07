/**
 * @file Artifact Generation Service
 * @description Auto-creates chart artifacts from analysis results.
 * Returns Recharts-compatible config with full provenance.
 */

import { query } from '../config/database.config.js';
import type { AnalysisResult } from './deep-analysis-engine.service.js';
import type { IntelligenceArtifact, ArtifactType, DataSourceReference } from '@shared/types/domain/intelligence-files.js';

function mapRow(row: Record<string, unknown>): IntelligenceArtifact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    artifactType: row.artifact_type as ArtifactType,
    title: row.title as string,
    description: (row.description as string) || null,
    chartConfig: (row.chart_config as Record<string, unknown>) || {},
    data: (row.data as Record<string, unknown>[]) || [],
    insight: (row.insight as string) || null,
    generatedBy: row.generated_by as string,
    triggerMessageId: (row.trigger_message_id as string) || null,
    conversationId: (row.conversation_id as string) || null,
    analysisId: (row.analysis_id as string) || null,
    memoryIdsUsed: (row.memory_ids_used as string[]) || [],
    dataSources: (row.data_sources as DataSourceReference[]) || [],
    isPinned: row.is_pinned as boolean,
    isArchived: row.is_archived as boolean,
    tags: (row.tags as string[]) || [],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

class ArtifactGenerationService {
  async saveInlineArtifact(params: {
    userId: string;
    artifact: Record<string, unknown>;
    generatedBy?: string;
    conversationId?: string;
    analysisId?: string;
    tags?: string[];
  }): Promise<IntelligenceArtifact> {
    const artifact = params.artifact;
    const rawType = typeof artifact.type === 'string' ? artifact.type : 'report';
    const artifactType: ArtifactType = rawType === 'comparison'
      ? 'comparison'
      : rawType === 'chart'
        ? this.mapChartArtifactType(String(artifact.chartType || artifact.chart_type || 'chart'))
        : 'report';

    const title = String(artifact.title || 'AI Coach Artifact').slice(0, 255);
    const description = typeof artifact.insight === 'string'
      ? artifact.insight
      : typeof artifact.description === 'string'
        ? artifact.description
        : null;
    const data = Array.isArray(artifact.data)
      ? artifact.data as Record<string, unknown>[]
      : Array.isArray((artifact.config as Record<string, unknown> | undefined)?.data)
        ? (artifact.config as Record<string, unknown>).data as Record<string, unknown>[]
        : [];
    const chartConfig = {
      ...artifact,
      data: undefined,
      insight: undefined,
    };
    const tags = Array.from(new Set([
      rawType,
      String(artifact.chartType || artifact.comparisonType || artifactType),
      ...(params.tags || []),
    ].filter(Boolean)));

    const dbResult = await query(
      `INSERT INTO intelligence_artifacts
       (user_id, artifact_type, title, description, chart_config, data, insight,
        generated_by, conversation_id, analysis_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        params.userId,
        artifactType,
        title,
        description,
        JSON.stringify(chartConfig),
        JSON.stringify(data),
        description,
        params.generatedBy || 'chat',
        params.conversationId || null,
        params.analysisId || null,
        tags,
      ]
    );

    return mapRow(dbResult.rows[0]);
  }

  private mapChartArtifactType(chartType: string): ArtifactType {
    if (chartType.includes('scatter')) return 'scatter';
    if (chartType.includes('heatmap')) return 'heatmap';
    if (chartType.includes('gauge')) return 'gauge';
    if (chartType.includes('timeline') || chartType.includes('time_series') || chartType.includes('trend')) return 'timeline';
    return 'chart';
  }

  async generateFromAnalysis(
    userId: string,
    analysisId: string,
    result: AnalysisResult,
    conversationId?: string,
    messageId?: string
  ): Promise<IntelligenceArtifact> {
    let artifactType: ArtifactType;
    let title: string;
    let chartConfig: Record<string, unknown>;
    let data: Record<string, unknown>[];
    const tags: string[] = [result.type];

    switch (result.type) {
      case 'correlation': {
        const corr = result.correlation!;
        artifactType = 'scatter';
        title = `Correlation Analysis (r = ${corr.r.toFixed(3)})`;
        chartConfig = {
          chartType: 'correlation_scatter',
          xAxisLabel: 'Metric A',
          yAxisLabel: 'Metric B',
          trendLine: { slope: corr.r, visible: true },
          annotations: [
            { label: `r = ${corr.r.toFixed(3)} (${corr.interpretation})`, position: 'top-right' },
          ],
        };
        data = [{ r: corr.r, pValue: corr.pValue, n: corr.n, interpretation: corr.interpretation }];
        tags.push('statistics');
        break;
      }

      case 'trend': {
        const trend = result.trend!;
        artifactType = 'chart';
        title = `Trend Analysis — ${trend.direction}`;
        chartConfig = {
          chartType: 'time_series',
          showTrendLine: true,
          slope: trend.slope,
          intercept: trend.intercept,
          annotations: [
            { label: `${trend.changePerWeek >= 0 ? '+' : ''}${trend.changePerWeek.toFixed(2)}/week`, position: 'top-right' },
          ],
        };
        data = [{ slope: trend.slope, intercept: trend.intercept, changePerWeek: trend.changePerWeek, direction: trend.direction }];
        tags.push('trend');
        break;
      }

      case 'anomaly': {
        const anom = result.anomalies!;
        artifactType = 'chart';
        title = `Anomaly Detection — ${anom.anomalies.length} found`;
        chartConfig = {
          chartType: 'time_series',
          showAnomolies: true,
          referenceLines: [
            { y: anom.baselineMean, label: 'Mean', stroke: '#94a3b8' },
            { y: anom.baselineMean + 2 * anom.baselineStdDev, label: '+2σ', stroke: '#f59e0b', strokeDasharray: '4 4' },
            { y: anom.baselineMean - 2 * anom.baselineStdDev, label: '-2σ', stroke: '#f59e0b', strokeDasharray: '4 4' },
          ],
        };
        data = anom.anomalies.map((a) => ({ date: a.date, value: a.value, zScore: a.zScore }));
        tags.push('anomaly');
        break;
      }

      case 'comparison': {
        const comp = result.comparison!;
        artifactType = 'comparison';
        title = `${comp.periodA.label} vs ${comp.periodB.label}`;
        chartConfig = {
          chartType: 'comparison_bar',
          groupLabels: [comp.periodA.label, comp.periodB.label],
          deltaHighlight: comp.deltaPercent,
        };
        data = [
          { label: comp.periodA.label, mean: comp.periodA.mean, stdDev: comp.periodA.stdDev, count: comp.periodA.count },
          { label: comp.periodB.label, mean: comp.periodB.mean, stdDev: comp.periodB.stdDev, count: comp.periodB.count },
        ];
        tags.push('comparison');
        break;
      }

      default:
        artifactType = 'report';
        title = `Analysis Report`;
        chartConfig = {};
        data = [];
    }

    const dbResult = await query(
      `INSERT INTO intelligence_artifacts
       (user_id, artifact_type, title, description, chart_config, data, insight,
        generated_by, trigger_message_id, conversation_id, analysis_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'deep_analysis', $8, $9, $10, $11)
       RETURNING *`,
      [
        userId, artifactType, title, result.narrative,
        JSON.stringify(chartConfig), JSON.stringify(data),
        result.narrative,
        messageId || null, conversationId || null, analysisId,
        tags,
      ]
    );

    return mapRow(dbResult.rows[0]);
  }

  async generateComparison(
    userId: string,
    title: string,
    items: Array<{ label: string; current: number; target?: number; trend?: 'up' | 'down' | 'stable'; unit?: string }>,
    conversationId?: string
  ): Promise<IntelligenceArtifact> {
    const dbResult = await query(
      `INSERT INTO intelligence_artifacts
       (user_id, artifact_type, title, chart_config, data, generated_by, conversation_id, tags)
       VALUES ($1, 'comparison', $2, $3, $4, 'chat', $5, $6)
       RETURNING *`,
      [
        userId, title,
        JSON.stringify({ chartType: 'comparison_bar', items: items.length }),
        JSON.stringify(items),
        conversationId || null,
        ['comparison', 'weekly'],
      ]
    );

    return mapRow(dbResult.rows[0]);
  }
}

export const artifactGenerationService = new ArtifactGenerationService();
