// Beneficiaries (contract 2026-10, G1): one designation per subject — a group member (insuredUuid) or
// an individual policy (benefitUuid) — replaced as a whole and kept as numbered versions.
import { lifeApi } from "./lifeClient";

/** GET /beneficiary/list · query: insuredUuid | benefitUuid · returns: BeneficiaryDesignationResponse (version 0 + statutoryDefault when none was made) */
export function getBeneficiaryDesignation(params = {}) {
  return lifeApi().get(`/beneficiary/list`, { params });
}
/** PUT /beneficiary/designation · body: BeneficiaryDesignationRequest · replaces the whole designation; 409 while a death claim is open */
export function saveBeneficiaryDesignation(data) {
  return lifeApi().put(`/beneficiary/designation`, data);
}
/** GET /beneficiary/{beneficiaryUuid} · returns: BeneficiaryResponse */
export function getBeneficiary(beneficiaryUuid) {
  return lifeApi().get(`/beneficiary/${beneficiaryUuid}`);
}
/** GET /beneficiary/history · query: insuredUuid | benefitUuid · returns: BeneficiaryDesignationResponse[] (newest first) */
export function getBeneficiaryHistory(params = {}) {
  return lifeApi().get(`/beneficiary/history`, { params });
}
