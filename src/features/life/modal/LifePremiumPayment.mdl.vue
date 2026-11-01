<script setup>
// Record payment of one premium instalment (POST /premium/payment). The amount is the instalment's
// amountDue as the backend set it; receipt numbers must be unique. data: { item: ScheduleItemResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { toasted } from "@/utils/utils";
import { formatAmount, formatDate } from "../constants/labels";
import { PAYMENT_METHODS, newPremiumPayment, toPremiumPayment, validatePremiumPayment } from "../servicing/servicingRules";
import { recordPremiumPayment } from "../api/premiumApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const item = props.data?.item || {};
const form = reactive(newPremiumPayment());
const errors = ref({});
const pending = ref(false);
const today = new Date().toISOString().slice(0, 10);

async function submit() {
  errors.value = validatePremiumPayment(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await recordPremiumPayment(toPremiumPayment(form, item));
  pending.value = false;
  if (res?.success) {
    toasted(true, "Payment recorded");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Record premium payment" :subtitle="`Instalment ${item.installmentNumber} · due ${formatDate(item.dueDate)}`">
      <form id="life-premium-payment" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <p class="px-3 py-2 text-sm rounded-lg bg-surface-muted text-ink">Amount <span class="font-semibold tabular-nums">{{ formatAmount(item.amountDue) }}</span>, as set by the system.</p>
        <TextField v-model="form.receiptNumber" label="Receipt number" focus maxlength="40" :error="errors.receiptNumber" />
        <TextField v-model="form.receiptDate" label="Receipt date" type="date" :max="today" :error="errors.receiptDate" />
        <SelectField v-model="form.method" label="Method" :options="PAYMENT_METHODS" :error="errors.method" />
        <TextField v-model="form.reference" label="Reference (optional)" maxlength="100" placeholder="Bank reference or cheque number" :error="errors.reference" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-premium-payment" :pending="pending">Record payment</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
