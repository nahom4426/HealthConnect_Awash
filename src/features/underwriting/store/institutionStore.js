// stores/institutionStore.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useInstitution = defineStore("institution", () => {
  // State
  const institutions = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalPages = ref(0);
  const totalItems = ref(0);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const getAllInstitutions = () => institutions.value;
  const getInstitutionById = (id) => 
    institutions.value.find(inst => inst.institutionUuid === id);

  // Actions
  function setInstitutions(data) {
    institutions.value = data;
  }

  function setPagination(response) {
    currentPage.value = response.currentPage || 1;
    itemsPerPage.value = response.itemsPerPage || 10;
    totalPages.value = response.totalPages || 0;
    totalItems.value = response.totalItems || 0;
  }

  function addInstitution(institution) {
    institutions.value.unshift(institution);
  }

function updateInstitution(id, updatedData) {
  const index = institutions.value.findIndex(
    item => item.institutionUuid === id
  );
  if (index !== -1) {
    // Create a new array to trigger reactivity
    institutions.value = [
      ...institutions.value.slice(0, index),
      { ...institutions.value[index], ...updatedData },
      ...institutions.value.slice(index + 1)
    ];
  }
}

  function removeInstitution(id) {
    institutions.value = institutions.value.filter(
      item => item.institutionUuid !== id
    );
  }

  function setLoading(loading) {
    isLoading.value = loading;
  }

  function setError(err) {
    error.value = err;
  }

  function reset() {
    institutions.value = [];
    currentPage.value = 1;
    itemsPerPage.value = 10;
    totalPages.value = 0;
    totalItems.value = 0;
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    institutions,
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    isLoading,
    error,

    // Getters
    getAllInstitutions,
    getInstitutionById,

    // Actions
    setInstitutions,
    setPagination,
    addInstitution,
    updateInstitution,
    removeInstitution,
    setLoading,
    setError,
    reset,
  };
});