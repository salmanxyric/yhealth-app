/**
 * Pure persona directive builder — used by comprehensive context + LangGraph prompts.
 */

import { describe, it, expect } from '@jest/globals';
import {
  buildPersonaDirectiveBlock,
  normalizePersona,
} from '../../../src/services/coach-persona-prompt.service.js';

describe('coach-persona-prompt.service', () => {
  it('normalizePersona falls back to friend for invalid values', () => {
    expect(normalizePersona(null)).toBe('friend');
    expect(normalizePersona(undefined)).toBe('friend');
    expect(normalizePersona('not-a-persona')).toBe('friend');
  });

  it('normalizePersona maps legacy ids to v2 personas', () => {
    expect(normalizePersona('drill_sergeant')).toBe('commander');
    expect(normalizePersona('data_driven_neutral')).toBe('data_nerd');
    expect(normalizePersona('gentle_friend')).toBe('friend');
  });

  it('normalizePersona accepts valid v2 persona ids', () => {
    expect(normalizePersona('commander')).toBe('commander');
    expect(normalizePersona('friend')).toBe('friend');
    expect(normalizePersona('data_nerd')).toBe('data_nerd');
    expect(normalizePersona('guardian')).toBe('guardian');
  });

  it('buildPersonaDirectiveBlock returns distinct copy per persona', () => {
    const commander = buildPersonaDirectiveBlock('commander');
    const friend = buildPersonaDirectiveBlock('friend');
    const data = buildPersonaDirectiveBlock('data_nerd');
    expect(commander).toContain('Commander');
    expect(friend).toContain('Friend');
    expect(data).toContain('Data nerd');
    expect(commander).not.toEqual(friend);
    expect(commander).not.toEqual(data);
  });
});
