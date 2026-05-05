/**
 * Life areas dashboard + resolved links (mirrors server life-areas.service shapes).
 */
export interface LifeAreaSummaryRow {
  id: string;
  display_name: string;
  domain_type: string;
  link_count: number;
}

export interface LifeAreasDashboardSummary {
  activeAreaCount: number;
  totalLinks: number;
  areas: LifeAreaSummaryRow[];
}
