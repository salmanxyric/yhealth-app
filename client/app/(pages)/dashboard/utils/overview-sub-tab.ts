export const OVERVIEW_SUB_TABS = [
  'dashboard',
  'analytics',
  'scoring',
  'alarms',
] as const;

export type OverviewSubTab = (typeof OVERVIEW_SUB_TABS)[number];

export function parseOverviewSubParam(raw: string | null): OverviewSubTab {
  if (raw && OVERVIEW_SUB_TABS.includes(raw as OverviewSubTab)) {
    return raw as OverviewSubTab;
  }
  return 'dashboard';
}
