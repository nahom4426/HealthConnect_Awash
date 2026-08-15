<script setup lang="ts">
import { ref, watch } from 'vue';
import SearchSelect from '@/components/SearchSelect.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import DatePicker from '@/components/datePicker.vue';
import Button from '@/components/Button.vue';
import { getInstitutionsPolicyByStatus } from '@/features/institutions/api/institutionApi';
import { Status } from '@/types/interface';

interface ReportParam {
  name: string;
  label: string;
  type: 'DATE' | 'TEXT' | 'SELECT';
  required?: boolean;
  options?: string[];
}

const props = defineProps<{
  parameters: ReportParam[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', values: Record<string, string>): void;
  (e: 'change', values: Record<string, string>): void;
}>();

// Reactive values keyed by param name
const values = ref<Record<string, string>>({});

watch(
  () => props.parameters,
  (params) => {
    const next: Record<string, string> = {};
    params.forEach(p => { next[p.name] = values.value[p.name] ?? ''; });
    values.value = next;
  },
  { immediate: true }
);

function notifyChange() {
  emit('change', { ...values.value });
}

function handleSubmit() {
  const filtered: Record<string, string> = {};
  Object.entries(values.value).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) filtered[k] = v;
  });
  emit('submit', filtered);
}

function clearAll() {
  const cleared: Record<string, string> = {};
  props.parameters.forEach(p => { cleared[p.name] = ''; });
  values.value = cleared;
  // Force SearchSelect to reset by bumping a key
  resetKey.value++;
  emit('change', { ...values.value });
}

// Key to force-remount SearchSelect fields on clear
const resetKey = ref(0);

// Detect institution param by name convention
function isInstitutionParam(param: ReportParam): boolean {
  return param.name === 'institution_filter' || param.name === 'institution';
}

// Called when SearchSelect selects an institution
function handleInstitutionSelect(paramName: string, result: any) {
  values.value[paramName] = result?.institutionName || '';
  notifyChange();
}

// Map string[] options to { value, label }[] for CustomSelect
function toOptions(opts: string[] | undefined) {
  return (opts || []).map(o => ({ value: o, label: o }));
}
</script>

<template>
  <div class="rpf-root">
    <!-- No params notice -->
    <p v-if="parameters.length === 0" class="rpf-no-params">
      No parameters required — click <strong>Run Report</strong> to execute.
    </p>

    <!-- Parameter fields grid -->
    <div
      v-else
      class="rpf-grid"
      :style="{ gridTemplateColumns: `repeat(${Math.min(parameters.length, 3)}, 1fr)` }"
    >
      <div v-for="param in parameters" :key="param.name" class="rpf-field">
        <label class="rpf-label">
          {{ param.label }}
          <span v-if="param.required" class="rpf-required">*</span>
        </label>

        <!-- Institution → SearchSelect (same as CashClaim.vue) -->
        <SearchSelect
          v-if="isInstitutionParam(param)"
          :key="`inst-${param.name}-${resetKey}`"
          :placeholder="`Filter by ${param.label}`"
          :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
          :selectCb="(res) => handleInstitutionSelect(param.name, res)"
          :option="{ label: 'institutionName', value: 'institutionUuid' }"
        />

        <!-- DATE → datePicker component -->
        <DatePicker
          v-else-if="param.type === 'DATE'"
          :key="`date-${param.name}-${resetKey}`"
          :id="`param-${param.name}`"
          v-model="values[param.name]"
          @update:modelValue="notifyChange"
        />

        <!-- SELECT → CustomSelect component -->
        <CustomSelect
          v-else-if="param.type === 'SELECT'"
          :key="`sel-${param.name}-${resetKey}`"
          :id="`param-${param.name}`"
          v-model="values[param.name]"
          :options="toOptions(param.options)"
          placeholder="All"
          @update:modelValue="notifyChange"
          class="w-full"
        />

        <!-- TEXT → plain input styled to match project -->
        <div v-else class="rpf-text-wrap">
          <input
            :id="`param-${param.name}`"
            type="text"
            v-model="values[param.name]"
            @input="notifyChange"
            class="rpf-text-input"
            :placeholder="'Enter ' + param.label"
          />
        </div>
      </div>
    </div>

    <!-- Action buttons — use project Button component with primary/secondary -->
    <div class="rpf-actions">
      <Button
        type="secondary"
        :disabled="loading"
        @click="clearAll"
      >
        Clear
      </Button>

      <Button
        type="primary"
        :pending="loading"
        @click="handleSubmit"
      >
        Run Report
      </Button>
    </div>
  </div>
</template>

<style scoped>
.rpf-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rpf-no-params {
  font-size: 13px;
  color: #6b7280;
  padding: 6px 0;
}

/* Grid of param fields — responsive */
.rpf-grid {
  display: grid;
  gap: 12px;
}

@media (max-width: 768px) {
  .rpf-grid {
    grid-template-columns: 1fr !important;
  }
}

/* Individual field wrapper */
.rpf-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Label */
.rpf-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 3px;
}

.rpf-required {
  color: #ef4444;
  font-size: 13px;
  line-height: 1;
}

/* Make CustomSelect fill full width */
:deep(.inline-flex.relative) {
  width: 100%;
  min-width: unset;
}

/* Plain TEXT input */
.rpf-text-wrap {
  width: 100%;
}

.rpf-text-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.rpf-text-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.rpf-text-input::placeholder {
  color: #d1d5db;
}

/* Actions row */
.rpf-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 2px;
}
</style>
