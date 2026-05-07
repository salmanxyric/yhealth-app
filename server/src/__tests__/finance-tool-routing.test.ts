import { describe, expect, it } from '@jest/globals';
import { registerFinanceTools } from '../services/langgraph-tools/domains/finance.js';
import { classifyIntent, TOOL_GROUPS } from '../services/tool-router.service.js';

describe('finance tool routing', () => {
  it('classifies financial report requests as finance intent', () => {
    const intent = classifyIntent('share my prev financial report');

    expect(intent.primary).toBe('finance');
  });

  it('registers finance report tools', () => {
    const tools = registerFinanceTools('00000000-0000-0000-0000-000000000000');
    const names = tools.map((tool) => tool.name);

    expect(names).toContain('getFinancialReport');
    expect(names).toContain('getFinancialSummary');
  });

  it('includes report tools in the finance routing group', () => {
    expect(TOOL_GROUPS.finance).toContain('getFinancialReport');
    expect(TOOL_GROUPS.finance).toContain('getFinancialSummary');
  });
});
