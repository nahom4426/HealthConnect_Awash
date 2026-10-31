// Customers (policyholders and payers) and their KYC, from the backend contract of 2026-10 (G2).
// An individual policy can be issued only once its customer's kycStatus is VERIFIED.
import { lifeApi } from "./lifeClient";

/** POST /customer · body: CustomerRequest · returns: CustomerResponse (kycStatus INCOMPLETE) */
export function createCustomer(data) {
  return lifeApi().post(`/customer`, data);
}
/** PUT /customer/{customerUuid} · body: CustomerRequest · returns: CustomerResponse; changing a VERIFIED customer's ID or date of birth sends KYC back to INCOMPLETE */
export function updateCustomer(customerUuid, data) {
  return lifeApi().put(`/customer/${customerUuid}`, data);
}
/** GET /customer/{customerUuid} · returns: CustomerResponse */
export function getCustomer(customerUuid) {
  return lifeApi().get(`/customer/${customerUuid}`);
}
/** GET /customer/list · query: type (INDIVIDUAL | CORPORATE), search, page, limit · returns: { content: CustomerResponse[], page, limit, totalPages, totalElements } */
export function getCustomers(params = {}) {
  return lifeApi().get(`/customer/list`, { params });
}
/** GET /customer/duplicate-check · query: idNumber, phone, dateOfBirth (yyyy-MM-dd) · returns: { customer, matchedOn[] }[] */
export function checkCustomerDuplicates(params = {}) {
  return lifeApi().get(`/customer/duplicate-check`, { params });
}
/** PUT /customer/{customerUuid}/kyc · body: KycDecisionRequest { kycStatus*, note ≤ 500 }; VERIFIED is refused (409) while due-diligence fields are missing */
export function decideCustomerKyc(customerUuid, data) {
  return lifeApi().put(`/customer/${customerUuid}/kyc`, data);
}
/** GET /customer/{customerUuid}/policies · returns: CustomerPolicyResponse[] */
export function getCustomerPolicies(customerUuid) {
  return lifeApi().get(`/customer/${customerUuid}/policies`);
}
