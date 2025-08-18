<script setup>
import { useApiRequest } from "@/composables/useApiRequest";
import { usePagination } from "@/composables/usePagination";
import { watch } from "vue";
import { PaymentStatus } from "@/types/interface";
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
    default: PaymentStatus.REQUESTED,
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
    return props.creditService
      ? getClaimsByInstitutionBatch({
          ...data,
          ...props.params,
          status: props.status,
        })
      : getCashClaimsByInstitutionBatch({
          ...data,
          ...props.params,
          status: props.status,
        });
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