/**
 * Feature Node Registry Unit Tests
 *
 * Validates the 29-node knowledge tree structure, lookup helpers,
 * edge generation, ancestor chains, and tool group resolution.
 */

import { describe, it, expect } from '@jest/globals';
import {
  FEATURE_NODE_REGISTRY,
  getFeatureNode,
  getFeatureNodeOrThrow,
  getAllFeatureNodeIds,
  getDirectChildrenOf,
  getAncestorChain,
  getToolGroupsForFeature,
  featureNodeForToolGroup,
  getDefaultEdges,
  STATIC_CROSS_EDGES,
} from '../../../../src/services/reasoning-graph/feature-node-registry.js';
import type { FeatureNodeId } from '@shared/types/domain/reasoning-graph.js';

// ============================================
// TREE STRUCTURE INTEGRITY
// ============================================

describe('Feature Node Registry — Tree Structure', () => {
  it('should contain exactly 29 feature nodes', () => {
    expect(FEATURE_NODE_REGISTRY).toHaveLength(29);
  });

  it('should have ai-coach as the root node with no parent', () => {
    const root = getFeatureNode('ai-coach');
    expect(root).toBeDefined();
    expect(root!.parentNodeId).toBeNull();
    expect(root!.label).toBe('AI Coach');
    expect(root!.category).toBe('coaching');
  });

  it('should have unique IDs for all nodes', () => {
    const ids = FEATURE_NODE_REGISTRY.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique labels for all nodes', () => {
    const labels = FEATURE_NODE_REGISTRY.map((n) => n.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it('should have valid parentNodeId references (every parent exists in registry)', () => {
    const allIds = new Set(FEATURE_NODE_REGISTRY.map((n) => n.id));
    for (const node of FEATURE_NODE_REGISTRY) {
      if (node.parentNodeId !== null) {
        expect(allIds.has(node.parentNodeId)).toBe(true);
      }
    }
  });

  it('should have no circular parent references', () => {
    for (const node of FEATURE_NODE_REGISTRY) {
      const visited = new Set<FeatureNodeId>();
      let current = node;
      while (current.parentNodeId) {
        expect(visited.has(current.id)).toBe(false);
        visited.add(current.id);
        const parent = getFeatureNode(current.parentNodeId);
        if (!parent) break;
        current = parent;
      }
    }
  });

  it('should have exactly 11 top-level nodes (direct children of ai-coach)', () => {
    const topLevel = FEATURE_NODE_REGISTRY.filter(
      (n) => n.parentNodeId === null && n.id !== 'ai-coach'
    );
    expect(topLevel.length).toBe(11);
  });

  it('should have all nodes reachable from ai-coach via parent chain', () => {
    const topLevelIds = new Set(
      FEATURE_NODE_REGISTRY
        .filter((n) => n.parentNodeId === null && n.id !== 'ai-coach')
        .map((n) => n.id),
    );
    for (const node of FEATURE_NODE_REGISTRY) {
      if (node.id === 'ai-coach') continue;
      const chain = getAncestorChain(node.id);
      expect(chain.length).toBeGreaterThan(0);
      // Top-level nodes get ['ai-coach']; deeper nodes chain ends at a top-level node
      const terminus = chain[chain.length - 1];
      expect(terminus === 'ai-coach' || topLevelIds.has(terminus as FeatureNodeId)).toBe(true);
    }
  });

  it('should define correct child hierarchy for workouts', () => {
    const children = getDirectChildrenOf('workouts');
    const childIds = children.map((c) => c.id);
    expect(childIds).toContain('exercises');
    expect(childIds).toContain('yoga');
    expect(childIds).toContain('activity');
  });

  it('should define correct child hierarchy for wellbeing', () => {
    const children = getDirectChildrenOf('wellbeing');
    const childIds = children.map((c) => c.id);
    expect(childIds).toContain('journal');
    expect(childIds).toContain('mood');
    expect(childIds).toContain('pulse');
  });

  it('should define correct child hierarchy for goals', () => {
    const children = getDirectChildrenOf('goals');
    const childIds = children.map((c) => c.id);
    expect(childIds).toContain('achievements');
    expect(childIds).toContain('life-areas');
    expect(childIds).toContain('contracts');
  });

  it('should define correct deep nesting: activity → activity-status', () => {
    const activityChildren = getDirectChildrenOf('activity');
    expect(activityChildren.map((c) => c.id)).toContain('activity-status');
  });

  it('should define correct deep nesting: chat → voice-assistant → call-coach', () => {
    const chatChildren = getDirectChildrenOf('chat');
    expect(chatChildren.map((c) => c.id)).toContain('voice-assistant');

    const voiceChildren = getDirectChildrenOf('voice-assistant');
    expect(voiceChildren.map((c) => c.id)).toContain('call-coach');
  });
});

// ============================================
// NODE DEFINITIONS QUALITY
// ============================================

describe('Feature Node Registry — Node Definitions', () => {
  it('should have non-empty labels for all nodes', () => {
    for (const node of FEATURE_NODE_REGISTRY) {
      expect(node.label.length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty descriptions for all nodes', () => {
    for (const node of FEATURE_NODE_REGISTRY) {
      expect(node.description.length).toBeGreaterThan(10);
    }
  });

  it('should have non-empty routes starting with / for all nodes', () => {
    for (const node of FEATURE_NODE_REGISTRY) {
      expect(node.route).toMatch(/^\//);
    }
  });

  it('should have at least one tool group for every node', () => {
    for (const node of FEATURE_NODE_REGISTRY) {
      expect(node.toolGroups.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have valid category values from the 9 allowed categories', () => {
    const validCategories = new Set([
      'fitness', 'nutrition', 'hydration', 'wellbeing',
      'biometrics', 'goals', 'intelligence', 'coaching', 'finance',
    ]);
    for (const node of FEATURE_NODE_REGISTRY) {
      expect(validCategories.has(node.category)).toBe(true);
    }
  });
});

// ============================================
// LOOKUP HELPERS
// ============================================

describe('Feature Node Registry — Lookup Helpers', () => {
  it('getFeatureNode should return node for valid ID', () => {
    const node = getFeatureNode('workouts');
    expect(node).toBeDefined();
    expect(node!.id).toBe('workouts');
    expect(node!.label).toBe('Workouts');
  });

  it('getFeatureNode should return undefined for invalid ID', () => {
    const node = getFeatureNode('nonexistent' as FeatureNodeId);
    expect(node).toBeUndefined();
  });

  it('getFeatureNodeOrThrow should return node for valid ID', () => {
    const node = getFeatureNodeOrThrow('nutrition');
    expect(node.id).toBe('nutrition');
  });

  it('getFeatureNodeOrThrow should throw for invalid ID', () => {
    expect(() => getFeatureNodeOrThrow('nonexistent' as FeatureNodeId)).toThrow(
      'Feature node not found: nonexistent'
    );
  });

  it('getAllFeatureNodeIds should return all 29 IDs', () => {
    const ids = getAllFeatureNodeIds();
    expect(ids).toHaveLength(29);
    expect(ids).toContain('ai-coach');
    expect(ids).toContain('workouts');
    expect(ids).toContain('call-coach');
  });

  it('getDirectChildrenOf ai-coach should return all top-level nodes', () => {
    const children = getDirectChildrenOf('ai-coach');
    expect(children.length).toBe(11);
    const childIds = children.map((c) => c.id);
    expect(childIds).toContain('workouts');
    expect(childIds).toContain('nutrition');
    expect(childIds).toContain('wellbeing');
    expect(childIds).toContain('goals');
    expect(childIds).not.toContain('ai-coach');
  });

  it('getDirectChildrenOf leaf node should return empty array', () => {
    const children = getDirectChildrenOf('call-coach');
    expect(children).toHaveLength(0);
  });
});

// ============================================
// ANCESTOR CHAINS
// ============================================

describe('Feature Node Registry — Ancestor Chains', () => {
  it('should return [ai-coach] for top-level nodes', () => {
    const chain = getAncestorChain('workouts');
    expect(chain).toEqual(['ai-coach']);
  });

  it('should return correct chain for depth-2 node', () => {
    const chain = getAncestorChain('exercises');
    expect(chain).toEqual(['workouts']);
  });

  it('should return correct chain for depth-3 node', () => {
    const chain = getAncestorChain('activity-status');
    expect(chain).toEqual(['activity', 'workouts']);
  });

  it('should return correct chain for call-coach (depth 3)', () => {
    const chain = getAncestorChain('call-coach');
    expect(chain).toEqual(['voice-assistant', 'chat']);
  });

  it('should return empty chain for ai-coach itself', () => {
    const chain = getAncestorChain('ai-coach');
    expect(chain).toEqual([]);
  });
});

// ============================================
// TOOL GROUP RESOLUTION
// ============================================

describe('Feature Node Registry — Tool Groups', () => {
  it('getToolGroupsForFeature should include own and ancestor tool groups', () => {
    const groups = getToolGroupsForFeature('exercises');
    expect(groups).toContain('workouts');
  });

  it('getToolGroupsForFeature should return own groups for top-level node', () => {
    const groups = getToolGroupsForFeature('nutrition');
    expect(groups).toContain('meals');
  });

  it('getToolGroupsForFeature should return empty for invalid ID', () => {
    const groups = getToolGroupsForFeature('nonexistent' as FeatureNodeId);
    expect(groups).toEqual([]);
  });

  it('getToolGroupsForFeature should include inherited groups for deep nodes', () => {
    const groups = getToolGroupsForFeature('activity-status');
    expect(groups).toContain('status');
    expect(groups).toContain('workouts');
  });

  it('featureNodeForToolGroup should map tool group to feature node', () => {
    expect(featureNodeForToolGroup('workouts')).toBe('workouts');
    expect(featureNodeForToolGroup('meals')).toBe('nutrition');
    expect(featureNodeForToolGroup('goals')).toBe('goals');
    expect(featureNodeForToolGroup('water')).toBe('hydration');
  });

  it('featureNodeForToolGroup should return undefined for unknown group', () => {
    expect(featureNodeForToolGroup('nonexistent_group')).toBeUndefined();
  });
});

// ============================================
// DEFAULT EDGES
// ============================================

describe('Feature Node Registry — Default Edges', () => {
  it('getDefaultEdges should produce 28 coach_manages edges (one per non-root node)', () => {
    const edges = getDefaultEdges();
    expect(edges).toHaveLength(28);
    for (const edge of edges) {
      expect(edge.edgeType).toBe('coach_manages');
    }
  });

  it('getDefaultEdges should not include ai-coach as a target', () => {
    const edges = getDefaultEdges();
    for (const edge of edges) {
      expect(edge.targetNodeId).not.toBe('ai-coach');
    }
  });

  it('getDefaultEdges should have ai-coach as source for top-level nodes', () => {
    const edges = getDefaultEdges();
    const topLevelEdges = edges.filter((e) => e.sourceNodeId === 'ai-coach');
    expect(topLevelEdges.length).toBe(11);
  });

  it('getDefaultEdges should use parent as source for nested nodes', () => {
    const edges = getDefaultEdges();
    const exercisesEdge = edges.find((e) => e.targetNodeId === 'exercises');
    expect(exercisesEdge?.sourceNodeId).toBe('workouts');

    const callCoachEdge = edges.find((e) => e.targetNodeId === 'call-coach');
    expect(callCoachEdge?.sourceNodeId).toBe('voice-assistant');
  });
});

// ============================================
// STATIC CROSS-EDGES
// ============================================

describe('Feature Node Registry — Static Cross-Edges', () => {
  it('should have 14 static cross-edges', () => {
    expect(STATIC_CROSS_EDGES).toHaveLength(14);
  });

  it('should only contain valid edge types', () => {
    const validTypes = new Set(['feeds_data', 'supports', 'requires']);
    for (const edge of STATIC_CROSS_EDGES) {
      expect(validTypes.has(edge.edgeType)).toBe(true);
    }
  });

  it('should have weights between 0 and 1', () => {
    for (const edge of STATIC_CROSS_EDGES) {
      expect(edge.weight).toBeGreaterThan(0);
      expect(edge.weight).toBeLessThanOrEqual(1);
    }
  });

  it('should reference only valid feature node IDs', () => {
    const allIds = new Set(getAllFeatureNodeIds());
    for (const edge of STATIC_CROSS_EDGES) {
      expect(allIds.has(edge.sourceNodeId)).toBe(true);
      expect(allIds.has(edge.targetNodeId)).toBe(true);
    }
  });

  it('should not have self-referencing edges', () => {
    for (const edge of STATIC_CROSS_EDGES) {
      expect(edge.sourceNodeId).not.toBe(edge.targetNodeId);
    }
  });

  it('should include key domain relationships', () => {
    const edgeKeys = STATIC_CROSS_EDGES.map(
      (e) => `${e.sourceNodeId}→${e.targetNodeId}`
    );
    expect(edgeKeys).toContain('nutrition→workouts');
    expect(edgeKeys).toContain('whoop→workouts');
    expect(edgeKeys).toContain('mood→insights');
    expect(edgeKeys).toContain('workouts→progress');
    expect(edgeKeys).toContain('goals→workouts');
    expect(edgeKeys).toContain('goals→nutrition');
  });
});
