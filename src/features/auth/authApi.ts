import ApiService from "@/service/ApiService"
import type { User } from "@/types/interface"

const api = new ApiService(import.meta.env?.v_API_AUTH_URI)
const path = '/users'

export interface Credential {
	email: string,
	password: string
}

export interface LoginResponse extends User {
	token: string
}

export function login(data: Credential) {
	return api.post<LoginResponse>(`${path}/signIn`, {
		password: data.password,
		userName: data.email
	});
}