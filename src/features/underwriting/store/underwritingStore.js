import { defineStore } from "pinia";
import { ref } from "vue";

export const useUnderwriting = defineStore("underwriting", () => {
  // State
  const institutions = ref([]);
  const contracts = ref([]);
  const policies = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalPages = ref(0);
  const totalItems = ref(0);

  // Getters
  const getAll = () => contracts.value;

  // Actions
  function set(data) {
    contracts.value = data;
  }

  function setPagination(response) {
    currentPage.value = response.currentPage || 1;
    itemsPerPage.value = response.itemsPerPage || 10;
    totalPages.value = response.totalPages || 0;
    totalItems.value = response.totalItems || 0;
  }

  function add(contract) {
    contracts.value.unshift(contract);
  }

  function update(uuid, updatedContract) {
    const index = contracts.value.findIndex(
      (item) => item.payerInstitutionContractUuid === uuid
    );
    if (index !== -1) {
      contracts.value[index] = {
        ...contracts.value[index],
        ...updatedContract,
      };
    }
  }

  function remove(uuid) {
    contracts.value = contracts.value.filter(
      (item) => item.payerInstitutionContractUuid !== uuid
    );
  }

  function reset() {
    contracts.value = [];
    currentPage.value = 1;
    itemsPerPage.value = 10;
    totalPages.value = 0;
    totalItems.value = 0;
  }

  return {
    // State
    institutions,
    contracts,
    policies,
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,

    // Getters
    getAll,

    // Actions
    set,
    setPagination,
    add,
    update,
    remove,
    reset,
  };
});
