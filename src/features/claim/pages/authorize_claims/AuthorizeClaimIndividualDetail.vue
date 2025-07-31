<script setup lang="ts">
import Button from "@/components/Button.vue";
import ClaimDetail from "../../components/ClaimDetail.vue";
import ClaimIndividualDetailDataProvider from "../../components/ClaimIndividualDetailDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import {
  claimApproved,
  claimAuthorized,
  claimProccessed,
  claimVerified,
} from "../../api/claimApi";
import { toasted } from "@/utils/utils";
import { useRoute } from "vue-router";
import { ClaimStatus } from "@/types/interface";

const route = useRoute();
const batchCode = route.params.batchCode;

const authClaimReq = useApiRequest();
function approveClaim(data: any) {
  if (authClaimReq.pending.value) return;
  openModal(
    "Comment",
    {
      title: "Authorize Claim",
    },
    (comment) => {
      if (comment) {
        authClaimReq.send(
          () =>
            claimAuthorized({
              comment,
              batchCode,
              claimUuidRequest: [{ claimUuid: data.claimUuid }],
            }),
          (res) => {
            if (res.success) {
              toasted(true, "Successfully Authorized!");
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
          :pending="authClaimReq.pending.value"
          v-if="
            rest.detail?.claimStatus == ClaimStatus.APPROVED &&
            !authClaimReq.dirty.value &&
            !authClaimReq.error.value
          "
          @click="approveClaim(rest.detail)"
          type="primary"
        >
          Authorize
        </Button>
      </template>
    </ClaimDetail>
  </ClaimIndividualDetailDataProvider>
</template>
