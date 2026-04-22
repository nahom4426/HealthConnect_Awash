import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils";

const api = new ApiService();
const path = '/claimconnect/insuredperson';
const baseUrl = import.meta.env.v_API_URI;
const basePath = '/claimconnect/insuredperson';

export function getInsuredByContractId(id, query = {}) {
  return api.addAuthenticationHeader().get(`${path}/list/${id}`, {
    params: query
  });
}

export function getInsuredServiceProvidedHistory(query = {}) {
	return api.addAuthenticationHeader().get('/claimconnect/service-provided/new', {
		params: query,
	});
}

export function searchInsuredByInstitution(id, query = {}, config = {}) {
  return api.addAuthenticationHeader().get(`${path}/active/search/${id}`, {
    params: query,
    ...config
  }).then(response => {
    console.log("API raw response:", response);
    return response.data;
  }).catch(error => {
    console.error("API error:", error);
    throw error;
  });
}

export function getInsuredById(id, query = {}, config = {}) {
  return api.addAuthenticationHeader().get(`${path}/${id}`, {
    params: query,
    ...config
  }).then(response => {
    console.log("API raw response:", response);
    return response.data;
  }).catch(error => {
    console.error("API error:", error);
    throw error;
  });
}

export function createInsuredPerson(data) {
  return api.addAuthenticationHeader().post(`${baseUrl}/insuredperson`, data);
}

export function updateInsuredPerson(uuid, data) {
  return api.addAuthenticationHeader().put(`${baseUrl}/insuredperson/${uuid}`, data);
}

export function getInsuredPersonById(uuid) {
  return api.addAuthenticationHeader().get(`${baseUrl}/insuredperson/${uuid}`);
}

export function importInsuredPersons(
  {institutionUuid, payerInstitutionContractUuid} = {},
  data,
  config = {}
) {
  const queryString = new URLSearchParams({
    institutionUuid,
    payerInstitutionContractUuid
  }).toString();

  return api.addAuthenticationHeader().post(
    `${basePath}/import-insured-and-dependant`,
    data,
    {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
}

export function getInsuredMembers(query = {}) {
  return api.addAuthenticationHeader().get(`${basePath}/list`, {
    params: query
  });
}

export function createInsured(payload) {
  const config = {};
  if (payload instanceof FormData) {
    config.headers = { 'Content-Type': 'multipart/form-data' };
  } else {
    config.headers = { 'Content-Type': 'application/json' };
  }
  return api.addAuthenticationHeader().post(`${basePath}`, payload, config);
}

export function changeInsuredStatus(insuredId, status) {
  return api.addAuthenticationHeader().put(`${basePath}/changeStatus/${insuredId}`, null, {
    params: { status }
  });
}
export function updateInsured(uuid, payload) {
  const config = {};
  if (payload instanceof FormData) {
    config.headers = { 'Content-Type': 'multipart/form-data' };
  } else {
    config.headers = { 'Content-Type': 'application/json' };
  }
  return api.addAuthenticationHeader().put(`${basePath}/${uuid}`, payload, config);
}

export function deleteInsured(id) {
  return api.addAuthenticationHeader().delete(`${basePath}/${id}`);
}

export function importInsuredMembers(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.addAuthenticationHeader().post(`${basePath}/import`, formData, {
    headers: {
    }
  });
}

export function downloadInsuredTemplate() {
  return api.addAuthenticationHeader().get(`${basePath}/export-template`);
}

export function exportMemberTemplate() {
  return api.addAuthenticationHeader().get(`${basePath}/export/insured-template`, {
    responseType: 'blob' // Important for file download
  });
}

export function exportQuotedMainMembersTemplate(quotationUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${basePath}/export/quoted-main-members-template/${quotationUuid}`, {
      responseType: 'blob'
    });
}

export function exportQuotedDependantsTemplate(quotationUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${basePath}/export/quoted-dependants-template/${quotationUuid}`, {
      responseType: 'blob'
    });
}

export function importQuotedMainMembers({ quotationUuid, payerInstitutionContractUuid } = {}, formData, config = {}) {
  return api.addAuthenticationHeader().post(
    `${basePath}/import-quoted-main-members`,
    formData,
    {
      ...config,
      params: { quotationUuid, payerInstitutionContractUuid },
      headers: {
        ...(config?.headers || {}),
        "Content-Type": "multipart/form-data",
      },
    }
  );
}

export function importQuotedDependants({ quotationUuid, payerInstitutionContractUuid } = {}, formData, config = {}) {
  return api.addAuthenticationHeader().post(
    `${basePath}/import-quoted-dependants`,
    formData,
    {
      ...config,
      params: { quotationUuid, payerInstitutionContractUuid },
      headers: {
        ...(config?.headers || {}),
        "Content-Type": "multipart/form-data",
      },
    }
  );
}
