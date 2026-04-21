<script setup lang="ts">
import Button from "@/components/Button.vue";
import ClaimDetail from "../../components/ClaimDetail.vue";
import ClaimIndividualDetailDataProvider from "../../components/ClaimIndividualDetailDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import { claimProccessed, claimVerified } from "../../api/claimApi";
import { toasted } from "@/utils/utils";
import { useRoute } from "vue-router";
import { ClaimStatus } from "@/types/interface";

const route = useRoute();
const batchCode = route.params.batchCode;

const verifyClaimReq = useApiRequest();
function verifyClaim(data: any) {
  if (verifyClaimReq.pending.value) return;
  openModal(
    "Comment",
    {
      title: "Verify Claim",
    },
    (comment) => {
      if (comment) {
        verifyClaimReq.send(
          () =>
            claimVerified({
              comment,
              batchCode,
              claimUuidRequest: [{ claimUuid: data.claimUuid }],
            }),
          (res) => {
            if (res.success) {
              toasted(true, "Claim Ready for Approval");
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
					:pending="verifyClaimReq.pending.value"
          v-if="
            rest.detail?.claimStatus == ClaimStatus.PROCESSED &&
            (!verifyClaimReq.dirty.value && !verifyClaimReq.error.value)
          "
          @click="verifyClaim(rest.detail)"
          type="primary"
        >
          Verify
        </Button>
      </template>
    </ClaimDetail>
  </ClaimIndividualDetailDataProvider>
</template>
