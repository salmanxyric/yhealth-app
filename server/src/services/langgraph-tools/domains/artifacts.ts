import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';
import { artifactGenerationService } from '../../artifact-generation.service.js';

const GenerateChartSchema = z.object({
  chartType: z.enum([
    'line',
    'bar',
    'area',
    'pie',
    'radar',
    'scatter',
    'correlation_scatter',
    'time_series',
    'comparison_bar',
    'distribution_histogram',
    'heatmap_calendar',
    'radar_multi',
    'trend_area',
    'box_whisker',
    'funnel_progression',
    'gauge',
    'gauge_current',
  ]).describe('Type of chart to render'),
  title: z.string().min(1).max(200).describe('Chart title displayed above the visualization'),
  data: z.array(z.record(z.unknown())).min(1).describe('Array of data points. Each object is one data point with named keys matching the dataKeys.'),
  xAxisKey: z.string().describe('Key in data objects to use for x-axis labels'),
  dataKeys: z.array(z.object({
    key: z.string().describe('Key in data objects for this series'),
    label: z.string().describe('Display label for this series'),
    color: z.string().optional().describe('Hex color for this series (e.g., "#10b981")'),
  })).min(1).describe('Data series to plot'),
  yAxisLabel: z.string().optional().describe('Label for y-axis'),
  xAxisLabel: z.string().optional().describe('Label for x-axis'),
  stacked: z.boolean().optional().describe('Stack bar/area series'),
  insight: z.string().optional().describe('Brief insight or takeaway to display below the chart'),
  annotations: z.array(z.object({
    label: z.string(),
    color: z.string().optional(),
  })).optional(),
  statistics: z.record(z.unknown()).optional(),
});

const GenerateComparisonSchema = z.object({
  title: z.string().min(1).max(200).describe('Comparison title'),
  items: z.array(z.object({
    label: z.string(),
    current: z.number(),
    target: z.number().optional(),
    unit: z.string().optional(),
    trend: z.enum(['up', 'down', 'flat']).optional(),
  })).min(1).describe('Items to compare'),
  insight: z.string().optional(),
});

async function persistArtifact(userId: string, artifact: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const saved = await artifactGenerationService.saveInlineArtifact({
      userId,
      artifact,
      generatedBy: 'chat',
      tags: ['ai-coach', 'manual-artifact'],
    });
    return { ...artifact, artifactId: saved.id, saved: true };
  } catch {
    return { ...artifact, saved: false };
  }
}

async function generateChart(userId: string, params: z.infer<typeof GenerateChartSchema>): Promise<string> {
  const artifact = {
    type: 'chart' as const,
    chartType: params.chartType,
    title: params.title,
    data: params.data,
    xAxisKey: params.xAxisKey,
    dataKeys: params.dataKeys.map(dk => ({
      key: dk.key,
      label: dk.label,
      color: dk.color || getDefaultColor(params.dataKeys.indexOf(dk)),
    })),
    yAxisLabel: params.yAxisLabel,
    xAxisLabel: params.xAxisLabel,
    stacked: params.stacked || false,
    insight: params.insight,
    annotations: params.annotations,
    statistics: params.statistics,
  };

  const savedArtifact = await persistArtifact(userId, artifact);
  return JSON.stringify({ success: true, artifact: savedArtifact });
}

async function generateComparison(userId: string, params: z.infer<typeof GenerateComparisonSchema>): Promise<string> {
  const artifact = {
    type: 'comparison' as const,
    title: params.title,
    items: params.items,
    insight: params.insight,
  };

  const savedArtifact = await persistArtifact(userId, artifact);
  return JSON.stringify({ success: true, artifact: savedArtifact });
}

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function getDefaultColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function registerArtifactTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'generateChart',
      description: 'Generate and save a chart artifact (line, bar, area, pie, radar, scatter, histogram, heatmap, gauge, funnel, box-whisker) from data. Use when the user asks to see trends, comparisons, distributions, or visualizations of their health data.',
      schema: GenerateChartSchema,
      handler: withErrorHandling('generateChart', generateChart),
      icon: 'bar-chart-3',
      mutationType: 'read',
      semanticDelta: (params) => `${params.chartType} chart: ${params.title}`,
    },
    {
      name: 'generateComparison',
      description: 'Generate a comparison card showing current values vs targets with trends. Use when comparing metrics like calories consumed vs target, actual vs planned workouts, etc.',
      schema: GenerateComparisonSchema,
      handler: withErrorHandling('generateComparison', generateComparison),
      icon: 'git-compare',
      mutationType: 'read',
      semanticDelta: (params) => `Comparison: ${params.title}`,
    },
  ];
}
