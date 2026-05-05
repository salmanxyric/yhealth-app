import type { LifeAreaDomainType } from '../config/life-area-domains.js';

/**
 * Per-request context for semantic tools (life area from intent router this turn).
 * Passed into tool factories so schedule/goal writes can auto-link to `life_area_links`.
 */
export interface ToolTurnContext {
  activeLifeAreaId?: string;
  activeDomainType?: LifeAreaDomainType;
  /** Display name from router chip (optional, for logging) */
  activeLifeAreaName?: string;
}
