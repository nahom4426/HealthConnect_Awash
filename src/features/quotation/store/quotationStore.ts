import { defineStore } from "pinia";
import { ref } from "vue";

export interface Quotation {
  // Define fields as needed. Using index signature to stay flexible with current API.
  [key: string]: any;
}

interface PaginationMeta {
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
}

export const useQuotationStore = defineStore("quotationStore", () => {
  const quotations = ref<Quotation[]>([]);
  const paginationMeta = ref<PaginationMeta | undefined>(undefined);

  function getAll() {
    return quotations.value;
  }

  function set(data: Quotation[]) {
    quotations.value = Array.isArray(data) ? data : [];
  }

  function setPaginationMeta(meta: PaginationMeta) {
    paginationMeta.value = meta || undefined;
  }

  function getPaginationMeta() {
    return paginationMeta.value;
  }

  return {
    quotations,
    getAll,
    set,
    setPaginationMeta,
    getPaginationMeta,
  };
});
