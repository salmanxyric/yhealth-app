/**
 * Knowledge Graph Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  getGraphSchema,
  searchNodesSchema,
  explainGraphSchema,
  exportGraphSchema,
} from '../../../src/validators/knowledge-graph.validator.js';

describe('Knowledge Graph Validators', () => {
  describe('getGraphSchema', () => {
    const validData = {
      from: '2024-01-01',
      to: '2024-12-31',
    };

    it('should accept valid date range', () => {
      const result = getGraphSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing from', () => {
      const result = getGraphSchema.safeParse({ to: '2024-12-31' });
      expect(result.success).toBe(false);
    });

    it('should reject missing to', () => {
      const result = getGraphSchema.safeParse({ from: '2024-01-01' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const result = getGraphSchema.safeParse({ from: '01-01-2024', to: '2024-12-31' });
      expect(result.success).toBe(false);
    });

    it('should transform categories string to array', () => {
      const result = getGraphSchema.safeParse({
        ...validData,
        categories: 'fitness,nutrition',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toEqual(['fitness', 'nutrition']);
      }
    });

    it('should transform empty categories to undefined', () => {
      const result = getGraphSchema.safeParse({ ...validData, categories: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toBeUndefined();
      }
    });

    it('should transform includeAI string to boolean', () => {
      const result = getGraphSchema.safeParse({ ...validData, includeAI: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeAI).toBe(true);
      }
    });

    it('should default maxNodes to 200', () => {
      const result = getGraphSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxNodes).toBe(200);
      }
    });

    it('should cap maxNodes at 500', () => {
      const result = getGraphSchema.safeParse({ ...validData, maxNodes: '1000' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxNodes).toBe(500);
      }
    });

    it('should enforce minNodes of 10', () => {
      const result = getGraphSchema.safeParse({ ...validData, maxNodes: '1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxNodes).toBe(10);
      }
    });

    it('should accept valid focusNodeId', () => {
      const result = getGraphSchema.safeParse({
        ...validData,
        focusNodeId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('searchNodesSchema', () => {
    it('should accept valid query', () => {
      const result = searchNodesSchema.safeParse({ query: 'fitness' });
      expect(result.success).toBe(true);
    });

    it('should reject empty query', () => {
      const result = searchNodesSchema.safeParse({ query: '' });
      expect(result.success).toBe(false);
    });

    it('should reject query exceeding 200 characters', () => {
      const result = searchNodesSchema.safeParse({ query: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should accept optional date filters', () => {
      const result = searchNodesSchema.safeParse({
        query: 'test',
        from: '2024-01-01',
        to: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format in from', () => {
      const result = searchNodesSchema.safeParse({ query: 'test', from: 'bad-date' });
      expect(result.success).toBe(false);
    });
  });

  describe('explainGraphSchema', () => {
    const validData = {
      graphSummary: {
        totalNodes: 50,
        totalEdges: 100,
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
      },
    };

    it('should accept valid graph summary', () => {
      const result = explainGraphSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept with optional nodeCountByCategory', () => {
      const result = explainGraphSchema.safeParse({
        graphSummary: {
          ...validData.graphSummary,
          nodeCountByCategory: { fitness: 10, nutrition: 20 },
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing totalNodes', () => {
      const result = explainGraphSchema.safeParse({
        graphSummary: { totalEdges: 10, dateRange: { from: '2024-01-01', to: '2024-12-31' } },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing dateRange', () => {
      const result = explainGraphSchema.safeParse({
        graphSummary: { totalNodes: 10, totalEdges: 10 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('exportGraphSchema', () => {
    it('should accept json format', () => {
      const result = exportGraphSchema.safeParse({
        format: 'json',
        from: '2024-01-01',
        to: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should accept csv format', () => {
      const result = exportGraphSchema.safeParse({
        format: 'csv',
        from: '2024-01-01',
        to: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = exportGraphSchema.safeParse({
        format: 'xml',
        from: '2024-01-01',
        to: '2024-12-31',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing from date', () => {
      const result = exportGraphSchema.safeParse({ format: 'json', to: '2024-12-31' });
      expect(result.success).toBe(false);
    });
  });
});
