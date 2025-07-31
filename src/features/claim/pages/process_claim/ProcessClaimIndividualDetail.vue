<script setup lang="ts">
import Button from "@/components/Button.vue";
import ClaimDetail from "../../components/ClaimDetail.vue";
import ClaimIndividualDetailDataProvider from "../../components/ClaimIndividualDetailDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import { claimProccessed } from "../../api/claimApi";
import { toasted } from "@/utils/utils";
import { useRoute } from "vue-router";
import { ClaimStatus } from "@/types/interface";

const route = useRoute();
const batchCode = route.params.batchCode;

const approveClaimReq = useApiRequest();
function approveClaim(data: any) {
  if (approveClaimReq.pending.value) return;
  openModal(
    "Comment",
    {
      title: "Claim Process",
    },
    (comment) => {
      if (comment) {
        approveClaimReq.send(
          () =>
            claimProccessed({
              comment,
              batchCode,
              claimUuidRequest: [{ claimUuid: data.claimUuid }],
            }),
          (res) => {
            if (res.success) {
              toasted(true, "Claim Ready for Verification");
            }
          }
        );
      }
    }
  );
}
</script>

<template>
  <ClaimIndividualDetailDataProvider v-slot="{ pending, ...rest }">
    <ClaimDetail v-bind="rest">
      <template #claimActions="{}">
        <Button
          :pending="approveClaimReq.pending.value"
          v-if="
            rest.detail?.claimStatus == ClaimStatus.REQUESTED &&
            (!approveClaimReq.dirty.value && !approveClaimReq.error.value)
          "
          @click="approveClaim(rest.detail)"
          type="primary"
        >
          Process
        </Button>
      </template>
    </ClaimDetail>
  </ClaimIndividualDetailDataProvider>
</template>
