<script setup lang="ts">
import { ref, watch } from 'vue';
import SearchSelect from '@/components/SearchSelect.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import DatePicker from '@/components/datePicker.vue';
import Button from '@/components/Button.vue';
import { getInstitutionsPolicyByStatus } from '@/features/health/institutions/api/institutionApi';
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
    <div v-if="parameters.length === 0" class="rpf-no-params-row">
      <span class="rpf-no-params-text">No parameters required for this report.</span>
      <Button type="primary" :pending="loading" @click="handleSubmit" class="rpf-btn-primary">
        Run Report
      </Button>
    </div>

    <!-- Parameter fields layout -->
    <div v-else class="rpf-form-body">
      <div class="rpf-fields-container">
        <div v-for="param in parameters" :key="param.name" class="rpf-field">
          <label class="rpf-label">
            {{ param.label }}
            <span v-if="param.required" class="rpf-required">*</span>
          </label>

          <!-- Institution → SearchSelect -->
          <SearchSelect
            v-if="isInstitutionParam(param)"
            :key="`inst-${param.name}-${resetKey}`"
            :placeholder="`Filter ${param.label}`"
            :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
            :selectCb="(res) => handleInstitutionSelect(param.name, res)"
            :option="{ label: 'institutionName', value: 'institutionUuid' }"
            class="rpf-input-ctrl"
          />

          <!-- DATE → datePicker component -->
          <DatePicker
            v-else-if="param.type === 'DATE'"
            :key="`date-${param.name}-${resetKey}`"
            :id="`param-${param.name}`"
            v-model="values[param.name]"
            @update:modelValue="notifyChange"
            class="rpf-input-ctrl"
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
            class="w-full rpf-input-ctrl"
          />

          <!-- TEXT → plain input -->
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

      <!-- Action buttons -->
      <div class="rpf-actions-wrap">
        <Button type="secondary" :disabled="loading" @click="clearAll" class="rpf-btn-secondary">
          Clear
        </Button>
        <Button type="primary" :pending="loading" @click="handleSubmit" class="rpf-btn-primary">
          Run Report
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rpf-root {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.rpf-no-params-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}

.rpf-no-params-text {
  font-size: 12px;
  color: rgb(var(--ink-muted));
  font-weight: 500;
}

/* Flexible Form Body */
.rpf-form-body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .rpf-form-body {
    flex-direction: column;
    align-items: stretch;
  }
}

.rpf-fields-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 12px;
  flex: 1;
  min-width: 0;
}

/* Individual field wrapper */
.rpf-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  width: 100%;
}

/* Label */
.rpf-label {
  font-size: 10px;
  font-weight: 700;
  color: rgb(var(--ink-muted));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.rpf-required {
  color: rgb(var(--error));
  font-size: 11px;
  line-height: 1;
}

/* Component overrides for modern styling */
:deep(.inline-flex.relative),
:deep(.search-select-root),
:deep(.dp__main) {
  width: 100% !important;
  min-width: 0 !important;
  height: 36px !important;
}

:deep(.inline-flex.relative) {
  height: 36px !important;
  min-height: 36px !important;
  border-radius: 8px !important;
  border-color: rgb(var(--line-strong)) !important;
}

:deep(.dp__input) {
  height: 36px !important;
  font-size: 12.5px !important;
  border-radius: 8px !important;
  border-color: rgb(var(--line-strong)) !important;
  color: rgb(var(--ink)) !important;
}

:deep(.search-select-input) {
  height: 36px !important;
  border-radius: 8px !important;
  border-color: rgb(var(--line-strong)) !important;
  font-size: 12.5px !important;
}

/* Plain TEXT input */
.rpf-text-wrap {
  width: 100%;
  min-width: 0;
}

.rpf-text-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1.5px solid rgb(var(--line-strong));
  border-radius: 8px;
  font-size: 12.5px;
  color: rgb(var(--ink));
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.rpf-text-input:focus {
  border-color: rgb(var(--primary));
  box-shadow: 0 0 0 3px rgb(var(--primary) / 0.12);
}

.rpf-text-input::placeholder {
  color: rgb(var(--ink-subtle));
}

/* Action Buttons Wrapper */
.rpf-actions-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 36px;
}

.rpf-btn-secondary {
  height: 36px !important;
  padding: 0 14px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  white-space: nowrap;
}

.rpf-btn-primary {
  height: 36px !important;
  padding: 0 18px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-hover))) !important;
  box-shadow: 0 2px 8px rgb(var(--primary) / 0.25) !important;
  white-space: nowrap;
}
.rpf-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgb(var(--primary) / 0.35) !important;
}
</style>
