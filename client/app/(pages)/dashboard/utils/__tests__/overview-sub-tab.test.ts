import {
  parseOverviewSubParam,
  OVERVIEW_SUB_TABS,
} from '../overview-sub-tab';

describe('parseOverviewSubParam', () => {
  it('returns dashboard for null or empty', () => {
    expect(parseOverviewSubParam(null)).toBe('dashboard');
    expect(parseOverviewSubParam('')).toBe('dashboard');
  });

  it('returns valid overview sub tabs', () => {
    for (const id of OVERVIEW_SUB_TABS) {
      expect(parseOverviewSubParam(id)).toBe(id);
    }
  });

  it('rejects unknown values', () => {
    expect(parseOverviewSubParam('nope')).toBe('dashboard');
    expect(parseOverviewSubParam('settings')).toBe('dashboard');
  });
});
