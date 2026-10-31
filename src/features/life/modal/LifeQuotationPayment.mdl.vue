<script setup>
// Record the premium payment on an accepted quotation (PUT /quotation/pay). Finance enters the
// figures exactly as on the receipt; nothing is calculated here. data: { quotation: QuotationResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
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
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Record payment" :subtitle="`${q.quotationNumber || ''} · ${q.institutionName || ''}`">
      <form id="life-quotation-payment" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <TextField v-model="form.receiptNumber" label="Receipt number" focus maxlength="60" :error="errors.receiptNumber" />
          <TextField v-model="form.receiptDate" label="Receipt date" type="date" :max="maxDate" :error="errors.receiptDate" />
          <TextField v-for="[key, label] in PAYMENT_AMOUNTS" :key="key" v-model="form[key]" :label="label" numeric type="number" min="0" step="any" :error="errors[key]" />
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
