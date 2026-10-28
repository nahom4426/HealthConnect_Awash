<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch, unref } from "vue";
import { useRequestdClaims } from "../store/requestedCreditClaimStore";
import { getRequestedClaim } from "../api/claimApi";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  store: Object,
  params: {
    type: Object,
    default: () => ({}),
  },
  search: {
    type: String,
    default: "",
  },
});

const claimStore = props.store ?? useRequestdClaims();

const pagination = usePagination({
  store: claimStore,
  auto: false,
  reset: true,
  cb: (data) => {
    // unwrap any refs from props.params and build params
    const params = { ...data };

    // merge unwrapped params (skip null/undefined)
    Object.keys(props.params || {}).forEach((k) => {
      const v = unref(props.params[k]);
      if (v !== null && v !== undefined && v !== "") {
        params[k] = v;
      }
    });

    // add search parameter if provided
    if (props.search && props.search.trim()) {
      params.search = props.search.trim();
    }

    // remove empty search and any null/undefined values to avoid sending unwanted query keys
    if (params.search === "" || params.search == null) delete params.search;
    Object.keys(params).forEach((k) => {
      if (params[k] === null || params[k] === undefined) delete params[k];
    });

    return getRequestedClaim(params);
  },
});


  if (props.auto) {
    pagination.send();
  }


watch(
  () => props.params,
  () => {
    pagination.send();
  },
  { deep: true }
);

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);
</script>

<template>
  <div>
    <slot
      :claims="(claimStore)?.requestedClaims"
      :pending="pagination.pending.value"
      :search="pagination.search"
      :send="pagination.send"
    />
  </div>
</template>
