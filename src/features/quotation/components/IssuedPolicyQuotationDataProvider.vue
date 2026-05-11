<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch, reactive } from "vue";
import { issuedPolicyQuotation } from "@/features/quotation/api/quotationApi";

const props = defineProps({
  auto: { type: Boolean, default: true },
  policyUuid: { type: String, required: true },
  search: { type: String, default: "" },
});

const store = {
  items: reactive([]),
  meta: undefined,
  set(data) {
    this.items.splice(0, this.items.length, ...(Array.isArray(data) ? data : []));
  },
  getAll() {
    return this.items;
  },
  setPaginationMeta(meta) {
    this.meta = meta;
  },
  getPaginationMeta() {
    return this.meta;
  },
};

const pagination = usePagination({
  store,
  auto: props.auto,
  cb: (data) => {
    const params = {};

    if (typeof data?.search === "string" && data.search.trim() !== "") {
      params.search = data.search.trim();
    }

    if (typeof props.search === "string" && props.search.trim() !== "") {
      params.search = props.search.trim();
    }

    return issuedPolicyQuotation(props.policyUuid, Object.keys(params).length ? { params } : undefined);
  },
});

watch(
  () => props.search,
  () => {
    pagination.search.value =
      typeof props.search === "string" && props.search.trim() !== "" ? props.search : "";
    if (typeof pagination?.send === "function") {
      pagination.send();
    }
  }
);
</script>

<template>
  <slot :quotations="store.items" :pending="pagination.pending.value" :error="pagination.error.value" />
</template>
