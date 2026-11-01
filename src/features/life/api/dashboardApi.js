// Life dashboard figures (gap G8, backend contract 2026-10).
import { lifeApi } from "./lifeClient";

/**
 * GET /dashboard/summary · query: from?, to? (dates) · returns: counts by quotation, policy and claim
 * status, plus grossWrittenPremium, premiumCollected, premiumOutstanding, claimsPaid, sumAssuredInForce
 */
export function getDashboardSummary(params = {}) {
  return lifeApi().get(`/dashboard/summary`, { params });
}
