<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { watch, reactive } from "vue";
import { getQuotationsByStatus } from "../api/quotationApi";
import { useInstitutionStore } from "../../institutions/store/institutionsStore";
import { getInstitutionsByStatus } from "../../institutions/api/institutionApi";

const props = withDefaults(
  defineProps<{
    auto?: boolean;
    status?: string;
    search?: string;
    institutionsStatus?: string;
  }>(),
  {
    auto: true,
    status: "PENDING",
    search: "",
    institutionsStatus: "ACTIVE",
  }
);

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
    pagination.search.value = (typeof props.search === 'string' && props.search.trim() !== '') ? props.search : undefined as any;
  }
);

// Institutions data provider (for tables/forms needing institutions)
const institutionStore = useInstitutionStore();
const institutionsPagination: any = usePagination({
  store: institutionStore,
  auto: props.auto,
  cb: (data: any) => {
    const payload: any = { ...data, status: props.institutionsStatus };
    if (typeof payload.search !== 'string' || payload.search.trim() === '') {
      delete payload.search;
    } else {
      payload.search = payload.search.trim();
    }
    return getInstitutionsByStatus(payload);
  },
});

if (!institutionStore.institutions?.length) {
  institutionsPagination.search.value = (typeof props.search === 'string' && props.search.trim() !== '') ? props.search : undefined as any;
  if (props.auto) {
    institutionsPagination.send();
  }
}

watch(
  () => props.search,
  () => {
    institutionsPagination.search.value = (typeof props.search === 'string' && props.search.trim() !== '') ? props.search : undefined as any;
  }
);
</script>

<template>
  <slot
    :quotations="quotationStore.items"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :institutions="institutionStore.institutions"
    :institutionsPending="institutionsPagination.pending.value"
    :institutionsError="institutionsPagination.error.value"
    :institutionsSearch="institutionsPagination.search"
  />
</template>