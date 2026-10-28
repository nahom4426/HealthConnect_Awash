import ApiService from "@/service/ApiService";
import type { CashBatchClaim } from "../store/cashClaimByInstitutionBatchStore";

const api = new ApiService()
const path = '/claimconnect/cash-credit'

export function getCashCreditByInstitution(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/saved/lists`, {
    params: query
  });
}

export function createCashCredit(data: any) {
  return api.addAuthenticationHeader().post(`${path}/create/with-services`, data);
}

export function updateCashCredit(cashCreditUuid: string, data: any) {
  return api.addAuthenticationHeader().put(`${path}/update/${cashCreditUuid}`, data);
}

export function requestCashClaim(data: any) {
  const payload = {
    institutionUuid: data.institutionUuid,
    payerUuid: data.payerUuid,
    contractUuid: data.contractUuid,
    providerUuid: data.providerUuid,
    claimFromDate: data.claimFromDate,
    claimToDate: data.claimToDate,
    totalAmount: data.totalAmount,
    // Support both old format (cashCreditUuidRequest) and new format (serviceProvidedUuid)
    serviceProvidedUuid: data.serviceProvidedUuid || data.cashCreditUuidRequest?.map((item: any) => item.cashCreditUuid) || []
  };
  return api.addAuthenticationHeader().post('/claimconnect/claim/create-claim/provider/insured', payload);
}

export function getCashClaimsByInstitutionBatch(query: any) {
  return api.addAuthenticationHeader().get<CashBatchClaim[]>(`${path}/requested/lists`, {
    params: query
  });
}