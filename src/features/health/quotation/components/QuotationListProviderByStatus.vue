<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { watch, reactive } from "vue";
import { getQuotationsByStatus } from "../api/quotationApi";

const props = withDefaults(
  defineProps<{ auto?: boolean; status?: string; search?: string }>(),
  {
    auto: true,
    status: "PENDING",
    search: "",
  }
);

// Local minimal store compatible with usePagination
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
    if (typeof payload.search !== "string" || payload.search.trim() === "") {
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
    pagination.search.value =
      typeof props.search === "string" && props.search.trim() !== ""
        ? props.search
        : (undefined as any);
  }
);

watch(
  () => props.status,
  () => {
    if (typeof pagination?.send === "function") {
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
    :search="pagination.search"
    :meta="quotationStore.meta"
    :refetch="pagination.send"
  />
</template>
