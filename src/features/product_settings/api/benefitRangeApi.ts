import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = "/claimconnect/benefitRange";

export function createBenefitRange(data: {
  packageUuid: string;
  planType: string;
  familySize: number;
  minLimit: number;
  maxLimit: number;
  rate: number;
  description?: string;
}) {
  return api.addAuthenticationHeader().post(`${path}`, data);
}

export function getPackageRates(packageUuid: string) {
  return api.addAuthenticationHeader().get(`${path}/package/${packageUuid}`);
}
