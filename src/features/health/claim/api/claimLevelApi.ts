import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = "/claimconnect/claimLevel";

export interface ClaimLevel {
  claimLevelUuid?: string;
  claimLevel: string;
  min: number;
  max: number;
  createdAt?: string;
  updatedAt?: string;
}

export function getClaimLevels(query: any = {}) {
  return api.addAuthenticationHeader().get<ClaimLevel[]>(`${path}/all`, {
    params: query,
  });
}

export function createClaimLevel(data: Omit<ClaimLevel, "claimLevelUuid">) {
  return api.addAuthenticationHeader().post<ClaimLevel, any>(`${path}/create-claimLevel`, {}, {
    params: {
      min: data.min,
      max: data.max,
      claimLevel: data.claimLevel
    }
  });
}

export function updateClaimLevel(claimLevelUuid: string, data: Omit<ClaimLevel, "claimLevelUuid" | "createdAt" | "updatedAt">) {
  return api.addAuthenticationHeader().put<ClaimLevel>(`${path}/edit-claimLevel/${claimLevelUuid}`, {} as any, {
    params: {
      min: data.min,
      max: data.max,
      claimLevel: data.claimLevel
    }
  });
}

export function deleteClaimLevel(claimLevelUuid: string) {
  return api.addAuthenticationHeader().delete(`${path}/${claimLevelUuid}`);
}
