import ApiService from "@/service/ApiService";

const api = new ApiService();

const path = '/claimconnect/payer';

export function updatePayerMode(payerUuid: string, mode: 'DIRECT' | 'QUOTATION') {
  return api.addAuthenticationHeader().put(`${path}/${payerUuid}/mode`, null, {
    params: { mode },
  });
}
