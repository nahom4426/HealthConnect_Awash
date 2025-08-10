import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils";
import type { Institution } from "../store/institutionsStore";

const api = new ApiService()

const path = '/claimconnect/institution'

export function getInstitutionsPolicyByStatus(query = {}) {
	return api.addAuthenticationHeader().get<Institution[]>(`${path}/list`, {
		params: query
	});	
}

export function getActiveInstitutions(query = {}) {
	return api.addAuthenticationHeader().get<Institution[]>(`${path}/list`, {
		params: query
	});
}
export function createinstitution(data: any) {
	return api.addAuthenticationHeader().post<Institution>(`${path}`, data);
}

export function getInstitutionsByStatus(query = {}) {
	return api.addAuthenticationHeader().get<Institution[]>(`${path}/list`, {
		params: query
	})
}

export function getInstitutionsById(id: string) {
	return api.addAuthenticationHeader().get<Institution>(`${path}/${id}`)
}
export function updateInstitutionById(id: string, data: any) {
	return api.addAuthenticationHeader().put<Institution>(`${path}/${id}`, data);
}