import ApiService from '@/service/ApiService'

const api = new ApiService()

let path = '/insured-service'

export function institutionCoverage(id: string) {
	return api.addAuthenticationHeader().get(`${path}/contract/${id}`)
}