import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils";
import type { Institution } from "../store/institutionsStore";
import type { InstitutionContract } from "../store/payerInstitutionContractStore";

const api = new ApiService()

const path = '/payer-institution-contract'

export function getAllPolicyPendingInstitutions(query = {}, config = {}) {
	return api.addAuthenticationHeader().get<Institution[]>(`${path}/list/pending/policies`, {
		params: query,
		...config
	});
}

export function getInstitutionPolicyByStatus(id: string, query = {}) {
	const qr = getQueryFormObject(query)
	return api.addAuthenticationHeader().get<InstitutionContract[]>(`${path}/lists/${id}${qr}`);
}