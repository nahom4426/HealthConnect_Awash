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
} | Array<{
  packageUuid: string;
  planType: string;
  familySize: number;
  minLimit: number;
  maxLimit: number;
  rate: number;
  description?: string;
  familyBenefitRangeUuid?: string;
  status?: string;
}>) {
  return api.addAuthenticationHeader().post(`${path}`, data);
}

export function createBenefitRangesForPackage(
  packageUuid: string,
  data: Array<{
    maxLimit: number;
    minLimit: number;
    familySize: number;
    rate: number;
    status: string;
    planType: string;
    description?: string;
  }>
) {
  return api
    .addAuthenticationHeader()
    .post(`${path}?packageUuid=${encodeURIComponent(String(packageUuid))}`, data);
}

export function updateBenefitRangesForPackage(
  packageUuid: string,
  data: Array<{
    familyBenefitRangeUuid: string;
    maxLimit: number;
    minLimit: number;
    familySize: number;
    rate: number;
    status: string;
    planType: string;
    description?: string;
  }>
) {
  return api
    .addAuthenticationHeader()
    .put(`${path}?packageUuid=${encodeURIComponent(String(packageUuid))}`, data);
}

export function getPackageRates(packageUuid: string) {
  return api.addAuthenticationHeader().get(`${path}/package/${packageUuid}`);
}
export function getPackageRatesPerCover(packageUuid: string) {
  return api.addAuthenticationHeader().get(`${path}/getRangesPerCover/${packageUuid}`);
}

export function updateBenefitRange(
  familyBenefitRangeUuid: string,
  data: {
    packageUuid: string;
    planType: string;
    familySize: number;
    minLimit: number;
    maxLimit: number;
    rate: number;
    status: string;
    description?: string;
  }
) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/${familyBenefitRangeUuid}`, data);
}

