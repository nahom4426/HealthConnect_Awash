<script setup>
// Add or change a rider on an individual policy (IndividualRiderBenefitRequest, no premium: the
// backend prices it). data: { benefit: BenefitResponse, riderBenefit?: IndividualRiderBenefitResponse,
// riders: RiderResponse[], taken: riderUuid[] }
import { computed, reactive, ref, watch } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { toasted } from "@/utils/utils";
import { formatAmount } from "../constants/labels";
import { benefitName, fromBenefit, quoteParams, toRiderBenefitRequest, validateRiderBenefit } from "../individual/individualRules";
import { createIndividualRiderBenefit, getBenefitQuote, updateIndividualRiderBenefit } from "../api/policyApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const benefit = props.data?.benefit || {};
const current = props.data?.riderBenefit;
const editing = !!current?.individualRiderBenefitUuid;
const riders = computed(() => (props.data?.riders || []).filter((r) => r.riderUuid === current?.riderUuid || !(props.data?.taken || []).includes(r.riderUuid)));

const form = reactive({ riderUuid: current?.riderUuid ?? "", benefits: current?.benefits ?? "" });
const errors = ref({});
const pending = ref(false);
const rider = computed(() => riders.value.find((r) => r.riderUuid === form.riderUuid));
// The backend's quote for the policy with this rider, to show the rider's premium before saving
const quote = ref(null);
const quoteNote = ref("");
let timer, seq = 0;
watch(() => [form.riderUuid, form.benefits], () => {
  clearTimeout(timer);
  quote.value = null;
  quoteNote.value = "";
  const params = form.riderUuid && Number(form.benefits) > 0 ? quoteParams(fromBenefit(benefit), [{ riderUuid: form.riderUuid, benefits: form.benefits }]) : null;
  if (!params) return;
  timer = setTimeout(async () => {
    const mine = ++seq;
    const res = await getBenefitQuote(params);
    if (mine !== seq) return;
    if (res?.success) quote.value = res.data?.riders?.find((r) => r.riderUuid === form.riderUuid) || null;
    else quoteNote.value = res?.error || "No price for this rider on this policy.";
  }, 400);
}, { immediate: true });

async function submit() {
  errors.value = validateRiderBenefit(form, rider.value);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = editing
    ? await updateIndividualRiderBenefit(current.individualRiderBenefitUuid, toRiderBenefitRequest(form, benefit.benefitUuid, current.status))
    : await createIndividualRiderBenefit([toRiderBenefitRequest(form, benefit.benefitUuid, "PENDING")]);
  pending.value = false;
  if (res?.success) {
    toasted(true, editing ? "Rider updated" : "Rider added");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Change rider' : 'Add rider'" :subtitle="benefitName(benefit)">
      <form id="life-rider-benefit-form" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <SelectField
          v-model="form.riderUuid"
          label="Rider"
          focus
          :disabled="editing"
          :options="riders.map((r) => ({ value: r.riderUuid, label: r.riderName }))"
          :placeholder="riders.length ? 'Select…' : 'Every active rider is already on this policy'"
          :error="errors.riderUuid"
          :hint="rider?.riderDescription || undefined"
        />
        <TextField
          v-model.number="form.benefits"
          label="Benefit amount"
          type="number"
          numeric
          min="0"
          step="any"
          :error="errors.benefits"
          :hint="rider ? `Allowed ${formatAmount(rider.minLimit)} – ${formatAmount(rider.maxLimit)}` : undefined"
        />
        <p v-if="quote" class="px-3 py-2 text-xs rounded-lg bg-surface-muted text-ink-muted">Premium <span class="font-semibold text-ink">{{ formatAmount(quote.premium) }}</span> at a rate of {{ quote.rate ?? "—" }} per {{ quote.rateUnit ?? "—" }}, as priced by the system.</p>
        <p v-else-if="quoteNote" class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">{{ quoteNote }}</p>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-rider-benefit-form" :pending="pending">{{ editing ? "Save" : "Add rider" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
