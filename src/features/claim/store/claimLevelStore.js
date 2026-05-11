import { defineStore } from "pinia";
import { ref } from "vue";

export const useClaimLevel = defineStore("claimLevel", () => {
  const claimLevels = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalPages = ref(0);
  const totalItems = ref(0);

  // Getters
  const getAll = () => claimLevels.value;

  // Actions
  function set(data) {
    claimLevels.value = data;
  }

  function add(claimLevelData) {
    claimLevels.value.unshift(claimLevelData);
  }

  function update(uuid, updatedClaimLevel) {
    const index = claimLevels.value.findIndex(item => item.claimLevelUuid === uuid);
    if (index !== -1) {
      claimLevels.value[index] = {
        ...claimLevels.value[index],
        ...updatedClaimLevel,
      };
    }
  }

  function remove(uuid) {
    claimLevels.value = claimLevels.value.filter(item => item.claimLevelUuid !== uuid);
  }

  function setPagination(pagination) {
    currentPage.value = pagination.currentPage || 1;
    itemsPerPage.value = pagination.itemsPerPage || 10;
    totalPages.value = pagination.totalPages || 0;
    totalItems.value = pagination.totalItems || 0;
  }

  function reset() {
    claimLevels.value = [];
    currentPage.value = 1;
    itemsPerPage.value = 10;
    totalPages.value = 0;
    totalItems.value = 0;
  }

  function addClaimLevel(claimLevelData) {
    // Check if claim level already exists
    const exists = claimLevels.value.some(
      level => level.claimLevelUuid === claimLevelData.claimLevelUuid
    );
    
    if (!exists) {
      claimLevels.value.unshift({
        ...claimLevelData,
        createdAt: new Date().toISOString()
      });
      totalItems.value += 1;
      
      // Adjust pagination if needed
      if (claimLevels.value.length > itemsPerPage.value) {
        claimLevels.value.pop();
      }
    }
  }

  function updateClaimLevel(uuid, updatedClaimLevel) {
    const index = claimLevels.value.findIndex(item => item.claimLevelUuid === uuid);
    if (index !== -1) {
      claimLevels.value[index] = {
        ...claimLevels.value[index],
        ...updatedClaimLevel,
      };
    }
  }

  // New method to handle API response
  function handleApiResponse(response) {
    if (response.success) {
      this.setPagination({
        currentPage: response.currentPage || 1,
        itemsPerPage: response.itemsPerPage || 10,
        totalPages: response.totalPages || 1,
        totalItems: response.totalItems || 0
      });
      this.set(response.data || []);
    }
    return response;
  }

  return {
    // State
    claimLevels,
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
    addClaimLevel,
    updateClaimLevel,
    handleApiResponse,
  };
});
