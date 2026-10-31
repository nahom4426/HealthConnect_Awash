<script setup>
// Assess a reviewed claim (PUT /claim/{uuid}/assessment, ClaimAssessmentRequest). The backend works out
// the net payable (approved − deductions − outstanding premium deducted) and splits it among the payees.
// data: { claim: LifeClaimResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import { formatAmount } from "../constants/labels";
import { claimTypeLabel, fromAssessment, toAssessmentRequest, validateAssessment } from "../claims/claimRules";
import { assessClaim } from "../api/claimApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const claim = props.data?.claim || {};

const form = reactive(fromAssessment(claim));
const errors = ref({});
const pending = ref(false);

const addDeduction = () => form.deductions.push({ reason: "", amount: "" });
const removeDeduction = (i) => form.deductions.splice(i, 1);

async function submit() {
  errors.value = validateAssessment(form, claim);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await assessClaim(claim.claimUuid, toAssessmentRequest(form));
  pending.value = false;
  if (res?.success) {
    toasted(true, `Assessed: net payable ${formatAmount(res.data?.netPayable)}`);
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="Assess claim" :subtitle="[claim.claimNumberCode, claim.insuredName, claimTypeLabel(claim.claimType)].filter(Boolean).join(' · ')">
      <form id="life-claim-assessment" class="grid gap-5 p-5" novalidate @submit.prevent="submit">
        <dl class="grid gap-3 px-4 py-3 text-sm rounded-xl sm:grid-cols-3 bg-surface-muted">
          <div><dt class="text-xs text-ink-subtle">Amount claimed</dt><dd class="tabular-nums text-ink">{{ formatAmount(claim.claimedAmount) }}</dd></div>
          <div><dt class="text-xs text-ink-subtle">Sum assured</dt><dd class="tabular-nums text-ink">{{ claim.sumAssured != null ? formatAmount(claim.sumAssured) : "—" }}</dd></div>
          <div><dt class="text-xs text-ink-subtle">Outstanding premium</dt><dd class="tabular-nums text-ink">{{ formatAmount(claim.outstandingPremium ?? 0) }}</dd></div>
        </dl>

        <fieldset class="grid gap-4 sm:grid-cols-3">
          <legend class="sr-only">Amounts</legend>
          <TextField v-model="form.eligibleAmount" label="Eligible amount" focus type="number" numeric min="0" step="any" :error="errors.eligibleAmount" />
          <TextField v-model="form.approvedAmount" label="Approved amount" type="number" numeric min="0" step="any" :error="errors.approvedAmount" />
          <TextField v-model="form.outstandingPremiumDeducted" label="Outstanding premium deducted" type="number" numeric min="0" step="any" :error="errors.outstandingPremiumDeducted" />
        </fieldset>

        <fieldset class="grid gap-3">
          <legend class="mb-1 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Other deductions</legend>
          <div v-for="(d, i) in form.deductions" :key="i" class="grid gap-3 items-start sm:grid-cols-[2fr_1fr_auto]">
            <TextField v-model="d.reason" label="Reason" maxlength="200" :error="errors.deductions?.[i]?.reason" />
            <TextField v-model="d.amount" label="Amount" type="number" numeric min="0" step="any" :error="errors.deductions?.[i]?.amount" />
            <Button variant="ghost" size="sm" class="mt-6 !text-error" :aria-label="`Remove deduction ${i + 1}`" @click="removeDeduction(i)">Remove</Button>
          </div>
          <div><Button variant="outline" size="sm" @click="addDeduction">Add deduction</Button></div>
        </fieldset>

        <TextareaField v-model="form.decisionNote" label="Decision note" rows="3" maxlength="1000" counter placeholder="Why this amount is payable" :error="errors.decisionNote" />
        <p class="text-xs text-ink-muted">The system works out the net payable and each payee's amount when you save.</p>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-claim-assessment" :pending="pending">Save assessment</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
