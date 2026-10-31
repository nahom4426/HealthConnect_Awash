<script setup>
// Record the premium payment on an accepted quotation (PUT /quotation/{uuid}/pay). The requested
// premium is the server's grossPremium; tax amounts come from the receipt until the server can
// calculate them. Nothing is calculated here. data: { quotation: QuotationResponse }
import { computed, reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import { toasted } from "@/utils/utils";
import { formatAmount } from "../constants/labels";
import { recordQuotationPayment } from "../api/quotationApi";
import { PAYMENT_TAXES, taxesCalculated, toPaymentBody, validatePayment } from "../quotations/quotationRules";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const q = props.data?.quotation || {};
const taxesRequired = !taxesCalculated(q);

const form = reactive({ receiptNumber: "", receiptDate: new Date().toISOString().slice(0, 10), withHoldingTax: "", revenueStamp: "", netPremium: "" });
const errors = ref({});
const pending = ref(false);
const maxDate = new Date().toISOString().slice(0, 10);

// Server figures shown for reference: the premium due and, once configured, the calculated taxes
const figures = computed(() => [
  ["Gross premium due", q.grossPremium ?? q.requestedPremium],
  ["Term premium", q.termPremium],
  ["Rider premium", q.riderPremium],
  ...Object.keys(q).filter((k) => k.startsWith("calculated") && q[k] != null).map((k) => [k.replace(/^calculated/, "").replace(/([A-Z])/g, " $1").trim(), q[k]]),
].filter(([, v]) => v != null));

async function submit() {
  errors.value = validatePayment(form, { taxesRequired });
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await recordQuotationPayment(q.quotationUuid, toPaymentBody(form, { taxesRequired }));
  pending.value = false;
  if (res?.success) {
    toasted(true, "Payment recorded");
    closeModal(res.data || true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Record payment" :subtitle="`${q.quotationNumber || ''} · ${q.institutionName || ''}`">
      <form id="life-quotation-payment" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <dl v-if="figures.length" class="grid gap-x-6 gap-y-2 p-4 rounded-xl sm:grid-cols-3 bg-surface-muted">
          <div v-for="[label, value] in figures" :key="label">
            <dt class="text-xs text-ink-subtle">{{ label }}</dt>
            <dd class="text-sm font-semibold tabular-nums text-ink">{{ formatAmount(value) }}</dd>
          </div>
        </dl>
        <div class="grid gap-4 sm:grid-cols-2">
          <TextField v-model="form.receiptNumber" label="Receipt number" required focus maxlength="60" :error="errors.receiptNumber" />
          <TextField v-model="form.receiptDate" label="Receipt date" required type="date" :max="maxDate" :error="errors.receiptDate" />
          <template v-if="taxesRequired">
            <TextField v-for="[key, label] in PAYMENT_TAXES" :key="key" v-model="form[key]" :label="label" required numeric type="number" min="0" step="any" :error="errors[key]" />
          </template>
        </div>
        <p class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">
          <template v-if="taxesRequired">Tax rates aren't configured yet, so enter the withholding tax, revenue stamp and net premium exactly as on the receipt.</template>
          <template v-else>Taxes are calculated by the system.</template>
          The quotation becomes Paid and can no longer be changed.
        </p>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-quotation-payment" :pending="pending">Record payment</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
