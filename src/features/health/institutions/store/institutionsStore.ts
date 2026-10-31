import type { Status } from "@/types/interface";
import { instructions } from "@/utils/utils";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface Institution {
  institutionUuid: string,
  email: string,
  institutionName: string,
  description: string,
  telephone: string,
  tinNumber: number,
  category: string,
  institutionInsuranceNumber: string,
  address1: string,
  address2: string,
  address3: string,
  state: string,
  country: string,
  latitude: number,
  longitude: number,
  referralType: string,
  referredBy: string,
  status: Status,
  totalPages: number,
}

export const useInstitutionStore = defineStore("institutionsStore", () => {
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
