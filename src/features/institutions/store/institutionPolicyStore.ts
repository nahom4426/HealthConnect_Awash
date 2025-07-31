import type { Status } from "@/types/interface";
import { defineStore } from "pinia";
import { ref } from "vue";
import type { Institution } from "./institutionsStore";

export const useInstitutionPolicyStore = defineStore("institutionsPolicyStore", () => {
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
