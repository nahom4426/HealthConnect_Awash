<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { watch, reactive } from "vue";
import { getQuotationsByStatus } from "../api/quotationApi";

const props = withDefaults(defineProps<{ auto?: boolean; status?: string; search?: string; type?: string }>(), {
  auto: true,
  status: "PENDING",
  search: "",
  type: "",
});

// Minimal local store compatible with usePagination
const quotationStore: any = {
  items: reactive([] as any[]),
  meta: undefined as any,
  set(data: any[]) {
    this.items.splice(0, this.items.length, ...(Array.isArray(data) ? data : []));
  },
  getAll() {
    return this.items;
  },
  setPaginationMeta(meta: any) {
    this.meta = meta;
  },
  getPaginationMeta() {
    return this.meta;
  },
};

const pagination: any = usePagination({
  store: quotationStore,
  auto: props.auto,
  cb: (data: any) => {
    const payload: any = { ...data, status: props.status };
    if (props.type && props.type !== '') {
      payload.type = props.type;
    }
    if (typeof payload.search !== 'string' || payload.search.trim() === '') {
      delete payload.search;
    } else {
      payload.search = payload.search.trim();
    }
    return getQuotationsByStatus(payload);
  },
});

watch(
  () => props.search,
  () => {
    // Update search term and immediately refetch so the search bar works
    const trimmed = typeof props.search === 'string' ? props.search.trim() : '';
    pagination.search.value = trimmed !== '' ? trimmed : (undefined as any);

    if (typeof (pagination as any)?.send === 'function') {
      (pagination as any).send();
    }
  }
);

watch(
  () => [props.status, props.type],
  () => {
    if (typeof pagination?.send === 'function') {
      pagination.send();
    }
  }
);
</script>

<template>
  <slot
    :quotations="quotationStore.items"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="pagination.currentPage"
    :itemsPerPage="pagination.itemsPerPage"
    :totalPages="pagination.totalPages"
    :setPage="pagination.setPage"
    :setLimit="pagination.setLimit"
    :refetch="pagination.send"
  />
</template>