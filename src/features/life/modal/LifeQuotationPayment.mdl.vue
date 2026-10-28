<script setup>
// Record the premium payment on an accepted quotation (PUT /quotation/pay). Finance enters the
// figures exactly as on the receipt; nothing is calculated here. data: { quotation: QuotationResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { payQuotation } from "../api/quotationApi";
import { PAYMENT_AMOUNTS, toPaymentParams, validatePayment } from "../quotations/quotationRules";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const q = props.data?.quotation || {};

const form = reactive({ receiptNumber: "", receiptDate: new Date().toISOString().slice(0, 10), requestedPremium: q.requestedPremium ?? "", withHoldingTax: "", revenueStamp: "", netPremium: "" });
const errors = ref({});
const pending = ref(false);
const maxDate = new Date().toISOString().slice(0, 10);

async function submit() {
  errors.value = validatePayment(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await payQuotation(q.quotationUuid, toPaymentParams(form));
  pending.value = false;
  if (res?.success) {
    toasted(true, "Payment recorded");
    closeModal(res.data || true);
  }
}

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Record payment" :subtitle="`${q.quotationNumber || ''} · ${q.institutionName || ''}`">
      <form id="life-quotation-payment" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Receipt number
            <input v-model="form.receiptNumber" v-focus="true" maxlength="60" :class="[field, errors.receiptNumber ? 'border-error' : 'border-line']" />
            <span v-if="errors.receiptNumber" class="text-xs text-error">{{ errors.receiptNumber }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Receipt date
            <input v-model="form.receiptDate" type="date" :max="maxDate" :class="[field, errors.receiptDate ? 'border-error' : 'border-line']" />
            <span v-if="errors.receiptDate" class="text-xs text-error">{{ errors.receiptDate }}</span>
          </label>
          <label v-for="[key, label] in PAYMENT_AMOUNTS" :key="key" class="flex flex-col gap-1 text-sm font-medium text-ink">
            {{ label }}
            <input v-model="form[key]" type="number" min="0" step="any" inputmode="decimal" :class="[field, 'text-right tabular-nums', errors[key] ? 'border-error' : 'border-line']" />
            <span v-if="errors[key]" class="text-xs text-error">{{ errors[key] }}</span>
          </label>
        </div>
        <p class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">Enter the amounts exactly as they appear on the receipt. The quotation becomes Paid and can no longer be changed.</p>
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
