import ApiService from "@/service/ApiService";
import type { RequestedClaim } from "../store/requestedCreditClaimStore";
import type { BatchClaim } from "../store/claimByInstitutionBatchStore";

const api = new ApiService()

const path = '/claimconnect'

export function getRequestedClaim(query: any) {
	return api.addAuthenticationHeader().get<RequestedClaim>(`${path}/service-provided/new`, {
		params: query
	})
}

export function getClaimDetail(id: string,) {
	return api.addAuthenticationHeader().get<any>(`${path}/details/${id}`)
}
export function getAttachmentUrl(serviceProvidedUuid: string) {
	return api.addAuthenticationHeader().get<string>(
	  `${path}/service-provided/open/attachment`,
	  {
		params: { serviceProvidedUuid }
	  }
	)
  }
  

export function getClaimServices(query = {}) {
	return api.addAuthenticationHeader().get<any>(`${path}/claimed-services`, {
		params: query
	})
}

export function getClaimLogs(query = {}) {
  return api.addAuthenticationHeader().get<any>(`${path}/logs`, {
    params: query,
  })
}

export function approveClaimProcessedBy(claimUuid: string, data: { comment: string; batchCode: string }) {
  return api.addAuthenticationHeader().put(`${path}/claim/approve/processedBy/${claimUuid}`, data)
}
export function checkClaimProcessedBy(claimUuid: string, data: { comment: string; batchCode: string }) {
	return api.addAuthenticationHeader().put(`${path}/claim/approve/approvedBy/${claimUuid}`, data)
  }

export function rejectClaim(claimUuid: string, data: { comment: string; batchCode: string }) {
	return api.addAuthenticationHeader().put(`${path}/claim/approve/changeStatus/${claimUuid}`, data, {
		params: { 'claim status': 'REJECTED' }
	})
}
  
export function claimVerified(data: any) {
  return api.addAuthenticationHeader().put(`${path}/approve/checkedBy`, data)
}
export function claimProccessed(data: any) {
	return api.addAuthenticationHeader().put(`${path}/approve/processedBy`, data)
}
export function claimApproved(data: any) {
  return api.addAuthenticationHeader().put(`${path}/approve/approvedBy`, data)
}

export function claimAuthorized(data: any) {
	return api.addAuthenticationHeader().put(`${path}/approve/authorizedBy`, data)
}
export function getClaimsByInstitutionBatch(query = {}) {
	return api.addAuthenticationHeader().get<BatchClaim[]>(`${path}/claim/all`, {
		params: query
	})
}

export function getRequestedClaimByBatchDetail(query = {}, claimUuid: string) {
    return api.addAuthenticationHeader().get(`${path}/service-provided/claim/${claimUuid}`, {
        params: query
    })
}

// new: update service provided claim status (body: array of serviceProvidedUuid)
export function updateServiceProvidedClaimStatus(
	claimUuid: string, 
	claimStatus: string, 
	serviceProvidedUuids: string[] = [], 
	remark?: string
  ) {
	const requestBody = {
	  serviceProvidedUuids,
	  claimStatus,
	  ...(remark && { remark })
	};
  
	return api.addAuthenticationHeader().put(
	  `${path}/claim/ServiceProvidedClaimStatus/${claimUuid}`,
	  requestBody
	);
  }

export function getRequestedCashClaimByBatchDetail(query = {}) {
	return api.addAuthenticationHeader().get(`${path}/cash/payment/requested/list/detail`, {
		params: query
	})
}
