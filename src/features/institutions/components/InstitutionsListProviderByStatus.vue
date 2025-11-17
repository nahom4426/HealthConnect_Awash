<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { watch, reactive } from "vue";
import { getInstitutionsByStatus } from "../api/institutionApi";

const props = withDefaults(
  defineProps<{ auto?: boolean; status?: string; search?: string }>(),
  {
    auto: true,
    status: "ACTIVE",
    search: "",
  }
);

// Local, minimal store compatible with usePagination (keeps this provider reusable)
const institutionStore: any = {
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
  store: institutionStore,
  auto: props.auto,
  cb: (data: any) => {
    const payload: any = { ...data, status: props.status };
    if (typeof payload.search !== "string" || payload.search.trim() === "") {
      delete payload.search;
    } else {
      payload.search = payload.search.trim();
    }
    return getInstitutionsByStatus(payload);
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
    :institutions="institutionStore.items"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :search="pagination.search"
    :meta="institutionStore.meta"
    :refetch="pagination.send"
  />
</template>
