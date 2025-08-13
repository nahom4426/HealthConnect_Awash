// stores/institutionContractStore.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useInstitutionContract = defineStore("institutionContractStore", () => {
  // State
  const institutionContract = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalPages = ref(0);
  const totalItems = ref(0);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const getAll = () => institutionContract.value;
  const getInstitutionById = (id) => 
    institutionContract.value.find(inst => inst.payerInstitutionContractUuid === id);

  // Actions
  function set(data) {
    institutionContract.value = data;
  }

  function setPagination(response) {
    currentPage.value = response.currentPage || 1;
    itemsPerPage.value = response.itemsPerPage || 10;
    totalPages.value = response.totalPages || 0;
    totalItems.value = response.totalItems || 0;
  }

  function addInstitution(institution) {
    institutionContract.value.unshift(institution);
  }

function updateInstitution(id, updatedData) {
  const index = institutionContract.value.findIndex(
    item => item.payerInstitutionContractUuid === id
  );
  if (index !== -1) {
    // Create a new array to trigger reactivity
    institutionContract.value = [
      ...institutionContract.value.slice(0, index),
      { ...institutionContract.value[index], ...updatedData },
      ...institutionContract.value.slice(index + 1)
    ];
  }
}

  function removeInstitution(id) {
    institutionContract.value = institutionContract.value.filter(
      item => item.payerInstitutionContractUuid !== id
    );
  }

  function setLoading(loading) {
    isLoading.value = loading;
  }

  function setError(err) {
    error.value = err;
  }

  function reset() {
    institutionContract.value = [];
    currentPage.value = 1;
    itemsPerPage.value = 10;
    totalPages.value = 0;
    totalItems.value = 0;
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    institutionContract,
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    isLoading,
    error,

    // Getters
    getAll,
    getInstitutionById,

    // Actions
    set,
    setPagination,
    addInstitution,
    updateInstitution,
    removeInstitution,
    setLoading,
    setError,
    reset,
  };
});