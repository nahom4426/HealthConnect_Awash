import ApiService from "@/service/ApiService"

const api = new ApiService()

const path = '/claimattachments'

export function getClaimAttachments(id: string) {
	return api.addAuthenticationHeader().get(`${path}/${id}`)
}
