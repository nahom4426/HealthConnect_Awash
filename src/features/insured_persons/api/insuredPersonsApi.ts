import ApiService from "@/service/ApiService";
import type { InsuredPerson, AsyncResponse, Insured } from "@/types/interface";
import { getQueryFormObject } from "@/utils/utils";

const api = new ApiService()
const path = '/claimconnect/insuredperson'
const baseUrl = import.meta.env.v_API_URI
const basePath = '/claimconnect/insuredperson';

export function getInsuredByContractId(id: string, query = {}) {
	return api.addAuthenticationHeader().get<InsuredPerson[]>(`${path}/list/${id}`, {
		params: query
	})
}

export function searchInsuredByInstitution(id: string, query = {}, config = {}) {
	return api.addAuthenticationHeader().get(`${path}/list/${id}`, {
		params: query,
		...config
	}).then(response => {
		console.log("API raw response:", response);
		// Return the response data directly, the component will handle pagination
		return response.data;
	}).catch(error => {
		console.error("API error:", error);
		throw error;
	});
}

export function getInsuredById(id: string, query = {}, config = {}) {
	return api.addAuthenticationHeader().get(`${path}/${id}`, {
		params: query,
		...config
	}).then(response => {
		console.log("API raw response:", response);
		// Return the response data directly, the component will handle pagination
		return response.data;
	}).catch(error => {
		console.error("API error:", error);
		throw error;
	});
}
export function createInsuredPerson(data: any) {
	return api.addAuthenticationHeader().post(`${baseUrl}/insuredperson`, data)
}

export function updateInsuredPerson(uuid: string, data: any) {
	return api.addAuthenticationHeader().put(`${baseUrl}/insuredperson/${uuid}`, data)
}

export function getInsuredPersonById(uuid: string) {
	return api.addAuthenticationHeader().get(`${baseUrl}/insuredperson/${uuid}`)
}

import { useAuthStore } from "@/stores/auth"; // Make sure to import the auth store

// export function importInsuredPersons(file: File, payerUuid: string): Promise<AsyncResponse<any>> {
//   const formData = new FormData();
//   formData.append('file', file);

//   const auth = useAuthStore();
//   const token = auth.auth.token; // Get the token from the auth store

//   return api.addAuthenticationHeader().post(`${basePath}/import-insured-and-dependant?payerUuid=${payerUuid}`, formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     },
//     onUploadProgress: (progressEvent) => {
//       if (progressEvent.total) {
//         const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//         // You can emit this percentage if needed
//       }
//     }
//   });
// }

export function importInsuredPersons(
  id: Record<string, any> = {},
  data: FormData,
  config: Record<string, any> = {}
): Promise<any> {
  const qr = getQueryFormObject(id);
  return api.addAuthenticationHeader().post(`${basePath}/import-insured-and-dependant${qr}`, data, {
    ...config,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
export function getInsuredMembers(query = {}) {
  return api.addAuthenticationHeader().get<Insured[]>(`${basePath}/list`, {
    params: query
  });
}

// export function getInsuredById(id: string): Promise<AsyncResponse<Insured>> {
//   return api.addAuthenticationHeader().get(`${basePath}/${id}`);
// }

export function createInsured(formData: FormData): Promise<AsyncResponse<Insured>> {
  return api.addAuthenticationHeader().post(`${basePath}/createInsuredPerson`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function changeInsuredStatus(insuredId: string, newStatus: 'ACTIVE' | 'INACTIVE'): Promise<AsyncResponse<Insured>> {
  return api.addAuthenticationHeader().put(`${basePath}/${insuredId}/status`, null, {
    params: { newStatus }
  });
}

export async function updateInsured(uuid: string, formData: FormData): Promise<AsyncResponse<Insured>> {
  try {
    const response = await api.put(`${basePath}/updateInsured/${uuid}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.message || error.message || 'Unknown error'
    };
  }
}

export function deleteInsured(id: string): Promise<AsyncResponse<any>> {
  return api.addAuthenticationHeader().delete(`${basePath}/${id}`);
}

export function importInsuredMembers(file: File): Promise<AsyncResponse<any>> {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.addAuthenticationHeader().post(`${basePath}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function downloadInsuredTemplate(): Promise<Blob> {
  return api.addAuthenticationHeader().get(`${basePath}/template`, {
    responseType: 'blob'
  });
}
