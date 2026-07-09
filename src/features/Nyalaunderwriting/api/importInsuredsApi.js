import ApiService from "@/service/ApiService";

const api = new ApiService();

/**
 * Fetch all benefit packages for a given payer institution contract.
 * Used to load packages from the PREVIOUS contract.
 *
 * @param {string} payerInstitutionContractUuid
 * @param {{ benefitGroupCode?: string, planType?: string, individualType?: string, isSpouse?: boolean, search?: string }} [params]
 */
export function getBenefitPackages(payerInstitutionContractUuid, params = {}) {
  return api
    .addAuthenticationHeader()
    .get(
      `/claimconnect/payer-institution-contract/${payerInstitutionContractUuid}/benefit-packages`,
      { params }
    );
}

/**
 * Fetch active insured persons enrolled in a contract.
 * Used to load insureds from the PREVIOUS contract (to select from)
 * and from the CURRENT contract (to detect duplicates).
 *
 * @param {string} payerInstitutionContractUuid
 * @param {{ page?: number, limit?: number, search?: string, hasInstitution?: string }} [params]
 */
export function getInsuredsByContract(payerInstitutionContractUuid, params = {}) {
  return api
    .addAuthenticationHeader()
    .get(
      `/claimconnect/insuredperson/active/search/${payerInstitutionContractUuid}`,
      { params }
    );
}

/**
 * Link selected insured persons to a benefit group on the CURRENT contract.
 * This performs the actual import.
 *
 * @param {string} payerInstitutionContractUuid - current (target) contract UUID
 * @param {Array<{ insuredUuids: string[], benefitGroupCode: string }>} data
 */
export function linkInsuredsToGroup(payerInstitutionContractUuid, data) {
  return api
    .addAuthenticationHeader()
    .post(
      `/claimconnect/payer-institution-contract/${payerInstitutionContractUuid}/link-insureds-to-group`,
      data
    );
}
