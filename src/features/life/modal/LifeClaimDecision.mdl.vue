<script setup>
// One step on a claim with a comment (ClaimRequest { claimUuid, comment ≤ 1000 }); reject uses
// PUT /claim/deny with a required reason. data: { action: 'submit'|'review'|'approve'|'reject', claim }
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { DECISIONS, personName, validateDecision } from "../claims/claimRules";
import { denyClaim, setInsuranceApproveApprovedBy, setInsuranceApproveRevieweBy, setProviderApprovePreparedBy } from "../api/claimApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const action = props.data?.action;
const claim = props.data?.claim || {};
const d = DECISIONS[action] || DECISIONS.review;

const comment = ref("");
const error = ref("");
const pending = ref(false);

const CALL = {
  submit: (body) => setProviderApprovePreparedBy(body),
  review: (body) => setInsuranceApproveRevieweBy(body),
  approve: (body) => setInsuranceApproveApprovedBy(body),
  reject: (body) => denyClaim(body),
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
    <NewFormParent size="md" :title="d.title" :subtitle="[claim.claimNumber, personName(claim)].filter(Boolean).join(' · ')">
      <form id="life-claim-decision" class="grid gap-3 p-5" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          {{ d.required ? "Reason" : "Comment" }}
          <textarea
            v-model="comment"
            v-focus="true"
            rows="4"
            maxlength="1000"
            :placeholder="d.placeholder"
            :class="['px-3 py-2 w-full text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15', error ? 'border-error' : 'border-line']"
          />
          <span class="flex justify-between text-xs">
            <span class="text-error">{{ error }}</span>
            <span class="text-ink-subtle">{{ comment.length }}/1000</span>
          </span>
        </label>
        <p v-if="action === 'submit'" class="text-xs text-ink-muted">Describe the event (what happened, when and where) — the system doesn't have separate fields for it yet. You can't change the documents after submitting.</p>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-claim-decision" :pending="pending" :variant="d.tone === 'danger' ? 'danger' : 'primary'">{{ d.confirmText }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
