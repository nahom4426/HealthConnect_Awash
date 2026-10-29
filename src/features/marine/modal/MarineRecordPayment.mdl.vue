<script setup>
// Record money in or out for Finance: a premium receipt (part or full), a refund, a claim payment, a
// carrier recovery or a broker commission statement. Method, reference (not needed for cash), bank and
// date; the amount only where part payments make sense.
// data: { kind: "receipt" | "refund" | "voucher" | "recovery" | "statement", id, title, currency?,
//         amount?, maxAmount?, editableAmount?, details?: [{ label, value }] }. Closes with the result.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MoneyInput from "../components/MoneyInput.vue";
import DateField from "../components/DateField.vue";
import { inputClass, inputBorder } from "../components/styles";
import { payCommissionStatement, payRefund, payVoucher, recordReceipt, recordRecovery } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { PAYMENT_METHODS } from "../constants";
import { compare, formatMoney } from "../utils/money";
import { todayIso } from "../utils/format";

const props = defineProps({ data: { type: Object, required: true } });
const d = props.data;
const currency = d.currency ?? "ETB";
const incoming = ["receipt", "recovery"].includes(d.kind);
const amount = ref(d.amount ?? "");
const method = ref("BANK_TRANSFER");
const reference = ref("");
const bank = ref("");
const date = ref(todayIso());
const errors = ref({});
const pending = ref(false);

const CALLS = {
  receipt: (body) => recordReceipt({ noteId: d.id, ...body }),
  refund: (body) => payRefund(d.id, body),
  voucher: (body) => payVoucher(d.id, body),
  recovery: (body) => recordRecovery(d.id, body),
  statement: (body) => payCommissionStatement(d.id, body),
};

async function submit() {
  const e = {};
  if (d.editableAmount) {
    if (!(Number(amount.value) > 0)) e.amount = "Amount must be greater than 0";
    else if (d.maxAmount && compare(amount.value, d.maxAmount) > 0) e.amount = `At most ${formatMoney(d.maxAmount, currency)}`;
  }
  if (method.value !== "CASH" && !reference.value.trim()) e.reference = "Reference is required";
  if (!date.value) e.date = "Date is required";
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const body = { method: method.value, reference: reference.value.trim(), bank: bank.value.trim(), date: date.value, ...(d.editableAmount ? { amount: amount.value } : {}) };
  const res = await CALLS[d.kind](body);
  pending.value = false;
  if (res.ok) {
    toasted(true, incoming ? "Receipt recorded" : "Payment recorded");
    return closeModal(res.data);
  }
  if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="d.title">
      <dl v-if="d.details?.length" class="grid grid-cols-2 gap-y-1.5 p-3 text-sm rounded-xl bg-surface-muted">
        <template v-for="x in d.details" :key="x.label">
          <dt class="text-ink-muted">{{ x.label }}</dt>
          <dd class="font-medium text-right tabular-nums text-ink">{{ x.value }}</dd>
        </template>
      </dl>
      <label v-if="d.editableAmount" class="flex flex-col gap-1 text-sm font-medium text-ink">
        Amount {{ incoming ? "received" : "paid" }}
        <MoneyInput v-model:amount="amount" :currency="currency" lock-currency :invalid="!!errors.amount" />
        <span v-if="errors.amount" class="text-xs text-error">{{ errors.amount }}</span>
        <span v-else-if="d.maxAmount" class="text-xs text-ink-subtle">Outstanding {{ formatMoney(d.maxAmount, currency) }}. A smaller amount is recorded as a part payment.</span>
      </label>
      <fieldset class="flex flex-col gap-1">
        <legend class="mb-1 text-sm font-medium text-ink">Method</legend>
        <div class="flex flex-wrap gap-2">
          <label v-for="m in PAYMENT_METHODS" :key="m.value" :class="['inline-flex gap-2 items-center px-3 h-9 text-sm rounded-lg border cursor-pointer', method === m.value ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink']">
            <input v-model="method" type="radio" :value="m.value" class="accent-[rgb(var(--primary))]" /> {{ m.label }}
          </label>
        </div>
        <span v-if="errors.method" class="text-xs text-error">{{ errors.method }}</span>
      </fieldset>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Reference{{ method === "CASH" ? " (optional)" : "" }}
          <input v-model="reference" :placeholder="method === 'CHEQUE' ? 'Cheque number' : 'Transfer or transaction ID'" :class="[inputClass, inputBorder(errors.reference)]" />
          <span v-if="errors.reference" class="text-xs text-error">{{ errors.reference }}</span>
        </label>
        <label v-if="method === 'BANK_TRANSFER' || method === 'CHEQUE'" class="flex flex-col gap-1 text-sm font-medium text-ink">
          Bank
          <input v-model="bank" placeholder="e.g. Commercial Bank of Ethiopia" :class="[inputClass, 'border-line']" />
        </label>
      </div>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        {{ incoming ? "Received on" : "Paid on" }}
        <DateField v-model="date" :max="todayIso()" :invalid="!!errors.date" />
        <span v-if="errors.date" class="text-xs text-error">{{ errors.date }}</span>
      </label>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button variant="success" :pending="pending" @click="submit">{{ incoming ? "Record receipt" : "Record payment" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
