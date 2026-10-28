import { defineStore } from "pinia";
import { ref } from "vue";

export const useCoverage = defineStore("coverage", () => {
  const packages = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalPages = ref(0);
  const totalItems = ref(0);

  // Getters
  const getAll = () => packages.value;

  // Actions
  function set(data) {
    packages.value = data;
  }

  function add(packageData) {
    packages.value.unshift(packageData);
  }

  function update(uuid, updatedPackage) {
    const index = packages.value.findIndex(item => item.packageUuid === uuid);
    if (index !== -1) {
      packages.value[index] = {
        ...packages.value[index],
        ...updatedPackage,
      };
    }
  }

  function remove(uuid) {
    packages.value = packages.value.filter(item => item.packageUuid !== uuid);
  }

  function setPagination(pagination) {
    currentPage.value = pagination.currentPage || 1;
    itemsPerPage.value = pagination.itemsPerPage || 10;
    totalPages.value = pagination.totalPages || 0;
    totalItems.value = pagination.totalItems || 0;
  }

  function reset() {
    packages.value = [];
    currentPage.value = 1;
    itemsPerPage.value = 10;
    totalPages.value = 0;
    totalItems.value = 0;
  }
  function addPackage(packageData) {
    // Check if package already exists
    const exists = packages.value.some(
      pkg => pkg.packageUuid === packageData.packageUuid
    );
    
    if (!exists) {
      packages.value.unshift({
        ...packageData,
        createdAt: new Date().toISOString()
      });
      totalItems.value += 1;
      
      // Adjust pagination if needed
      if (packages.value.length > itemsPerPage.value) {
        packages.value.pop();
      }
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
function updatePackage(uuid, updatedPackage) {
  const index = packages.value.findIndex(item => item.packageUuid === uuid);
  if (index !== -1) {
    packages.value[index] = {
      ...packages.value[index],
      ...updatedPackage,
    };
  }
}


  return {
    // State
    packages,
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    addPackage,
    updatePackage,
    handleApiResponse,
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
