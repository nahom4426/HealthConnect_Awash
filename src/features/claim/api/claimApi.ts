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
export function getNotClaimed(query: any) {
	return api.addAuthenticationHeader().get<RequestedClaim>(`${path}/service-provided/notClaimed`, {
		params: query
	})
}


// Create new service-provided with optional attachments (multipart/form-data)
export function createServiceProvided(contractUuid: string | number, formData: FormData) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/service-provided/${contractUuid}` as any, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export function createCashServiceProvided(formData: FormData) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/service-provided/cashService` as any, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
}
export function createCreditServiceProvided(formData: FormData) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/service-provided/manualCreditService` as any, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export function updateManualCreditServiceProvided(serviceProvidedUuid: string | number, formData: FormData) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/service-provided/manualCreditService/${serviceProvidedUuid}` as any, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export function getServiceProvidedById(serviceProvidedId: string | number) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/service-provided/${serviceProvidedId}` as any);
}

export function updateServiceProvided(serviceProvidedId: string | number, formData: FormData) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/service-provided/${serviceProvidedId}` as any, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

export function getFieldUpdateLogs(query: any = {}) {
	return api.addAuthenticationHeader().get<any>(`${path}/field-update-log`, {
		params: query,
	})
}

export function approveClaimProcessedBy(claimUuid: string, data: { comment: string; batchCode: string }) {
return api.addAuthenticationHeader().put(`${path}/claim/approve/changeStatus/${claimUuid}`, data, {
		params: { 'claimStatus': 'PROCESSED' }
	})
}
export function checkClaimProcessedBy(claimUuid: string, data: { comment: string; batchCode: string }) {
return api.addAuthenticationHeader().put(`${path}/claim/approve/changeStatus/${claimUuid}`, data, {
		params: { 'claimStatus': 'APPROVED' }
	}) }
	export function checkClaimConfirmedBy(claimUuid: string, data: { comment: string; batchCode: string }) {
return api.addAuthenticationHeader().put(`${path}/claim/approve/changeStatus/${claimUuid}`, data, {
		params: { 'claimStatus': 'CONFIRMED' }
	}) }
		export function checkClaimAuthorizedBy(claimUuid: string, data: { comment: string; batchCode: string }) {
return api.addAuthenticationHeader().put(`${path}/claim/approve/changeStatus/${claimUuid}`, data, {
		params: { 'claimStatus': 'AUTHORIZED' }
	}) }

export function rejectClaim(claimUuid: string, data: { comment: string; batchCode: string }) {
	return api.addAuthenticationHeader().put(`${path}/claim/approve/changeStatus/${claimUuid}`, data, {
		params: { 'claimStatus': 'REJECTED' }
	})
}
export function verifyClaim(claimUuid: string, data: { comment: string; batchCode: string }) {
	return api.addAuthenticationHeader().put(`${path}/claim/approve/changeStatus/${claimUuid}`, data, {
		params: { 'claimStatus': 'VERIFIED' }
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
	remark?: string,
	canResubmit?: boolean
  ) {
	const requestBody = {
	  serviceProvidedUuids,
	  claimStatus,
	  ...(typeof canResubmit === 'boolean' && { canResubmit }),
	  ...(remark && { remark })
	};
  
	return api.addAuthenticationHeader().put(
	  `${path}/claim/ServiceProvidedClaimStatus/${claimUuid}`,
	  requestBody
	);
  }

export function updateProvidedItemClaimStatus(
	claimUuid: string,
	serviceProvidedUuid: string,
	data: Array<{ providedItemUuid: string; claimStatus: string; canResubmit?: boolean; remark?: string }>
) {
	return api.addAuthenticationHeader().put(
		`${path}/claim/ProvidedItemClaimStatus/${claimUuid}`,
		data,
		{
			params: { serviceProvidedUuid },
		}
	)
}

export function getRequestedCashClaimByBatchDetail(query = {}) {
	return api.addAuthenticationHeader().get(`${path}/cash/payment/requested/list/detail`, {
		params: query
	})
}

// Dashboard APIs
export function getProviderDashboard() {
	return api.addAuthenticationHeader().get(`${path}/provider/dashboard`)
}

export function getActivePolicies() {
	return api.addAuthenticationHeader().get(`${path}/payer-institution-contract/dashBoard/activePolicies`)
}

export function getEachMonthActivePolicies() {
	return api.addAuthenticationHeader().get(`${path}/payer-institution-contract/dashBoard/eachMonthActivePolicies`)
}

export function getClaimsDashboard(claimStatus?: string) {
	const params = claimStatus ? { claimStatus } : {};
	return api.addAuthenticationHeader().get(`${path}/claim/dashboard`, { params })
}

export function getEachMonthCreatedClaims() {
	return api.addAuthenticationHeader().get(`${path}/claim/dashBoard/eachMonthCreatedClaims`)
}

export function settleClaimPayment(claimUuid: string, formData: FormData) {
	return api
		.addAuthenticationHeader()
		.put(`${path}/claim/settle/payment/${claimUuid}` as any, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
}
