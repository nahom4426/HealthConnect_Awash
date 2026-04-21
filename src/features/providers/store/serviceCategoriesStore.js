import { defineStore } from "pinia";
import { ref } from "vue";

export const useServiceCategoriesStore = defineStore("serviceCategoriesStore", () => {
  const categories = ref([]);
  const page = ref(0);
  const size = ref(25);
  const totalPages = ref(0);
  const totalElements = ref(0);

  function set(data) {
    categories.value = Array.isArray(data) ? data : [];
  }

  function getAll() {
    return categories.value;
  }

  function setPaginationMeta(meta = {}) {
    totalElements.value = meta.totalElements || 0;
    totalPages.value = meta.totalPages || 0;
    page.value = meta.currentPage || 0;
  }

  return {
    categories,
    page,
    size,
    totalPages,
    totalElements,
    set,
    getAll,
    setPaginationMeta,
  };
});
