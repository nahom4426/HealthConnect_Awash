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

// Update service provided claim status with the new payload structure
export function updateServiceProvidedClaimStatus(
  claimUuid: string, 
  payload: {
    serviceProvidedUuids: string[];
    claimStatus: string;
    remark?: string;
  }
) {
  return api.addAuthenticationHeader().put(
    `${path}/claim/ServiceProvidedClaimStatus/${claimUuid}`, 
    payload
  );
}

export function getRequestedCashClaimByBatchDetail(query = {}) {
	return api.addAuthenticationHeader().get(`${path}/cash/payment/requested/list/detail`, {
		params: query
	})
}
