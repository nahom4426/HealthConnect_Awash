import ApiService from "@/service/ApiService";
import type { InsuredPerson } from "@/types/interface";
import { getQueryFormObject } from "@/utils/utils";

const api = new ApiService()

const path = '/insuredperson'

export function getInsuredByContractId(id: string, query = {}) {
	return api.addAuthenticationHeader().get<InsuredPerson[]>(`${path}/list/${id}`, {
		params: query
	})
}

export function searchInsuredByInstitution(id: string, query = {}, config = {}) {
	return api.addAuthenticationHeader().get<InsuredPerson[]>(`${path}/active/search/${id}`, {
		params: query,
		...config
	})
}