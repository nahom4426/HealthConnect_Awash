<script setup lang="ts" generic="T">
import { useApiRequest } from "@/composables/useApiRequest";
import { usePagination } from "@/composables/usePagination";
import { watch, type PropType } from "vue";
import { PaymentStatus, Status } from "@/types/interface";
import { useClaimByInstitutionBatch } from "../store/claimByInstitutionBatchStore";
import { getClaimsByInstitutionBatch } from "../api/claimApi";
import { removeUndefined } from "@/utils/utils";
import { getCashClaimsByInstitutionBatch } from "../api/cashCreditApi";
import { useCashClaimByInstitutionBatch } from "../store/cashClaimByInstitutionBatchStore";
import type { Store, StoreDefinition } from "pinia";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  store: Object as PropType<Store>,
  creditService: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String as PropType<PaymentStatus>,
    default: PaymentStatus.REQUESTED,
  },
  params: {
    type: Object,
    default: {},
  },
});
const batchClaimsStore = props.store ?? useClaimByInstitutionBatch();
const batchClaimReq = useApiRequest();

const pagination = usePagination({
  store: batchClaimsStore,
  auto: false,
  reset: true,
  cb: (data: any) => {
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

if (!(batchClaimsStore as any)?.claims?.length) {
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
    :claims="(batchClaimsStore as any)?.claims as T"
    :pending="pagination.pending.value"
    :error="batchClaimReq.error.value"
    :search="pagination.search"
    :send="pagination.send"
  />
</template>
