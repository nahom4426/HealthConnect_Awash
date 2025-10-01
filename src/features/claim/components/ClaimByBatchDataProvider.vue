<script setup>
import { useApiRequest } from "@/composables/useApiRequest";
import { usePagination } from "@/composables/usePagination";
import { watch, unref } from "vue";
import { ClaimLevel, PaymentStatus } from "@/types/interface";
import { useClaimByInstitutionBatch } from "../store/claimByInstitutionBatchStore";
import { getClaimsByInstitutionBatch } from "../api/claimApi";
import { getCashClaimsByInstitutionBatch } from "../api/cashCreditApi";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  store: Object,
  creditService: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    default: PaymentStatus.PENDING,
  },
  level: {
    type: String,
    default: ClaimLevel.LEVEL1,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
});

const batchClaimsStore = props.store ?? useClaimByInstitutionBatch();
const batchClaimReq = useApiRequest();

const pagination = usePagination({
  store: batchClaimsStore,
  auto: false,
  reset: true,
  cb: (data) => {
    // unwrap any refs from props.params and build params, prefer claimStatus per API
    const params = { ...data };

    // merge unwrapped params (skip null/undefined)
    Object.keys(props.params || {}).forEach((k) => {
      const v = unref(props.params[k]);
      if (v !== null && v !== undefined && v !== "") {
        params[k] = v;
      }
    });

    // ensure claimStatus is always sent (API expects this)
    params.claimStatus = props.status;
    params.claimLevel = props.level;

    // remove empty search and any null/undefined values to avoid sending unwanted query keys
    if (params.search === "" || params.search == null) delete params.search;
    Object.keys(params).forEach((k) => {
      if (params[k] === null || params[k] === undefined) delete params[k];
    });

    return props.creditService
      ? getClaimsByInstitutionBatch(params)
      : getCashClaimsByInstitutionBatch(params);
  },
});

if (!(batchClaimsStore)?.claims?.length) {
  if (props.auto) {
    pagination.send();
  }
}

watch(
  () => props.params,
  () => {
    pagination.send();
  },
  { deep: true }
);
</script>

<template>
  <slot
    :claims="(batchClaimsStore)?.claims"
    :pending="pagination.pending.value"
    :error="batchClaimReq.error.value"
    :search="pagination.search"
    :send="pagination.send"
  />
</template>