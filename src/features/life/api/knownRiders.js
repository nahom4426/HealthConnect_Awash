import { getModifiedRiders, getRiders } from "./productApi";

/**
 * GET /rider/active + GET /rider/modified · returns: RiderResponse[] — every rider an existing quotation
 * or policy can still carry (ACTIVE, then MODIFIED and DISABLED). Only ACTIVE ones can be added to new cover.
 */
export async function getKnownRiders() {
  const [active, inactive] = await Promise.all([getRiders(), getModifiedRiders()]);
  if (!active?.success) return active;
  return { ...active, data: [...(active.data || []), ...(inactive?.success ? inactive.data || [] : [])] };
}
