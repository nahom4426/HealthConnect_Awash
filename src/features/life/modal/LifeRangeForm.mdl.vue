<script setup>
// Collects one medical underwriting range: insurance type, age band, sum-assured band and the
// medical tests required inside it. Doesn't call the API; closes with { values, testUuids }.
// data: { range?, tests: FclMedicalParameterResponse[], selected?: string[], allowType?: boolean }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
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

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink tabular-nums focus:border-primary focus:ring-2 focus:ring-primary/15";
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
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">From age
          <input v-model="form.minAge" type="number" min="0" step="1" :class="[field, errors.minAge ? 'border-error' : 'border-line']" />
          <span v-if="errors.minAge" class="text-xs text-error">{{ errors.minAge }}</span>
        </label>
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">To age
          <input v-model="form.maxAge" type="number" min="0" step="1" :class="[field, errors.maxAge ? 'border-error' : 'border-line']" />
          <span v-if="errors.maxAge" class="text-xs text-error">{{ errors.maxAge }}</span>
        </label>
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">From sum assured (ETB)
          <input v-model="form.lowerLimit" type="number" min="0" step="any" :class="[field, errors.lowerLimit ? 'border-error' : 'border-line']" />
          <span v-if="errors.lowerLimit" class="text-xs text-error">{{ errors.lowerLimit }}</span>
        </label>
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">To sum assured (ETB)
          <input v-model="form.upperLimit" type="number" min="0" step="any" :class="[field, errors.upperLimit ? 'border-error' : 'border-line']" />
          <span v-if="errors.upperLimit" class="text-xs text-error">{{ errors.upperLimit }}</span>
        </label>
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
