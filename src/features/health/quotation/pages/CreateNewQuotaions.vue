<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import SingleInstitutionDataProvider from "@/features/health/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationForm from "../form/QuotationForm.vue";
import QuotationCreationDataProvider from "../components/QuotationCreationDataProvider.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { ref, computed, watch } from "vue";
import { saveQuotationDraft, issueQuotation } from "@/features/health/quotation/api/quotationApi";
import { useRouter } from "vue-router";
import { toasted } from "@/utils/utils";
import { useApiRequest } from "@/composables/useApiRequest";
import { useBrokerStore } from "@/features/health/broker_management/stores/brokerStore";

const showInstitution = ref(false)
const showMore = ref(true)
const isSubmitting = ref(false);
const pendingAction = ref(''); // Track pending action for loading state
let lastCallTime = 0;
const DEBOUNCE_TIME = 1000;

const brokerStore = useBrokerStore();
const isStakeholderEnabled = ref(false);
const stakeholderType = ref('BROKER'); // 'BROKER' or 'AGENT'
const selectedBrokerUuid = ref(null);
const selectedStakeholder = ref(null);
const stakeholderSearch = ref('');
const attemptedSubmit = ref(false);

const filteredStakeholders = computed(() => {
  const list = brokerStore.activeStakeholdersByType(stakeholderType.value);
  if (!stakeholderSearch.value) return list;
  const q = stakeholderSearch.value.toLowerCase();
  return list.filter(b =>
    (b.firstName + ' ' + b.lastName).toLowerCase().includes(q) ||
    b.email?.toLowerCase().includes(q) ||
    b.phoneNumber?.toLowerCase().includes(q) ||
    b.licenseNumber?.toLowerCase().includes(q)
  );
});

watch(isStakeholderEnabled, async (newVal) => {
  if (newVal && brokerStore.brokers.length === 0) {
    await brokerStore.fetchAllBrokers({ page: 0, size: 100 });
  }
});

watch(stakeholderType, () => {
  // Reset selection when type changes
  selectedBrokerUuid.value = null;
  selectedStakeholder.value = null;
  stakeholderSearch.value = '';
});

function selectStakeholder(stakeholder) {
  selectedBrokerUuid.value = stakeholder.stakeholderUuid;
  selectedStakeholder.value = stakeholder;
  stakeholderSearch.value = '';
}

function clearStakeholder() {
  selectedBrokerUuid.value = null;
  selectedStakeholder.value = null;
  stakeholderSearch.value = '';
}

// ── Date defaults (today to 1 year minus 1 day) ─────────────────
function getDefaultBeginDate() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

function getDefaultEndDate(startDate = null) {
  const baseDate = startDate ? new Date(startDate) : new Date();
  const nextYear = new Date(baseDate);
  nextYear.setFullYear(baseDate.getFullYear() + 1);
  // Subtract 1 day to make it 1 year minus 1 day
  nextYear.setDate(nextYear.getDate() - 1);
  return nextYear.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

// Calculate duration between dates
function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  
  // Normalize both dates to midnight
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffTime = Math.abs(endDay.getTime() - startDay.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  if (diffDays === 365) return '1 year';
  if (diffDays === 366) return '1 year (leap year)';
  
  let years = endDay.getFullYear() - startDay.getFullYear();
  let months = endDay.getMonth() - startDay.getMonth();
  let days = endDay.getDate() - startDay.getDate() + 1;

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(endDay.getFullYear(), endDay.getMonth(), 0).getDate();
    days += prevMonth;
  }
  
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  
  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  
  return parts.length > 0 ? parts.join(' ') : '0 days';
}

// Reactive date fields with defaults
const beginDate = ref(getDefaultBeginDate());
const endDate = ref(getDefaultEndDate());

// Watch for changes to begin date and auto-update end date
watch(beginDate, (newBeginDate) => {
  if (newBeginDate) {
    // Automatically set end date to 1 year minus 1 day from new begin date
    endDate.value = getDefaultEndDate(newBeginDate);
  }
});

// Computed property for date validation
const dateError = computed(() => {
  if (!beginDate.value || !endDate.value) {
    return 'Both dates are required';
  }
  
  const begin = new Date(beginDate.value);
  const end = new Date(endDate.value);
  
  if (isNaN(begin.getTime())) {
    return 'Invalid begin date';
  }
  
  if (isNaN(end.getTime())) {
    return 'Invalid end date';
  }
  
  if (end <= begin) {
    return 'End date must be after begin date';
  }
  
  // Optional: Add maximum duration validation (e.g., max 5 years)
  const maxDuration = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
  if (end.getTime() - begin.getTime() > maxDuration) {
    return 'Coverage period cannot exceed 5 years';
  }
  
  return null;
});

const institutionForm = ref({
  institutionName: "",
  email: "",
  tinNumber: "",
  telephone: "",
  description: "",
  category: "",
  referralType: "",
  address: "",
})

const prefilled = ref(false)
const currentInstitution = ref(null)
function prefillOnce(v) {
  if (!prefilled.value && v) {
    institutionForm.value = {
      institutionName: v.institutionName || "",
      email: v.email || "",
      tinNumber: v.tinNumber || "",
      telephone: v.telephone || "",
      description: v.description || "",
      category: v.category || "",
      referralType: v.referralType || "Direct",
      address: `${v.address1 || ''} ${v.address2 || ''} ${v.address3 || ''}, ${v.state || ''}`,
    }
    prefilled.value = true
    currentInstitution.value = v
  }
  return true
}

const router = useRouter();

const saveReq = useApiRequest(false);
const issueReq = useApiRequest(false);

function normalizeDescription(raw) {
  const val = typeof raw === 'object' && raw !== null ? (raw.value ?? raw.id ?? raw) : raw;
  let descNum;

  if (typeof val === 'string') {
    const v = val.toLowerCase().trim();
    if (v === 'member' || v === 'main member' || v === 'member only') descNum = 1;
    else if (v === 'spouse') descNum = 2;
    else if (v === 'children') descNum = 3;
    else descNum = Number.parseInt(val, 10);
  } else {
    descNum = Number(val);
  }

  return Number.isFinite(descNum) && !Number.isNaN(descNum) ? descNum : 0;
}

function onFormSubmit(e) {
  // Prevent default browser behavior
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (!e) return;

  const action = e.action;
  const data = e.data || {};

  if (action !== 'save' && action !== 'issue') return;

  attemptedSubmit.value = true;

  // Validate stakeholder selection if enabled
  if (isStakeholderEnabled.value && !selectedBrokerUuid.value) {
    toasted(false, `Please select a ${stakeholderType.value === 'BROKER' ? 'Broker' : 'Agent'}`);
    return;
  }

  // Timestamp-based debounce
  const now = Date.now();
  if (now - lastCallTime < DEBOUNCE_TIME) {
    return;
  }

  // Flag-based prevention
  if (isSubmitting.value) {
    return;
  }

  // Validate dates before submission
  if (dateError.value) {
    toasted(false, dateError.value);
    return;
  }

  lastCallTime = now;
  isSubmitting.value = true;
  pendingAction.value = action; // Set pending action for loading state

  // Extract services from the payload structure
  const quotedServices = (data.quoatedServices || []).map((s) => ({
    ...s,
    description: normalizeDescription(s?.description),
  }));

  const payload = {
    policyType: "GENERAL",
    institutionUuid: currentInstitution.value?.institutionUuid || null,
    insuredUuid: null,
    stakeholderUuid: isStakeholderEnabled.value ? selectedBrokerUuid.value : null,
    description: institutionForm.value.description || "",
    quotationType: "QUOTATION",
    quoatedServices: quotedServices,
    // Add dates to the payload with proper ISO format
    beginDate: new Date(beginDate.value).toISOString(),
    endDate: new Date(endDate.value).toISOString(),
  };


  const req = action === 'save' ? saveReq : issueReq;
  const requestFn = () => (action === 'save' ? saveQuotationDraft(payload) : issueQuotation(payload));

  req.send(requestFn, (res) => {
    if (res?.success) {
      toasted(true, action === 'save' ? 'Quotation saved successfully' : 'Quotation issued successfully', res?.error);
      router.back();
    }
    // Reset flags after completion
    setTimeout(() => {
      isSubmitting.value = false;
      pendingAction.value = '';
    }, 500);
  }).catch((err) => {
    const apiErr = err?.response?.data || err;
    toasted(false, 'Failed to process quotation', apiErr);
    // Reset flags on error
    setTimeout(() => {
      isSubmitting.value = false;
      pendingAction.value = '';
    }, 500);
  });
}
</script>

<template>
  <SingleInstitutionDataProvider v-slot="{ instituton, pending }">
    <DefaultPage :first="false">
      <template #header>
        <h1>Generate Quotation</h1>
      </template>
      <template v-if="prefillOnce(instituton)"></template>
     
      <div class="flex flex-col gap-4 mx-auto w-full max-w-7xl">
        <!-- Institution Details Card -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-line">
          <!-- Card Header -->
          <div class="px-6 py-4 bg-gradient-to-r from-primary/5 border-b to-primary/5 border-line">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-primary rounded"></div>
                <h2 class="text-xl font-semibold text-ink">Institution Details</h2>
              </div>
              <button 
                @click.prevent="showInstitution = !showInstitution"
                class="px-3 py-1 text-sm font-medium text-primary rounded-lg transition-colors hover:text-primary-hover hover:bg-primary/5"
              >
                {{ showInstitution ? 'Hide Details' : 'Show Details' }}
              </button>
            </div>
            <div class="flex gap-2 items-center mt-2">
              <span class="text-sm text-ink-muted">Registering quotation for:</span>
              <span class="text-sm font-semibold text-success">{{ instituton?.institutionName }}</span>
            </div>
          </div>
          
          <!-- Institution Form -->
          <div v-show="showInstitution" class="p-6">
            <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">Institution Name</label>
                  <Input 
                    name="institutionName" 
                    v-model="institutionForm.institutionName" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">Email</label>
                  <Input 
                    name="email" 
                    v-model="institutionForm.email" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">TIN Number</label>
                  <Input 
                    name="tinNumber" 
                    v-model="institutionForm.tinNumber" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">Telephone</label>
                  <Input 
                    name="telephone" 
                    v-model="institutionForm.telephone" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">Description</label>
                  <Input 
                    name="description" 
                    v-model="institutionForm.description" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">Category</label>
                  <Input 
                    name="category" 
                    v-model="institutionForm.category" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">Source of Business</label>
                  <Input 
                    name="referralType" 
                    v-model="institutionForm.referralType" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-ink-muted">Address</label>
                  <Input 
                    name="address" 
                    v-model="institutionForm.address" 
                    :attributes="{
                      class: 'w-full',
                      disabled: true
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quotation Section -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-line">
          <div class="px-6 py-5 bg-gradient-to-r from-success-soft border-b to-success-soft/50 border-line">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-success rounded"></div>
                <div>
                  <h2 class="text-xl font-semibold text-ink">Create New Quotation</h2>
                  <p class="mt-1 text-sm text-ink-muted">Add coverage types and configure services for {{ instituton?.institutionName }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Date Range Section -->
          <div class="px-6 py-4 border-b bg-surface-muted border-line">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="block mb-1 text-sm font-medium text-ink-muted">
                  Coverage Begin Date
                  <span class="text-error">*</span>
                </label>
                <input
                  v-model="beginDate"
                  type="date"
                  class="px-3 py-2 w-4/5 text-sm rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-success focus:border-success"
                  :class="{ 'border-error': dateError && !beginDate }"
                />
                <p class="mt-1 text-xs text-ink-subtle">Select the start date of coverage</p>
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-ink-muted">
                  Coverage End Date
                  <span class="text-error">*</span>
                </label>
                <input
                  v-model="endDate"
                  type="date"
                  class="px-3 py-2 w-4/5 text-sm rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-success focus:border-success"
                  :class="{ 'border-error': dateError && !endDate }"
                />
                <p class="mt-1 text-xs text-ink-subtle">Auto-set to 1 year from begin date. Change if needed.</p>
              </div>
            </div>
            <!-- Date error message -->
            <div v-if="dateError" class="mt-2 text-sm text-error">
              {{ dateError }}
            </div>
            <!-- Date summary -->
            <div v-else-if="beginDate && endDate" class="mt-3 p-3 bg-success-soft rounded-lg border border-success/20">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <div>
                  <p class="text-sm text-ink-muted">
                    <span class="font-semibold">Coverage Period:</span> 
                    <span class="text-ink">{{ beginDate }}</span> 
                    <span class="text-ink-subtle">to</span> 
                    <span class="text-ink">{{ endDate }}</span>
                  </p>
                  <p class="text-sm font-semibold text-success-strong">
                    Duration: {{ calculateDuration(beginDate, endDate) }}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Broker / Agent Selection Toggle and Searchable Dropdown -->
            <div class="mt-4 pt-4 border-t border-line/60">
              <!-- Enable Toggle -->
              <div class="flex items-center gap-4 mb-3">
                <label class="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    v-model="isStakeholderEnabled" 
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-line peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-success/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line-strong after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                  <span class="ml-3 text-sm font-semibold text-ink-muted">Broker / Agent</span>
                </label>
              </div>

              <!-- Type Selector + Searchable Dropdown (shown when enabled) -->
              <div v-if="isStakeholderEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <!-- Type Toggle Pill -->
                <div class="flex flex-col gap-2">
                  <label class="block text-sm font-medium text-ink-muted">Stakeholder Type</label>
                  <div class="inline-flex p-1 rounded-lg bg-surface-muted border border-line w-fit">
                    <button
                      type="button"
                      @click="stakeholderType = 'BROKER'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
                      :class="stakeholderType === 'BROKER' 
                        ? 'bg-white text-success-strong shadow-sm border border-success/20' 
                        : 'text-ink-subtle hover:text-ink-muted'"
                    >
                      Broker
                    </button>
                    <button
                      type="button"
                      @click="stakeholderType = 'AGENT'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
                      :class="stakeholderType === 'AGENT' 
                        ? 'bg-white text-success-strong shadow-sm border border-success/20' 
                        : 'text-ink-subtle hover:text-ink-muted'"
                    >
                      Agent
                    </button>
                  </div>
                </div>

                <!-- Searchable Select -->
                <div class="flex flex-col gap-1">
                  <label class="block text-sm font-medium text-ink-muted">
                    Select {{ stakeholderType === 'BROKER' ? 'Broker' : 'Agent' }}
                    <span class="text-error">*</span>
                  </label>

                  <!-- Selected stakeholder display -->
                  <div v-if="selectedStakeholder" class="flex items-center gap-2 px-3 py-2 w-4/5 text-sm rounded-lg border border-success/40 bg-success-soft">
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-ink truncate">
                        {{ selectedStakeholder.firstName }} {{ selectedStakeholder.lastName }}
                      </p>
                      <p class="text-xs text-ink-subtle truncate">
                        {{ selectedStakeholder.email }} · {{ selectedStakeholder.phoneNumber }}
                      </p>
                    </div>
                    <button
                      type="button"
                      @click="clearStakeholder"
                      class="flex-shrink-0 p-1 rounded-md text-ink-subtle hover:text-error hover:bg-error-soft transition-colors"
                      title="Clear selection"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Search input + dropdown -->
                  <div v-else class="relative w-4/5">
                    <div class="relative">
                      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      <input
                        v-model="stakeholderSearch"
                        type="text"
                        class="pl-9 pr-3 py-2 w-full text-sm rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-success focus:border-success bg-white"
                        :class="{ 'border-error': attemptedSubmit && !selectedBrokerUuid }"
                        :placeholder="`Search ${stakeholderType === 'BROKER' ? 'brokers' : 'agents'} by name, email...`"
                      />
                    </div>
                    
                    <!-- Dropdown results -->
                    <div
                      v-if="stakeholderSearch || filteredStakeholders.length > 0"
                      class="absolute z-50 mt-1 w-full bg-white rounded-lg border border-line shadow-lg max-h-52 overflow-y-auto"
                    >
                      <!-- Loading -->
                      <div v-if="brokerStore.loading" class="flex items-center gap-2 px-4 py-3 text-sm text-ink-subtle">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </div>
                      <!-- No results -->
                      <div v-else-if="filteredStakeholders.length === 0" class="px-4 py-3 text-sm text-ink-subtle text-center">
                        No active {{ stakeholderType === 'BROKER' ? 'brokers' : 'agents' }} found
                      </div>
                      <!-- Results -->
                      <div
                        v-else
                        v-for="sh in filteredStakeholders"
                        :key="sh.stakeholderUuid"
                        @click="selectStakeholder(sh)"
                        class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-success-soft transition-colors border-b border-line last:border-b-0"
                      >
                        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-success-soft text-success-strong text-xs font-bold flex-shrink-0">
                          {{ (sh.firstName?.[0] || '').toUpperCase() }}{{ (sh.lastName?.[0] || '').toUpperCase() }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-ink truncate">
                            {{ sh.firstName }} {{ sh.lastName }}
                          </p>
                          <p class="text-xs text-ink-subtle truncate">
                            {{ sh.email || sh.phoneNumber }} · {{ sh.licenseNumber || 'No License' }}
                          </p>
                        </div>
                        <span class="px-2 py-0.5 text-xs font-medium rounded-full"
                          :class="sh.type === 'BROKER' ? 'bg-primary/10 text-primary-hover' : 'bg-violet-100 text-violet-700'"
                        >
                          {{ sh.type }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p v-if="attemptedSubmit && !selectedBrokerUuid" class="text-xs text-error mt-0.5">
                    Please select a {{ stakeholderType === 'BROKER' ? 'broker' : 'agent' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-6">
            <QuotationCreationDataProvider v-slot="{ packages, pending }">
              <div v-if="pending" class="flex justify-center items-center py-12">
                <div class="w-12 h-12 rounded-full border-b-2 border-success animate-spin"></div>
              </div>
              <QuotationForm
                v-else
                :packages="packages"
                :onSubmit="onFormSubmit"
                :pendingAction="pendingAction"
                :showHeaderControls="true"
                :readOnlyRows="false"
                :acceptMode="false"
                :beginDate="beginDate"
                :endDate="endDate"
              />
            </QuotationCreationDataProvider>
          </div>
        </div>
      </div>
    </DefaultPage>
  </SingleInstitutionDataProvider>
</template>