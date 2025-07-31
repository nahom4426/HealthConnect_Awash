import ApiService from "@/service/ApiService";
import type { CashBatchClaim } from "../store/cashClaimByInstitutionBatchStore";

const api = new ApiService()
const path = '/cash-credit'

export function getCashCreditByInstitution(query = {}) {
	return api.addAuthenticationHeader().get(`${path}/saved/lists`, {
		params: query
	})
}

export function createCashCredit(data: any) {
	return api.addAuthenticationHeader().post(`${path}/create/with-services`, data)
}

export function updateCashCredit(cashCreditUuid: string, data: any) {
	return api.addAuthenticationHeader().put(`${path}/update/${cashCreditUuid}`, data)
}

export function requestCashClaim(data: any) {
	return api.addAuthenticationHeader().put(`${path}/Request/credit-request`, data)
}

export function getCashClaimsByInstitutionBatch(query: any) {
	return api.addAuthenticationHeader().get<CashBatchClaim[]>(`${path}/requested/lists`, {
		params: query
	})
}