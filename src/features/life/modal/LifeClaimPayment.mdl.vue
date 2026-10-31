<script setup>
// Record payment of an authorized claim (PUT /claim/insurance/pay, ClaimPayRequest): one payment per
// unpaid payee, for the amount the backend split to that payee. The claim is PAID once every payee is.
// data: { claim: LifeClaimResponse }
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import { toasted } from "@/utils/utils";
import { formatAmount } from "../constants/labels";
import { paymentRows, toPayRequest, unpaidPayees, validatePayments } from "../claims/claimRules";
import { payClaim } from "../api/claimApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const claim = props.data?.claim || {};
const payees = unpaidPayees(claim);
const missingBank = payees.filter((p) => !p.bankName || !p.accountNumber);

const rows = ref(paymentRows(claim));
const errors = ref(null);
const pending = ref(false);
const today = new Date().toISOString().slice(0, 10);
const payee = (id) => payees.find((p) => p.payeeUuid === id) || {};

async function submit() {
  errors.value = validatePayments(rows.value);
  if (errors.value) return;
  pending.value = true;
  const res = await payClaim(toPayRequest(claim.claimUuid, rows.value, payees));
  pending.value = false;
  if (res?.success) {
    toasted(true, res.data?.status === "PAID" ? "Claim paid" : "Payment recorded");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="Record payment" :subtitle="[claim.claimNumberCode, claim.insuredName, `net payable ${formatAmount(claim.netPayable)}`].filter(Boolean).join(' · ')">
      <form id="life-claim-payment" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <p v-if="!payees.length" class="text-sm text-ink-muted">Every payee is already paid.</p>
        <p v-if="missingBank.length" class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">
          No bank details for {{ missingBank.map((p) => p.name).join(", ") }}. The system won't pay a payee without them.
        </p>
        <fieldset v-for="(r, i) in rows" :key="r.payeeUuid" class="grid gap-3 p-4 rounded-xl border sm:grid-cols-2 border-line">
          <legend class="px-1 text-sm font-semibold text-ink">
            {{ payee(r.payeeUuid).name }} · <span class="tabular-nums">{{ formatAmount(payee(r.payeeUuid).amount) }}</span>
            <span class="block text-xs font-normal text-ink-subtle">{{ [payee(r.payeeUuid).bankName, payee(r.payeeUuid).accountNumber].filter(Boolean).join(" · ") }}</span>
          </legend>
          <TextField v-model="r.paymentVoucherNumber" label="Payment voucher number" maxlength="60" :focus="i === 0" :error="errors?.[i]?.paymentVoucherNumber" />
          <TextField v-model="r.paymentDate" label="Payment date" type="date" :max="today" :error="errors?.[i]?.paymentDate" />
          <TextField v-model="r.paymentOrderNumber" label="Payment order number (optional)" maxlength="60" hint="Left empty, the system numbers it" />
          <TextField v-model="r.bankTransactionCode" label="Bank transaction code (optional)" maxlength="60" />
        </fieldset>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-claim-payment" :disabled="!rows.length" :pending="pending">Record payment</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
