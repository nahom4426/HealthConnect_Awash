<script setup>
// One step on a claim with a comment (ClaimRequest { claimUuid, comment ≤ 1000 }); reject and request-info
// take a required reason ({ comment }, 2–500). data: { action: keyof DECISIONS, claim: LifeClaimResponse }
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import { formatAmount } from "../constants/labels";
import { DECISIONS, commentLimit, validateDecision } from "../claims/claimRules";
import {
  authorizeClaim, registerClaim, rejectLifeClaim, requestClaimInfo, setInsuranceApproveApprovedBy, setInsuranceApproveRevieweBy, setProviderApprovePreparedBy,
} from "../api/claimApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const action = props.data?.action;
const claim = props.data?.claim || {};
const d = DECISIONS[action] || DECISIONS.review;

const comment = ref("");
const error = ref("");
const pending = ref(false);

const CALL = {
  submit: (body) => setProviderApprovePreparedBy(body),
  register: (body) => registerClaim(body),
  review: (body) => setInsuranceApproveRevieweBy(body),
  approve: (body) => setInsuranceApproveApprovedBy(body),
  authorize: (body) => authorizeClaim(body),
  requestInfo: (body) => requestClaimInfo(body.claimUuid, body.comment),
  reject: (body) => rejectLifeClaim(body.claimUuid, body.comment),
};

async function submit() {
  error.value = validateDecision(action, comment.value);
  if (error.value) return;
  pending.value = true;
  const res = await CALL[action]({ claimUuid: claim.claimUuid, comment: comment.value.trim() });
  pending.value = false;
  if (res?.success) {
    toasted(true, d.done);
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="d.title" :subtitle="[claim.claimNumberCode, claim.insuredName].filter(Boolean).join(' · ')">
      <form id="life-claim-decision" class="grid gap-3 p-5" novalidate @submit.prevent="submit">
        <TextareaField v-model="comment" :label="d.required ? 'Reason' : 'Comment'" focus rows="4" :maxlength="commentLimit(action)" counter :placeholder="d.placeholder" :error="error" />
        <p v-if="action === 'submit'" class="text-xs text-ink-muted">You can't change the documents after submitting, unless the insurer asks for more information.</p>
        <p v-else-if="action === 'approve' && claim.netPayable != null" class="text-xs text-ink-muted">Net payable {{ formatAmount(claim.netPayable) }}. Up to the auto-authorize limit, approving also authorizes the payment.</p>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-claim-decision" :pending="pending" :variant="d.tone === 'danger' ? 'destructive' : 'primary'">{{ d.confirmText }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
