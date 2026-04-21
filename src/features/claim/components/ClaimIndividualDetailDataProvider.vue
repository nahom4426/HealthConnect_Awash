<script setup lang="ts">
import { useApiRequest } from "@/composables/useApiRequest";
import {
  allRequest,
  toasted,
} from "@/utils/utils";
import { useRoute } from "vue-router";
import {
  getClaimDetail,
  getClaimLogs,
  getClaimServices,
} from "../api/claimApi";
import { getClaimAttachments } from "../api/claimAttachmentApi";

const req = useApiRequest();
const route = useRoute();

const claimUuid = route.params.claimUuid;
req.send(
  () =>
    allRequest({
      claimAttachments: getClaimAttachments(claimUuid as string),
      detail: getClaimDetail(claimUuid as string),
      claimedServices: getClaimServices({
        claimUuid,
      }),
      claimLogs: getClaimLogs({ claimUuid }),
    }),
  (res) => {
    console.log(res.data);
  }
);

</script>
<template>
  <slot
    :detail="req.response.value?.detail"
    :claimed-services="req.response.value?.claimedServices"
    :claim-logs="req.response.value?.claimLogs"
    :claim-attachments="req.response.value?.claimAttachments"
		:pending="req.pending.value"
  />
</template>
