import type { Status } from "@/types/interface";
import { instructions } from "@/utils/utils";
import { defineStore } from "pinia";
import { ref } from "vue";
import type { Institution } from "./institutionsStore";

export interface InstitutionContract {
  payerInstitutionContractUuid: string,
  institutionUuid: string,
  contractName: string,
  quoutationUuid?: string,
  contractCode: string,
  benefit: number,
  premium: number,
  beginDate: string,
  endDate: string,
  quotationUuid: string,
  multiGroupUuid: string,
  status: Status
}

export const usePayerInstitutionContractStore = defineStore("payerinstitutionContractStore", () => {
  const institutions = ref<Institution[]>([]);

  function getAll() {
    return institutions.value;
  }

  function set(data: Institution[]) {
    institutions.value = data;
  }

  return {
    institutions,
    getAll,
		set
  };
});
