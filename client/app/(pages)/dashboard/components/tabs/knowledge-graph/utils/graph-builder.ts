/**
 * @file Graph Builder
 * @description Aggregates raw API nodes by category into hub + daily nodes,
 * outputs D3-force compatible { nodes, links } format.
 */

import type {
  KnowledgeGraphData,
  GraphNode,
  GraphNodeCategory,
} from '@shared/types/domain/knowledge-graph';
import {
  CATEGORY_COLORS,
  AI_COACH_NODE_COLOR,
  FEATURE_STATUS_COLORS,
  REASONING_EDGE_COLORS,
  REASONING_NODE_RADIUS,
} from '../constants/graph-config';
import type {
  ReasoningOverlayData,
} from '@/src/shared/services/knowledge-graph.service';

// ============================================
// D3 graph types
// ============================================

export interface D3Node {
  id: string;
  label: string;
  category: GraphNodeCategory;
  nodeKind: 'hub' | 'daily' | 'special';
  r: number; // radius
  color: string;
  entries: GraphNode[];
  entryCount: number;
  date?: string;
  forceLabel: boolean;
  healthScore?: number;
  status?: 'active' | 'dormant' | 'never_used';
  isBrain?: boolean;
  route?: string;
  // D3 will add these:
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  value: number; // thickness
  color: string;
  label?: string;
}

export interface D3GraphData {
  nodes: D3Node[];
  links: D3Link[];
}

// ============================================
// Helpers
// ============================================

function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return 'Unknown';
  // Extract YYYY-MM-DD from any format: "2026-04-06", "2026-04-06T14:30:00Z", etc.
  const match = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(dateStr).slice(0, 10) || 'Unknown';
  const month = MONTH_NAMES[parseInt(match[2], 10) - 1] || match[2];
  const day = parseInt(match[3], 10);
  return `${month} ${day}`;
}

/** Normalize any date value to YYYY-MM-DD string */
function normalizeDate(val: unknown): string {
  if (!val) return '';
  const s = String(val);
  const match = s.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s.slice(0, 10);
}

const CATEGORY_ORDER: GraphNodeCategory[] = [
  'fitness', 'nutrition', 'wellbeing', 'biometrics',
  'goals', 'hydration', 'intelligence', 'coaching', 'finance',
];

// ============================================
// Main builder
// ============================================

export function buildD3Graph(data: KnowledgeGraphData): D3GraphData {
  const nodes: D3Node[] = [];
  const links: D3Link[] = [];

  if (!data.nodes.length) return { nodes, links };

  // Group raw nodes by category
  const byCategory = new Map<GraphNodeCategory, GraphNode[]>();
  for (const node of data.nodes) {
    const list = byCategory.get(node.category) || [];
    list.push(node);
    byCategory.set(node.category, list);
  }

  const activeCategories = CATEGORY_ORDER.filter((c) => byCategory.has(c));

  // Create hub + daily nodes per category
  for (const cat of activeCategories) {
    const entries = byCategory.get(cat)!;
    const color = CATEGORY_COLORS[cat];
    const hubId = `hub:${cat}`;
    const hubR = Math.max(24, Math.min(42, 20 + entries.length * 1.2));

    nodes.push({
      id: hubId,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      category: cat,
      nodeKind: 'hub',
      r: hubR,
      color,
      entries,
      entryCount: entries.length,
      forceLabel: true,
    });

    // Group entries by date (normalize to YYYY-MM-DD)
    const byDate = new Map<string, GraphNode[]>();
    for (const entry of entries) {
      const dateKey = normalizeDate(entry.date) || 'unknown';
      const list = byDate.get(dateKey) || [];
      list.push(entry);
      byDate.set(dateKey, list);
    }

    const dates = [...byDate.keys()].sort();
    for (const date of dates) {
      const dateEntries = byDate.get(date)!;
      const dailyId = `daily:${cat}:${date}`;
      const dailyR = Math.max(7, Math.min(16, 5 + dateEntries.length * 1.5));

      nodes.push({
        id: dailyId,
        label: `${formatDateShort(date)} (${dateEntries.length})`,
        category: cat,
        nodeKind: 'daily',
        r: dailyR,
        color: darkenHex(color, 0.3),
        entries: dateEntries,
        entryCount: dateEntries.length,
        date,
        forceLabel: false,
      });

      // Hub → daily link
      links.push({
        source: hubId,
        target: dailyId,
        value: Math.max(1, dateEntries.length * 0.4),
        color,
      });
    }
  }

  // Cross-category hub edges (shared dates)
  for (let i = 0; i < activeCategories.length; i++) {
    for (let j = i + 1; j < activeCategories.length; j++) {
      const catA = activeCategories[i];
      const catB = activeCategories[j];
      const datesA = new Set(byCategory.get(catA)!.map((e) => normalizeDate(e.date)));
      const datesB = new Set(byCategory.get(catB)!.map((e) => normalizeDate(e.date)));
      let shared = 0;
      for (const d of datesA) if (datesB.has(d)) shared++;

      if (shared > 0) {
        links.push({
          source: `hub:${catA}`,
          target: `hub:${catB}`,
          value: 1 + Math.min(shared / 3, 3),
          color: CATEGORY_COLORS[catA],
        });
      }
    }
  }

  // Special nodes (daily_score, contradictions)
  for (const node of data.nodes) {
    if (node.type === 'daily_score' || node.type === 'contradiction' || node.type === 'weekly_report') {
      const specialId = `special:${node.id}`;
      const color = node.type === 'daily_score' ? '#FFBE0B' : node.type === 'weekly_report' ? '#818CF8' : '#EF4444';

      nodes.push({
        id: specialId,
        label: node.label,
        category: 'intelligence',
        nodeKind: 'special',
        r: node.type === 'daily_score' ? 16 : node.type === 'weekly_report' ? 14 : 12,
        color,
        entries: [node],
        entryCount: 1,
        date: node.date,
        forceLabel: true,
      });

      // Connect to intelligence hub
      const intHubExists = nodes.some((n) => n.id === 'hub:intelligence');
      if (intHubExists) {
        links.push({
          source: 'hub:intelligence',
          target: specialId,
          value: 1.5,
          color,
        });
      }
    }
  }

  return { nodes, links };
}

// ============================================
// Reasoning graph builder (Architecture View)
// ============================================

export function buildReasoningGraph(data: ReasoningOverlayData): D3GraphData {
  const nodes: D3Node[] = [];
  const links: D3Link[] = [];

  for (const node of data.nodes) {
    const isBrain = node.id === 'ai-coach';
    const isActive = node.status === 'active';

    const color = isBrain
      ? AI_COACH_NODE_COLOR
      : isActive
        ? (CATEGORY_COLORS as Record<string, string>)[node.category] || '#64748B'
        : (FEATURE_STATUS_COLORS as Record<string, string>)[node.status] || '#334155';

    const r = isBrain
      ? REASONING_NODE_RADIUS.brain
      : node.parentNodeId === 'ai-coach' || node.parentNodeId === null
        ? REASONING_NODE_RADIUS.hub
        : REASONING_NODE_RADIUS.leaf;

    nodes.push({
      id: node.id,
      label: node.label,
      category: (node.category || 'intelligence') as GraphNodeCategory,
      nodeKind: isBrain ? 'special' : 'hub',
      r,
      color,
      entries: [],
      entryCount: node.activityCount7d,
      forceLabel: true,
      healthScore: node.healthScore,
      status: node.status,
      isBrain,
      route: node.route,
    });
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const edge of data.edges) {
    if (!edge.source || !edge.target || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    const edgeColor = (REASONING_EDGE_COLORS as Record<string, string>)[edge.edgeType] || '#475569';
    links.push({
      source: edge.source,
      target: edge.target,
      value: Math.max(0.5, (edge.weight || 0.5) * 3),
      color: edgeColor,
      label: edge.label,
    });
  }

  return { nodes, links };
}
