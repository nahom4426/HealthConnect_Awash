<script setup>
// Claim Overview tab (plan 8.3): clause check, loss details (editable while Registered), payee and
// status history.
import { computed, reactive, ref } from "vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import KeyValueGrid from "../KeyValueGrid.vue";
import FormField from "../FormField.vue";
import DateField from "../DateField.vue";
import MoneyInput from "../MoneyInput.vue";
import { cardClass, inputClass, inputBorder } from "../styles";
import { updateClaim } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { CAUSES_OF_LOSS, CLAIM_TYPES, label } from "../../constants";
import { formatDate, formatDateTime } from "../../utils/format";
import { formatMoney } from "../../utils/money";
import { filledItems } from "../../utils/quotationView";

const props = defineProps({ claim: { type: Object, required: true }, canWork: { type: Boolean, default: false } });
const emit = defineEmits(["updated"]);
const editing = ref(false);
const form = reactive({});
const errors = ref({});
const pending = ref(false);

const lossItems = computed(() =>
  filledItems([
    { label: "Loss date", value: formatDate(props.claim.lossDate) },
    { label: "Notified", value: formatDate(props.claim.notifiedDate) },
    { label: "Delivered", value: props.claim.deliveryDate ? formatDate(props.claim.deliveryDate) : null },
    { label: "Type", value: label(CLAIM_TYPES, props.claim.type) },
    { label: "Cause", value: label(CAUSES_OF_LOSS, props.claim.cause) },
    { label: "Estimated", value: formatMoney(props.claim.estimatedAmount, props.claim.currency) },
    { label: "Loss location", value: props.claim.lossLocation },
    { label: "Affected goods", value: props.claim.affectedGoods, wide: true },
    { label: "Description", value: props.claim.description, wide: true },
    { label: "Shipment", value: props.claim.quoteNo, to: props.claim.quoteId ? `/marine/quotes/${props.claim.quoteId}` : null },
    { label: "Coverage", value: props.claim.coverageClause },
    { label: "Exclusions", value: props.claim.exclusions, wide: true },
    { label: "Voyage", value: props.claim.voyage },
    { label: "Vessel", value: props.claim.certificate?.vessel },
    { label: "Handler", value: props.claim.handlerName },
  ]),
);

const payeeItems = computed(() =>
  filledItems([
    { label: "Payee", value: props.claim.payee?.name },
    { label: "Loss payee on the certificate", value: props.claim.lossPayee?.name ?? "None" },
    { label: "Note", value: props.claim.payeeNote, wide: true },
  ]),
);

function edit() {
  Object.assign(form, {
    lossDate: props.claim.lossDate,
    notifiedDate: props.claim.notifiedDate,
    deliveryDate: props.claim.deliveryDate ?? "",
    type: props.claim.type,
    cause: props.claim.cause,
    description: props.claim.description,
    lossLocation: props.claim.lossLocation ?? "",
    affectedGoods: props.claim.affectedGoods ?? "",
    estimatedAmount: props.claim.estimatedAmount,
  });
  errors.value = {};
  editing.value = true;
}
async function save() {
  pending.value = true;
  const res = await updateClaim(props.claim.id, { ...form });
  pending.value = false;
  if (res.ok) {
    editing.value = false;
    toasted(true, "Loss details saved");
    emit("updated", res.data);
  } else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
const BANNER = {
  COVERED: "bg-success-soft text-success-strong",
  NOT_COVERED: "bg-error-soft text-error-strong",
  CHECK: "bg-warning-soft text-warning-strong",
};
</script>

<template>
  <div class="grid gap-4">
    <div class="grid gap-3 lg:grid-cols-2">
      <p :class="['p-3 text-sm font-semibold rounded-xl', BANNER[claim.clauseCheck.result]]" role="status">{{ claim.clauseCheck.message }}</p>
      <p v-if="claim.outsidePeriod" class="p-3 text-sm font-semibold rounded-xl bg-warning-soft text-warning-strong">Loss date is outside the period of cover.</p>
      <p v-if="claim.assessment && !claim.assessment.covered" class="p-3 text-sm rounded-xl bg-error-soft text-error-strong lg:col-span-2"><strong>Declined:</strong> {{ claim.assessment.reason }}</p>
    </div>

    <div class="grid gap-4 xl:grid-cols-12 xl:items-start">
      <section :class="[cardClass, 'p-4 xl:col-span-8']">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-sm font-semibold text-ink">Loss</h3>
          <button v-if="canWork && claim.status === 'REGISTERED' && !editing" type="button" class="text-sm font-medium text-primary hover:underline" @click="edit">Edit</button>
        </div>
        <KeyValueGrid v-if="!editing" :items="lossItems" :cols="3" />
        <form v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" novalidate @submit.prevent="save">
          <FormField v-slot="{ id, invalid }" label="Loss date" name="lossDate" :error="errors.lossDate"><DateField :id="id" v-model="form.lossDate" :invalid="invalid" /></FormField>
          <FormField v-slot="{ id, invalid }" label="Notified date" name="notifiedDate" :error="errors.notifiedDate"><DateField :id="id" v-model="form.notifiedDate" :invalid="invalid" /></FormField>
          <FormField v-slot="{ id, invalid }" label="Delivery date" name="deliveryDate" :error="errors.deliveryDate"><DateField :id="id" v-model="form.deliveryDate" :invalid="invalid" /></FormField>
          <FormField v-slot="{ id }" label="Type" name="type"><select :id="id" v-model="form.type" :class="[inputClass, 'border-line']"><option v-for="t in CLAIM_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option></select></FormField>
          <FormField v-slot="{ id }" label="Cause" name="cause"><select :id="id" v-model="form.cause" :class="[inputClass, 'border-line']"><option v-for="c in CAUSES_OF_LOSS" :key="c.value" :value="c.value">{{ c.label }}</option></select></FormField>
          <FormField v-slot="{ id, invalid }" label="Estimated amount" name="estimatedAmount" :error="errors.estimatedAmount"><MoneyInput :id="id" v-model:amount="form.estimatedAmount" :currency="claim.currency" lock-currency :invalid="invalid" /></FormField>
          <FormField v-slot="{ id, invalid }" label="Loss location" name="lossLocation" :error="errors.lossLocation" class="lg:col-span-3"><input :id="id" v-model="form.lossLocation" maxlength="200" :class="[inputClass, inputBorder(invalid)]" /></FormField>
          <FormField v-slot="{ id, invalid }" label="Affected goods" name="affectedGoods" :error="errors.affectedGoods" class="lg:col-span-3"><textarea :id="id" v-model="form.affectedGoods" rows="2" maxlength="500" :class="[inputClass, inputBorder(invalid), 'h-auto py-2']" /></FormField>
          <FormField v-slot="{ id, invalid }" label="Description" name="description" :error="errors.description" class="lg:col-span-3"><textarea :id="id" v-model="form.description" rows="3" :class="[inputClass, inputBorder(invalid), 'h-auto py-2']" /></FormField>
          <div class="flex gap-2 justify-end lg:col-span-3"><Button variant="outline" @click="editing = false">Cancel</Button><Button html-type="submit" :pending="pending">Save</Button></div>
        </form>
      </section>

      <div class="grid gap-4 xl:col-span-4">
        <section :class="[cardClass, 'p-4']">
          <h3 class="mb-3 text-sm font-semibold text-ink">Payee</h3>
          <KeyValueGrid :items="payeeItems" :cols="1" />
        </section>

        <section :class="[cardClass, 'p-4']">
          <h3 class="mb-2 text-sm font-semibold text-ink">History</h3>
          <ol class="space-y-2 text-sm max-h-[28rem] overflow-y-auto pr-1">
            <li v-for="(h, i) in [...claim.history].reverse()" :key="i" class="pb-2 border-b border-line last:border-0 last:pb-0">
              <p class="font-medium text-ink">{{ h.action }}</p>
              <p v-if="h.note" class="text-ink-muted">{{ h.note }}</p>
              <p class="text-xs text-ink-subtle">{{ h.by }} · {{ formatDateTime(h.at) }}</p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>
