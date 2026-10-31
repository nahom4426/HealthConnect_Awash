<script setup>
// Verify or reject a customer's KYC (PUT /customer/{uuid}/kyc, KycDecisionRequest { kycStatus, note ≤ 500 }).
// The backend refuses VERIFIED (409) while due-diligence fields are missing.
// data: { customer: CustomerResponse, decision: 'VERIFIED' | 'REJECTED' }
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import { customerName, idTypeLabel, kycMissing } from "../individual/customerRules";
import { decideCustomerKyc } from "../api/customerApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const customer = props.data?.customer || {};
const verify = props.data?.decision !== "REJECTED";
const missing = kycMissing(customer);

const note = ref("");
const pending = ref(false);

async function submit() {
  pending.value = true;
  const body = { kycStatus: verify ? "VERIFIED" : "REJECTED" };
  if (note.value.trim()) body.note = note.value.trim();
  const res = await decideCustomerKyc(customer.customerUuid, body);
  pending.value = false;
  if (res?.success) {
    toasted(true, verify ? "KYC verified" : "KYC rejected");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="verify ? 'Verify KYC?' : 'Reject KYC?'" :subtitle="customerName(customer)">
      <form id="life-kyc-decision" class="grid gap-3 p-5" novalidate @submit.prevent="submit">
        <p class="text-sm text-ink-muted">
          <template v-if="verify">Confirm you've checked the {{ idTypeLabel(customer.idType) || "ID" }} {{ customer.idNumber }} and the customer's details. Policies for this customer can then be issued.</template>
          <template v-else>Policies for this customer can't be issued while KYC is rejected. You can verify it later once the issue is resolved.</template>
        </p>
        <p v-if="verify && missing.length" class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">Still missing: {{ missing.join(", ") }}. Add them with Edit details first; the system won't verify KYC without them.</p>
        <TextareaField v-model="note" label="Note (optional)" focus rows="3" maxlength="500" counter :placeholder="verify ? 'e.g. Original ID seen at the branch' : 'Why KYC is rejected'" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-kyc-decision" :pending="pending" :variant="verify ? 'primary' : 'destructive'">{{ verify ? "Verify KYC" : "Reject KYC" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
