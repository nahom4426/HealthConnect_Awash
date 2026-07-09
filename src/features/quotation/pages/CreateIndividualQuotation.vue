<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import QuotationForm from "../form/QuotationForm.vue";
import QuotationCreationDataProvider from "../components/QuotationCreationDataProvider.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { ref, computed, watch, onMounted } from "vue";
import { saveQuotationDraft, issueQuotation } from "@/features/quotation/api/quotationApi";
import { getInsuredPersonById } from "@/features/insured_persons/api/insuredPersonsApi";
import { useRouter, useRoute } from "vue-router";
import { toasted } from "@/utils/utils";
import { useApiRequest } from "@/composables/useApiRequest";
import { useBrokerStore } from "@/features/broker_management/stores/brokerStore";

const showIndividual = ref(false)
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

const beginDate = ref(getDefaultBeginDate());
const endDate = ref(getDefaultEndDate());

watch(beginDate, (newBeginDate) => {
  if (newBeginDate) {
    endDate.value = getDefaultEndDate(newBeginDate);
  }
});

const dateError = computed(() => {
  if (!beginDate.value || !endDate.value) return 'Both dates are required';
  const begin = new Date(beginDate.value);
  const end = new Date(endDate.value);
  if (isNaN(begin.getTime())) return 'Invalid begin date';
  if (isNaN(end.getTime())) return 'Invalid end date';
  if (end <= begin) return 'End date must be after begin date';
  const maxDuration = 5 * 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - begin.getTime() > maxDuration) return 'Coverage period cannot exceed 5 years';
  return null;
});

const individualForm = ref({
  fullName: "",
  email: "",
  phone: "",
  idNumber: "",
  gender: "",
  status: "",
  address: "",
})

const router = useRouter();
const route = useRoute();
const currentIndividual = ref(null);
const pendingIndividual = ref(true);

const saveReq = useApiRequest(false);
const issueReq = useApiRequest(false);

onMounted(async () => {
  const insuredUuid = route.params.insuredUuid;
  if (insuredUuid) {
    try {
      pendingIndividual.value = true;
      const res = await getInsuredPersonById(insuredUuid);
      if (res?.data || res) {
        const data = res.data || res;
        currentIndividual.value = data;
        individualForm.value = {
          fullName: `${data.firstName || ''} ${data.fatherName || ''} ${data.grandFatherName || ''}`.trim(),
          email: data.email || "",
          idNumber: data.idNumber || data.insuranceId || "",
          phone: data.phone || "",
          gender: data.gender || "",
          status: data.status || "",
          address: `${data.address1 || ''} ${data.address2 || ''} ${data.address3 || ''}, ${data.state || ''}`,
        };
      }
    } catch (e) {
      toasted(false, 'Failed to load individual details');
    } finally {
      pendingIndividual.value = false;
    }
  }
});

function normalizeDescription(raw) {
  const val = typeof raw === 'object' && raw !== null ? (raw.value ?? raw.id ?? raw) : raw;
  let descNum;
  if (typeof val === 'string') {
    const v = val.toLowerCase().trim();
    if (v === 'member' || v === 'main member' || v === 'member only') descNum = 1;
    else if (v === 'spouse') descNum = 2;
    else if (v === 'children' || v === 'child') descNum = 3;
    else descNum = Number.parseInt(val, 10);
  } else {
    descNum = Number(val);
  }
  return Number.isFinite(descNum) && !Number.isNaN(descNum) ? descNum : 0;
}

function onFormSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
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

  const now = Date.now();
  if (now - lastCallTime < DEBOUNCE_TIME) return;
  if (isSubmitting.value) return;

  if (dateError.value) {
    toasted(false, dateError.value);
    return;
  }

  lastCallTime = now;
  isSubmitting.value = true;
  pendingAction.value = action;

  const quotedServices = (data.quoatedServices || []).map((s) => ({
    ...s,
    description: normalizeDescription(s?.description),
  }));

  const payload = {
    policyType: "INDIVIDUAL",
    institutionUuid: null,
    insuredUuid: route.params.insuredUuid || null,
    stakeholderUuid: isStakeholderEnabled.value ? selectedBrokerUuid.value : null,
    description: "", // Individuals don't have descriptions, left empty or we could use ID
    quotationType: "QUOTATION",
    quoatedServices: quotedServices,
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
    setTimeout(() => { isSubmitting.value = false; pendingAction.value = ''; }, 500);
  }).catch((err) => {
    const apiErr = err?.response?.data || err;
    toasted(false, 'Failed to process quotation', apiErr);
    setTimeout(() => { isSubmitting.value = false; pendingAction.value = ''; }, 500);
  });
}
</script>

<template>
  <DefaultPage :first="false">
    <template #header>
      <h1>Generate Quotation for Individual</h1>
    </template>
    
    <div class="flex flex-col gap-4 mx-auto w-full max-w-7xl">
      <!-- Individual Details Card -->
      <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
        <!-- Card Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-blue-50 border-b to-blue-100/50 border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 bg-blue-600 rounded"></div>
              <h2 class="text-xl font-semibold text-slate-800">Individual Details</h2>
            </div>
            <button 
              @click.prevent="showIndividual = !showIndividual"
              class="px-3 py-1 text-sm font-medium text-blue-600 rounded-lg transition-colors hover:text-blue-800 hover:bg-blue-50"
            >
              {{ showIndividual ? 'Hide Details' : 'Show Details' }}
            </button>
          </div>
          <div class="flex gap-2 items-center mt-2">
            <span class="text-sm text-slate-600">Registering quotation for:</span>
            <span v-if="!pendingIndividual" class="text-sm font-semibold text-green-600">{{ individualForm.fullName }}</span>
            <span v-else class="text-sm text-gray-400">Loading...</span>
          </div>
        </div>
        
        <!-- Individual Form -->
        <div v-show="showIndividual" class="p-6">
          <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Full Name</label>
                <Input name="fullName" v-model="individualForm.fullName" :attributes="{ class: 'w-full', disabled: true }" />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Email</label>
                <Input name="email" v-model="individualForm.email" :attributes="{ class: 'w-full', disabled: true }" />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">ID Number</label>
                <Input name="idNumber" v-model="individualForm.idNumber" :attributes="{ class: 'w-full', disabled: true }" />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Phone</label>
                <Input name="phone" v-model="individualForm.phone" :attributes="{ class: 'w-full', disabled: true }" />
              </div>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Gender</label>
                <Input name="gender" v-model="individualForm.gender" :attributes="{ class: 'w-full', disabled: true }" />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Status</label>
                <Input name="status" v-model="individualForm.status" :attributes="{ class: 'w-full', disabled: true }" />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Address</label>
                <Input name="address" v-model="individualForm.address" :attributes="{ class: 'w-full', disabled: true }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quotation Section -->
      <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
        <div class="px-6 py-5 bg-gradient-to-r from-emerald-50 border-b to-emerald-100/50 border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 bg-emerald-600 rounded"></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-800">Create New Quotation</h2>
                <p class="mt-1 text-sm text-slate-600">Add coverage types and configure services for {{ individualForm.fullName }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Date Range Section -->
        <div class="px-6 py-4 border-b bg-slate-50 border-slate-200">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="block mb-1 text-sm font-medium text-slate-700">
                Coverage Begin Date
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model="beginDate"
                type="date"
                class="px-3 py-2 w-4/5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                :class="{ 'border-red-500': dateError && !beginDate }"
              />
              <p class="mt-1 text-xs text-slate-500">Select the start date of coverage</p>
            </div>
            <div>
              <label class="block mb-1 text-sm font-medium text-slate-700">
                Coverage End Date
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model="endDate"
                type="date"
                class="px-3 py-2 w-4/5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                :class="{ 'border-red-500': dateError && !endDate }"
              />
              <p class="mt-1 text-xs text-slate-500">Auto-set to 1 year from begin date. Change if needed.</p>
            </div>
          </div>
          <!-- Date error message -->
          <div v-if="dateError" class="mt-2 text-sm text-red-600">
            {{ dateError }}
          </div>
          <!-- Date summary -->
          <div v-else-if="beginDate && endDate" class="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <div>
                <p class="text-sm text-slate-700">
                  <span class="font-semibold">Coverage Period:</span> 
                  <span class="text-slate-800">{{ beginDate }}</span> 
                  <span class="text-slate-500">to</span> 
                  <span class="text-slate-800">{{ endDate }}</span>
                </p>
                <p class="text-sm font-semibold text-emerald-700">
                  Duration: {{ calculateDuration(beginDate, endDate) }}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Broker / Agent Selection Toggle and Searchable Dropdown -->
            <div class="mt-4 pt-4 border-t border-slate-200/60">
              <!-- Enable Toggle -->
              <div class="flex items-center gap-4 mb-3">
                <label class="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    v-model="isStakeholderEnabled" 
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span class="ml-3 text-sm font-semibold text-slate-700">Broker / Agent</span>
                </label>
              </div>

              <!-- Type Selector + Searchable Dropdown (shown when enabled) -->
              <div v-if="isStakeholderEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <!-- Type Toggle Pill -->
                <div class="flex flex-col gap-2">
                  <label class="block text-sm font-medium text-slate-700">Stakeholder Type</label>
                  <div class="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
                    <button
                      type="button"
                      @click="stakeholderType = 'BROKER'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
                      :class="stakeholderType === 'BROKER' 
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200' 
                        : 'text-slate-500 hover:text-slate-700'"
                    >
                      Broker
                    </button>
                    <button
                      type="button"
                      @click="stakeholderType = 'AGENT'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
                      :class="stakeholderType === 'AGENT' 
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200' 
                        : 'text-slate-500 hover:text-slate-700'"
                    >
                      Agent
                    </button>
                  </div>
                </div>

                <!-- Searchable Select -->
                <div class="flex flex-col gap-1">
                  <label class="block text-sm font-medium text-slate-700">
                    Select {{ stakeholderType === 'BROKER' ? 'Broker' : 'Agent' }}
                    <span class="text-red-500">*</span>
                  </label>

                  <!-- Selected stakeholder display -->
                  <div v-if="selectedStakeholder" class="flex items-center gap-2 px-3 py-2 w-4/5 text-sm rounded-lg border border-emerald-300 bg-emerald-50">
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-800 truncate">
                        {{ selectedStakeholder.firstName }} {{ selectedStakeholder.lastName }}
                      </p>
                      <p class="text-xs text-slate-500 truncate">
                        {{ selectedStakeholder.email }} · {{ selectedStakeholder.phoneNumber }}
                      </p>
                    </div>
                    <button
                      type="button"
                      @click="clearStakeholder"
                      class="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
                      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      <input
                        v-model="stakeholderSearch"
                        type="text"
                        class="pl-9 pr-3 py-2 w-full text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        :class="{ 'border-red-500': attemptedSubmit && !selectedBrokerUuid }"
                        :placeholder="`Search ${stakeholderType === 'BROKER' ? 'brokers' : 'agents'} by name, email...`"
                      />
                    </div>
                    
                    <!-- Dropdown results -->
                    <div
                      v-if="stakeholderSearch || filteredStakeholders.length > 0"
                      class="absolute z-50 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-52 overflow-y-auto"
                    >
                      <!-- Loading -->
                      <div v-if="brokerStore.loading" class="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </div>
                      <!-- No results -->
                      <div v-else-if="filteredStakeholders.length === 0" class="px-4 py-3 text-sm text-slate-500 text-center">
                        No active {{ stakeholderType === 'BROKER' ? 'brokers' : 'agents' }} found
                      </div>
                      <!-- Results -->
                      <div
                        v-else
                        v-for="sh in filteredStakeholders"
                        :key="sh.stakeholderUuid"
                        @click="selectStakeholder(sh)"
                        class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex-shrink-0">
                          {{ (sh.firstName?.[0] || '').toUpperCase() }}{{ (sh.lastName?.[0] || '').toUpperCase() }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-slate-800 truncate">
                            {{ sh.firstName }} {{ sh.lastName }}
                          </p>
                          <p class="text-xs text-slate-500 truncate">
                            {{ sh.email || sh.phoneNumber }} · {{ sh.licenseNumber || 'No License' }}
                          </p>
                        </div>
                        <span class="px-2 py-0.5 text-xs font-medium rounded-full"
                          :class="sh.type === 'BROKER' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'"
                        >
                          {{ sh.type }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p v-if="attemptedSubmit && !selectedBrokerUuid" class="text-xs text-red-500 mt-0.5">
                    Please select a {{ stakeholderType === 'BROKER' ? 'broker' : 'agent' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        
        <div class="p-6">
          <QuotationCreationDataProvider v-slot="{ packages, pending }">
            <div v-if="pending" class="flex justify-center items-center py-12">
              <div class="w-12 h-12 rounded-full border-b-2 border-emerald-600 animate-spin"></div>
            </div>
            <QuotationForm
              v-else
              :packages="packages"
              :onSubmit="onFormSubmit"
              :pendingAction="pendingAction"
              :showHeaderControls="true"
              :readOnlyRows="false"
              :acceptMode="false"
              :individualMode="true"
              :beginDate="beginDate"
              :endDate="endDate"
            />
          </QuotationCreationDataProvider>
        </div>
      </div>
    </div>
  </DefaultPage>
</template>
