<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { useRulesStore } from '../stores/rulesStore';
import ModalParent from '@/components/ModalParent.vue';
import Button from '@/components/Button.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import { closeModal } from "@customizer/modal-x";
import { useToast } from 'vue-toastification';

const toast = useToast();

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  rule: {
    type: Object,
    default: null
  }
});

const rulesStore = useRulesStore();

const isEditing = ref(false);
const formError = ref('');
const saving = ref(false);
const showError = ref(false);
const errorTimeout = ref(null);

const formData = ref({
  ruleUuid: '',
  ruleName: '',
  description: '',
  stakeholderType: 'BROKER',
  policyType: 'GENERAL',
  commissionPercentage: 0,
  effectiveFrom: '',
  effectiveTo: '',
});

function getRuleFromProps() {
  if (props.rule) return props.rule;
  if (props.data?.rule) return props.data.rule;
  if (props.data?.ruleUuid) return props.data;
  return null;
}

// Clear error after timeout
function clearErrorAfterDelay() {
  if (errorTimeout.value) {
    clearTimeout(errorTimeout.value);
  }
  errorTimeout.value = setTimeout(() => {
    showError.value = false;
    errorTimeout.value = null;
  }, 8000);
}

// Set error and show it
function setError(message) {
  formError.value = message;
  showError.value = true;
  clearErrorAfterDelay();
}

// Update percentage with slider
function updatePercentage(value) {
  formData.value.commissionPercentage = parseFloat(value) || 0;
}

// --- Date helpers -----------------------------------------------------
function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toISODateTime(dateStr) {
  if (!dateStr) return null;
  return `${dateStr}T00:00:00.000Z`;
}

function formatDisplayDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function setFromToday() {
  formData.value.effectiveFrom = toDateInputValue(new Date());
}

function setToDuration(months) {
  const base = formData.value.effectiveFrom
    ? new Date(formData.value.effectiveFrom)
    : new Date();
  const target = new Date(base);
  target.setMonth(target.getMonth() + months);
  target.setDate(target.getDate() - 1);
  formData.value.effectiveTo = toDateInputValue(target);
}
// ------------------------------------------------------------------------

watch(
  () => [props.rule, props.data],
  () => {
    const rule = getRuleFromProps();
    
    if (rule) {
      isEditing.value = true;
      
      let fromDate = '';
      let toDate = '';
      
      if (rule.effectiveFrom) {
        const d = new Date(rule.effectiveFrom);
        if (!isNaN(d.getTime())) {
          fromDate = toDateInputValue(d);
        }
      }
      
      if (rule.effectiveTo) {
        const d = new Date(rule.effectiveTo);
        if (!isNaN(d.getTime())) {
          toDate = toDateInputValue(d);
        }
      }
      
      formData.value = { 
        ruleUuid: rule.ruleUuid || '',
        ruleName: rule.ruleName || rule.name || '',
        description: rule.description || '',
        stakeholderType: rule.stakeholderType || 'BROKER',
        policyType: rule.policyType || 'GENERAL',
        commissionPercentage: rule.commissionValue ? Number((rule.commissionValue * 100).toFixed(4)) : 0,
        effectiveFrom: fromDate,
        effectiveTo: toDate,
      };
    } else {
      isEditing.value = false;
      
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      nextYear.setDate(nextYear.getDate() - 1);

      formData.value = {
        ruleUuid: '',
        ruleName: '',
        description: '',
        stakeholderType: 'BROKER',
        policyType: 'GENERAL',
        commissionPercentage: 0,
        effectiveFrom: toDateInputValue(today),
        effectiveTo: toDateInputValue(nextYear),
      };
    }
    // Reset error state when form changes
    showError.value = false;
    formError.value = '';
    if (errorTimeout.value) {
      clearTimeout(errorTimeout.value);
      errorTimeout.value = null;
    }
  },
  { immediate: true, deep: true }
);

async function saveRule() {
  // Reset error state
  showError.value = false;
  formError.value = '';
  
  // Validation
  if (!formData.value.ruleName || !formData.value.policyType || formData.value.commissionPercentage === '' || !formData.value.effectiveFrom) {
    const errorMsg = 'Please fill all required fields';
    setError(errorMsg);
    toast.error(errorMsg);
    // Modal stays open - DO NOT call closeModal()
    return;
  }

  saving.value = true;

  const payload = {
    ruleName: formData.value.ruleName,
    stakeholderType: formData.value.stakeholderType,
    stakeholderUuid: '',
    policyType: formData.value.policyType,
    commissionType: 'PERCENTAGE',
    commissionValue: Number((formData.value.commissionPercentage / 100).toFixed(6)),
    effectiveFrom: toISODateTime(formData.value.effectiveFrom),
    effectiveTo: formData.value.effectiveTo ? toISODateTime(formData.value.effectiveTo) : toISODateTime(formData.value.effectiveFrom),
    description: formData.value.description
  };

  try {
    if (isEditing.value) {
      await rulesStore.updateRule(formData.value.ruleUuid, payload);
      toast.success(`Rule "${formData.value.ruleName}" updated successfully`);
    } else {
      await rulesStore.createRule(payload);
      toast.success(`Rule "${formData.value.ruleName}" created successfully`);
    }
    
    saving.value = false;
    // ✅ ONLY close on success
    closeModal();
  } catch (err) {
    saving.value = false;
    // ❌ DO NOT call closeModal() here - modal stays open
    
    const errData = err?.response?.data;
    let errorMsg = '';
    
    // Handle the error response you showed
    if (errData) {
      // Check for the specific error format you showed
      if (errData.type === 'INTERNAL_ERROR' && errData.detail) {
        // Extract meaningful message from detail
        if (errData.detail.includes('Overlapping commission rule')) {
          errorMsg = 'A commission rule already exists for this period. Please check the effective dates.';
        } else if (errData.detail.includes('BAD_REQUEST')) {
          // Extract the actual message after "BAD_REQUEST"
          const match = errData.detail.match(/BAD_REQUEST\s+"(.+?)"/);
          if (match) {
            errorMsg = match[1];
          } else {
            errorMsg = errData.detail;
          }
        } else {
          errorMsg = errData.detail;
        }
      } else if (errData?.type === 'VALIDATION_ERROR' && errData?.properties?.errors) {
        const msgs = Object.values(errData.properties.errors).flat();
        errorMsg = msgs.join(', ');
      } else if (errData?.detail) {
        if (errData.detail.includes('Overlapping commission rule')) {
          errorMsg = 'A commission rule already exists for this period. Please check the effective dates.';
        } else if (errData.detail.includes('Unable to find instance for payer')) {
          errorMsg = 'Service temporarily unavailable. Please try again later.';
        } else {
          errorMsg = errData.detail;
        }
      } else if (errData?.message) {
        errorMsg = errData.message;
      } else {
        errorMsg = errData?.title || 'An unexpected error occurred.';
      }
    } else if (err?.message) {
      errorMsg = err.message;
    } else {
      errorMsg = rulesStore.error || 'Failed to save rule. Please try again.';
    }
    
    // Show error and keep modal open
    setError(errorMsg);
    toast.error(errorMsg);
    
    // ❌ DO NOT close modal - it stays open for user to fix and retry
  }
}

// Clean up timeout on component unmount
onBeforeUnmount(() => {
  if (errorTimeout.value) {
    clearTimeout(errorTimeout.value);
  }
});
</script>

<template>
  <ModalParent>
    <div class="modal-card w-full max-w-2xl flex flex-col min-w-[540px] bg-white rounded-3xl overflow-hidden">
      <!-- Modal Header -->
      <div class="relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/70 to-primary/40"></div>
        <div class="flex items-center justify-between px-7 py-6 bg-gradient-to-br from-primary/[0.06] via-white to-white">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 tracking-tight">{{ isEditing ? 'Edit Commission Rule' : 'Create Commission Rule' }}</h2>
              <p class="text-xs text-gray-500 mt-0.5">{{ isEditing ? 'Update the rule details below' : 'Define a new commission structure' }}</p>
            </div>
          </div>
          <button 
            class="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200" 
            @click="closeModal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4.5 h-4.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="modal-body-wrapper flex-1 px-7 py-6 overflow-y-auto max-h-[calc(100vh-13rem)] bg-gray-50/60">
        <div class="flex flex-col gap-5">
          <!-- Error Banner - Stays visible until user dismisses or fixes -->
          <transition 
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-4 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-4 scale-95"
          >
            <div v-if="showError" class="px-4 py-3.5 text-sm text-red-700 bg-gradient-to-r from-red-50 to-red-50/50 rounded-2xl border border-red-200/60 shadow-sm">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-red-500">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <span class="font-medium">Error:</span>
                  <span class="ml-1">{{ formError }}</span>
                </div>
                <button 
                  @click="showError = false; formError = ''" 
                  class="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </transition>

          <!-- Rule Name -->
          <div class="field-card">
            <Input
              v-model="formData.ruleName"
              :attributes="{ 
                placeholder: 'e.g. Standard Motor Commission', 
                name: 'ruleName', 
                label: 'Rule Name', 
                required: true,
                class: 'text-sm'
              }"
            />
          </div>

          <!-- Effective Period -->
          <div class="field-card !p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-primary">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Effective Period</span>
              </div>
              <span class="text-[11px] text-gray-400" v-if="formData.effectiveFrom && formData.effectiveTo">
                {{ formatDisplayDate(formData.effectiveFrom) }} → {{ formatDisplayDate(formData.effectiveTo) }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-[11px] font-medium text-gray-600 uppercase tracking-wider">
                    From <span class="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    @click="setFromToday"
                    class="text-[11px] font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    Today
                  </button>
                </div>
                <div class="date-input-shell">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="date-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    v-model="formData.effectiveFrom"
                    class="date-input"
                    required
                  />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-[11px] font-medium text-gray-600 uppercase tracking-wider">
                    To
                  </label>
                </div>
                <div class="date-input-shell">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="date-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    v-model="formData.effectiveTo"
                    class="date-input"
                  />
                </div>
              </div>
            </div>

            <div class="flex gap-2 mt-3 flex-wrap">
              <span class="text-[11px] text-gray-400 self-center mr-1">Quick set:</span>
              <button
                v-for="opt in [{ label: '1 mo', months: 1 }, { label: '3 mo', months: 3 }, { label: '6 mo', months: 6 }, { label: '1 yr', months: 12 }]"
                :key="opt.label"
                type="button"
                @click="setToDuration(opt.months)"
                class="preset-chip"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="field-card">
            <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              v-model="formData.description"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-inherit resize-vertical min-h-[80px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              placeholder="Brief description of this rule..."
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="field-card">
              <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                Stakeholder Type
              </label>
              <Select
                name="stakeholderType"
                :obj="true"
                :options="[{ value: 'BROKER', label: 'Broker' }, { value: 'AGENT', label: 'Agent' }]"
                :modelValue="formData.stakeholderType"
                @update:modelValue="v => formData.stakeholderType = v"
              />
            </div>
            <div class="field-card">
              <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                Policy Type
              </label>
              <Select
                name="policyType"
                :obj="true"
                :options="[
                  { value: 'GENERAL', label: 'General' },
                  { value: 'INDIVIDUAL', label: 'INDIVIDUAL' }
                ]"
                :modelValue="formData.policyType"
                @update:modelValue="v => formData.policyType = v"
              />
            </div>
          </div>

          <!-- Commission Percentage -->
          <div class="bg-gradient-to-br from-primary/[0.07] to-primary/[0.12] rounded-2xl p-5 border border-primary/20">
            <div class="flex justify-between items-center mb-3">
              <label class="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                Commission Percentage <span class="text-red-500">*</span>
              </label>
              <span class="text-2xl font-bold text-primary">
                {{ formData.commissionPercentage }}%
              </span>
            </div>
            
            <div class="relative">
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                v-model="formData.commissionPercentage"
                @input="updatePercentage($event.target.value)"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-primary
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:shadow-primary/30
                       [&::-webkit-slider-thumb]:transition-all
                       [&::-webkit-slider-thumb]:hover:scale-110
                       [&::-moz-range-thumb]:w-5
                       [&::-moz-range-thumb]:h-5
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-primary
                       [&::-moz-range-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:border-0"
              />
              
              <div class="flex justify-between px-1 mt-1">
                <span class="text-xs text-gray-400">0%</span>
                <span class="text-xs text-gray-400">25%</span>
                <span class="text-xs text-gray-400">50%</span>
                <span class="text-xs text-gray-400">75%</span>
                <span class="text-xs text-gray-400">100%</span>
              </div>
            </div>

            <div class="flex gap-2 mt-3 flex-wrap">
              <button
                v-for="value in [5, 10, 15, 20, 25, 30, 50, 100]"
                :key="value"
                @click="formData.commissionPercentage = value"
                class="px-3 py-1 text-xs font-medium rounded-full transition-all duration-200"
                :class="formData.commissionPercentage === value 
                  ? 'bg-primary text-white shadow-md shadow-primary/30' 
                  : 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary'"
              >
                {{ value }}%
              </button>
            </div>

            <p class="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Drag the slider or click a quick-select button
            </p>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-7 py-4 bg-white border-t border-gray-100 flex justify-end gap-3">
        <Button 
          variant="outline" 
          @click="closeModal"
          class="px-5 py-2.5 hover:bg-gray-50 transition-all duration-200 rounded-xl"
          :disabled="saving"
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          @click="saveRule" 
          :pending="saving"
          class="px-6 py-2.5 bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200 rounded-xl"
        >
          <template #default>
            <span class="flex items-center gap-2">
              <svg v-if="!saving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {{ isEditing ? 'Update Rule' : 'Create Rule' }}
            </span>
          </template>
        </Button>
      </div>
    </div>
  </ModalParent>
</template>

<style scoped>
.modal-card {
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.25), 0 8px 24px -8px rgba(0, 0, 0, 0.1);
  animation: modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.field-card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid rgb(243 244 246);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.date-input-shell {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.75rem;
  background: rgb(249 250 251);
  transition: all 0.2s ease;
}

.date-input-shell:focus-within {
  border-color: var(--primary-color, #3b82f6);
  background: white;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color, #3b82f6) 15%, transparent);
}

.date-icon {
  width: 16px;
  height: 16px;
  margin-left: 12px;
  color: var(--primary-color, #3b82f6);
  flex-shrink: 0;
  pointer-events: none;
}

.date-input {
  width: 100%;
  padding: 0.65rem 0.75rem 0.65rem 0.5rem;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-family: inherit;
  color: rgb(31 41 55);
  outline: none;
  color-scheme: light;
}

.date-input::-webkit-calendar-picker-indicator {
  opacity: 0.5;
  padding: 4px;
  cursor: pointer;
}

.date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.preset-chip {
  padding: 0.3rem 0.7rem;
  font-size: 11px;
  font-weight: 500;
  border-radius: 9999px;
  background: rgb(243 244 246);
  color: rgb(75 85 99);
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: color-mix(in srgb, var(--primary-color, #3b82f6) 12%, transparent);
  color: var(--primary-color, #3b82f6);
}

.modal-body-wrapper::-webkit-scrollbar {
  width: 6px;
}

.modal-body-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body-wrapper::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 9999px;
}

.modal-body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.modal-body-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.modal-body-wrapper:hover {
  scrollbar-color: #9ca3af transparent;
}

input[type="range"]::-moz-range-track {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 9999px;
  border: none;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color, #3b82f6);
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
}
</style>