<script setup>
// Collects one medical underwriting range: insurance type, age band, sum-assured band and the
// medical tests required inside it. Doesn't call the API; closes with { values, testUuids }.
// data: { range?, tests: FclMedicalParameterResponse[], selected?: string[], allowType?: boolean }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import { InsuranceType } from "../constants/statuses";
import { validateRange } from "../reinsurance/treatyRules";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const r = props.data.range || {};
const editing = !!r.fclMedicalUnderwritingRangeUuid;
const form = reactive({
  insuranceType: r.insuranceType || InsuranceType.Group,
  minAge: r.minAge ?? "", maxAge: r.maxAge ?? "", lowerLimit: r.lowerLimit ?? "", upperLimit: r.upperLimit ?? "",
});
const tests = props.data.tests || [];
const selected = ref([...(props.data.selected || [])]);
const errors = ref({});

function submit() {
  errors.value = validateRange(form);
  if (!selected.value.length) errors.value.tests = "Pick at least one test";
  if (Object.keys(errors.value).length) return;
  closeModal({
    values: { insuranceType: form.insuranceType, minAge: Number(form.minAge), maxAge: Number(form.maxAge), lowerLimit: Number(form.lowerLimit), upperLimit: Number(form.upperLimit) },
    testUuids: selected.value,
  });
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit medical range' : 'Add medical range'" subtitle="Lives in this age and sum-assured band need these tests before the reinsurer accepts them.">
      <form id="life-range-form" class="grid gap-4 p-5 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <fieldset v-if="data.allowType !== false" class="sm:col-span-2" :disabled="editing">
          <legend class="mb-1 text-sm font-medium text-ink">Applies to</legend>
          <div class="flex gap-2">
            <label v-for="t in Object.values(InsuranceType)" :key="t" :class="['flex gap-2 items-center px-3 h-9 text-sm rounded-lg border cursor-pointer', form.insuranceType === t ? 'border-primary bg-primary/10 text-primary' : 'border-line text-ink']">
              <input v-model="form.insuranceType" type="radio" :value="t" class="accent-primary" /> {{ t }}
            </label>
          </div>
          <p v-if="editing" class="mt-1 text-xs text-ink-subtle">The type can't be changed on an existing range.</p>
        </fieldset>
        <TextField v-model.number="form.minAge" label="From age" type="number" numeric min="0" step="1" :error="errors.minAge" />
        <TextField v-model.number="form.maxAge" label="To age" type="number" numeric min="0" step="1" :error="errors.maxAge" />
        <TextField v-model.number="form.lowerLimit" label="From sum assured (ETB)" type="number" numeric min="0" step="any" :error="errors.lowerLimit" />
        <TextField v-model.number="form.upperLimit" label="To sum assured (ETB)" type="number" numeric min="0" step="any" :error="errors.upperLimit" />
        <fieldset class="sm:col-span-2">
          <legend class="mb-1 text-sm font-medium text-ink">Required tests</legend>
          <p v-if="!tests.length" class="text-sm text-ink-muted">No active medical tests yet — add them under Reinsurance → Medical tests.</p>
          <div v-else class="grid gap-2 sm:grid-cols-2">
            <label v-for="t in tests" :key="t.fclMedicalParameterUuid" :class="['flex gap-2 items-start p-2.5 text-sm rounded-lg border cursor-pointer', selected.includes(t.fclMedicalParameterUuid) ? 'border-primary bg-primary/5' : 'border-line']">
              <input v-model="selected" type="checkbox" :value="t.fclMedicalParameterUuid" class="mt-0.5 accent-primary" />
              <span><span class="font-mono text-xs font-semibold text-ink">{{ t.label }}</span> <span class="text-ink-muted">{{ t.medicalTestDescription }}</span></span>
            </label>
          </div>
          <span v-if="errors.tests" class="text-xs text-error">{{ errors.tests }}</span>
        </fieldset>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-range-form">{{ editing ? "Apply changes" : "Add range" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
