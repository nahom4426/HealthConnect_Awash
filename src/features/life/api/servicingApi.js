// Policy servicing (contract 2026-10, G5): cancel, lapse, reinstate and renew, and endorsements, for a
// group policy (by quotationUuid) or an individual policy (by benefitUuid). Refunds and pro-rata
// premium adjustments are calculated by the backend.
import { lifeApi } from "./lifeClient";

const base = (kind, uuid) => (kind === "benefit" ? `/benefit/${uuid}` : `/policy/${uuid}`);

/**
 * PUT /policy/{quotationUuid}/{action} or /benefit/{benefitUuid}/{action}
 * · body: ServicingRequest { effectiveDate*, reason*, note?, healthEvidenceReceived? } · returns: ServicingResponse
 * @param {'policy'|'benefit'} kind
 * @param {'cancel'|'lapse'|'reinstate'|'renew'} action
 */
export function servicePolicy(kind, uuid, action, data) {
  return lifeApi().put(`${base(kind, uuid)}/${action}`, data);
}
/** POST /policy/{q}/endorsement or /benefit/{uuid}/endorsement · body: EndorsementRequest · returns: EndorsementResponse (premiumAdjustment) */
export function createEndorsement(kind, uuid, data) {
  return lifeApi().post(`${base(kind, uuid)}/endorsement`, data);
}
/** GET /policy/{q}/endorsements or /benefit/{uuid}/endorsements · returns: EndorsementResponse[] */
export function getEndorsements(kind, uuid) {
  return lifeApi().get(`${base(kind, uuid)}/endorsements`);
}
/** GET /policy/{uuid}/schedule.pdf · uuid: quotationUuid or benefitUuid · returns: PDF */
export function getPolicySchedulePdf(uuid) {
  return lifeApi().get(`/policy/${uuid}/schedule.pdf`, { responseType: "blob" });
}
