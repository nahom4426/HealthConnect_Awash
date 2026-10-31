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
import { ageOn, benefitName, rateFor, toRiderBenefitRequest, validateRiderBenefit } from "../individual/individualRules";
import { createIndividualRiderBenefit, updateIndividualRiderBenefit } from "../api/policyApi";
import { getIndividualRiderRate } from "../api/productApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const benefit = props.data?.benefit || {};
const current = props.data?.riderBenefit;
const editing = !!current?.individualRiderBenefitUuid;
const riders = computed(() => (props.data?.riders || []).filter((r) => r.riderUuid === current?.riderUuid || !(props.data?.taken || []).includes(r.riderUuid)));

const form = reactive({ riderUuid: current?.riderUuid ?? "", benefits: current?.benefits ?? "" });
const errors = ref({});
const pending = ref(false);
const rider = computed(() => riders.value.find((r) => r.riderUuid === form.riderUuid));
const age = ageOn(benefit.dateOfBirth, benefit.beginDate);

const rate = ref(null);
const rateNote = ref("");
watch(() => form.riderUuid, async (uuid) => {
  rate.value = null;
  rateNote.value = "";
  if (!uuid || age === null) return;
  const res = await getIndividualRiderRate({ age, riderUuid: uuid });
  const row = Array.isArray(res?.data) ? res.data[0] : res?.data;
  if (res?.success && row) rate.value = rateFor(row, benefit.gender);
  else rateNote.value = `No rate is set up for this rider at age ${age}.`;
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
        <p v-if="rate" class="px-3 py-2 text-xs rounded-lg bg-surface-muted text-ink-muted">Rate at age {{ age }}: <span class="font-semibold text-ink">{{ rate.rate ?? "—" }}</span> per {{ rate.rateUnit ?? "—" }}. The premium is calculated by the system.</p>
        <p v-else-if="rateNote" class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">{{ rateNote }}</p>
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
