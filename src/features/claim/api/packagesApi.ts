import ApiService from "@/service/ApiService"

const api = new ApiService()
const path = '/package'

export function getPackageByInsuredId(id: string) {
	return api.addAuthenticationHeader().get(`${path}/dropdown/${id}`)
}

export function getAllFamilyLevelPacakages(query = {}) {
	return api.addAuthenticationHeader().get(`${path}/familyLevelPackages`, {
		params: query
	})
}