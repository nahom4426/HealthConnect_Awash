import ApiService from "@/service/ApiService";
import type { Provider } from "../store/providersStore";

const api = new ApiService()

const path = '/provider'

export function getProviders(query = {}) {
	return api.addAuthenticationHeader().get<Provider[]>(`${path}/list`, {
		params: query
	})
}

export function createProvider(data: any) {
	return api.addAuthenticationHeader().post(`${path}`, data)
}

