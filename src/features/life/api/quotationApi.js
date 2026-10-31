// Generated from the Life Insurance OpenAPI document (operationId = function name).
// Group quotations (the application stage), quoted riders and the insured-person list.
import { lifeApi } from "./lifeClient";

// ── quotation ──
/** GET /quotation/{quotationUuid} · returns: QuotationResponse */
export function getQuotation(quotationUuid) {
  return lifeApi().get(`/quotation/${quotationUuid}`);
}
/** PUT /quotation/{quotationUuid} · body: QuotationRequest · returns: QuotationResponse */
export function updateQuotation(quotationUuid, data) {
  return lifeApi().put(`/quotation/${quotationUuid}`, data);
}
/** DELETE /quotation/{quotationUuid} · returns: object */
export function deleteQuotation(quotationUuid) {
  return lifeApi().delete(`/quotation/${quotationUuid}`);
}
/** PUT /quotation/pay/{quotationUuid} · query: receiptNumber: string, withHoldingTax*: number, revenueStamp*: number, netPremium*: number, receiptDate*: string, requestedPremium*: number · returns: QuotationResponse */
export function payQuotation(quotationUuid, params = {}) {
  return lifeApi().put(`/quotation/pay/${quotationUuid}`, undefined, { params });
}
/** PUT /quotation/issue/{quotationUuid} · returns: QuotationResponse */
export function issueQuotation(quotationUuid) {
  return lifeApi().put(`/quotation/issue/${quotationUuid}`, undefined);
}
/** PUT /quotation/accept/{quotationUuid} · returns: QuotationResponse */
export function acceptQuotation(quotationUuid) {
  return lifeApi().put(`/quotation/accept/${quotationUuid}`, undefined);
}
/** POST /quotation · body: QuotationRequest · returns: QuotationResponse */
export function createQuotation(data) {
  return lifeApi().post(`/quotation`, data);
}
/** POST /quotation/revise/{quotationUuid} · returns: QuotationResponse */
export function reviseQuotation(quotationUuid) {
  return lifeApi().post(`/quotation/revise/${quotationUuid}`, undefined);
}
/** GET /quotation/list · query: page: integer, limit: integer, status*: string (PENDING | ISSUED | ACCEPTED | PAID), search: string · returns: QuotationResponse[] */
export function getQuotations(params = {}) {
  return lifeApi().get(`/quotation/list`, { params });
}

// ── quoted-rider ──
/** GET /quoted-rider · query: quotationUuid*: string · returns: QuotedRiderResponse[] */
export function getQuotedRiders(params = {}) {
  return lifeApi().get(`/quoted-rider`, { params });
}
/** PUT /quoted-rider · body: QuotedRiderUpdateRequest[] · returns: QuotedRiderResponse[] */
export function updateQuotedRider(data) {
  return lifeApi().put(`/quoted-rider`, data);
}
/** POST /quoted-rider · body: QuotedRiderRequest[] · returns: QuotedRiderResponse[] */
export function createQuotedRider(data) {
  return lifeApi().post(`/quoted-rider`, data);
}
/** GET /quoted-rider/{quotedRiderUuid} · returns: QuotationResponse (as documented; likely meant QuotedRiderResponse) */
export function getQuotedRider(quotedRiderUuid) {
  return lifeApi().get(`/quoted-rider/${quotedRiderUuid}`);
}
/** DELETE /quoted-rider/{quotedRiderUuid} · returns: object */
export function deleteQuotedRider(quotedRiderUuid) {
  return lifeApi().delete(`/quoted-rider/${quotedRiderUuid}`);
}

// ── insured ──
/** GET /insuredperson/{insuredUuid} · returns: InsuredResponse */
export function getInsuredPerson(insuredUuid) {
  return lifeApi().get(`/insuredperson/${insuredUuid}`);
}
/** PUT /insuredperson/{insuredUuid} · body: InsuredRequest · returns: MessageResponse */
export function updateInsuredPerson(insuredUuid, data) {
  return lifeApi().put(`/insuredperson/${insuredUuid}`, data);
}
/** DELETE /insuredperson/{insuredUuid} · returns: MessageResponse */
export function deleteInsuredPerson(insuredUuid) {
  return lifeApi().delete(`/insuredperson/${insuredUuid}`);
}
/** POST /insuredperson · body: InsuredRequest · returns: MessageResponse */
export function createInsuredPerson(data) {
  return lifeApi().post(`/insuredperson`, data);
}
/** POST /insuredperson/import-insured-person · query: institutionUuid*: string, qutoationUuid*: string (sic, backend spelling) · body: multipart/form-data · returns: MessageResponse */
export function importInsuredPerson(formData, params = {}) {
  return lifeApi().post(`/insuredperson/import-insured-person`, formData, { params, headers: { 'Content-Type': 'multipart/form-data' } });
}
/** GET /insuredperson/reinsurance/list/{quotationUuid} · query: search: string, page: integer, limit: integer · returns: InsuredResponse[] */
export function getInsuredPersonListReinsured(quotationUuid, params = {}) {
  return lifeApi().get(`/insuredperson/reinsurance/list/${quotationUuid}`, { params });
}
/** GET /insuredperson/list/{quotationUuid} · query: search: string, page: integer, limit: integer · returns: InsuredResponse[] */
export function getInsuredPersons(quotationUuid, params = {}) {
  return lifeApi().get(`/insuredperson/list/${quotationUuid}`, { params });
}
/** GET /insuredperson/import-insured-person/sample · returns: file (Excel template) */
export function exportInsuredPersonSample() {
  return lifeApi().get(`/insuredperson/import-insured-person/sample`, { responseType: 'blob' });
}
