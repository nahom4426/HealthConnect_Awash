<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationForm from "../form/QuotationForm.vue";
import QuotationCreationDataProvider from "../components/QuotationCreationDataProvider.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { ref, computed, watch } from "vue";
import { saveQuotationDraft, issueQuotation } from "@/features/quotation/api/quotationApi";
import { useRouter } from "vue-router";
import { toasted } from "@/utils/utils";
import { useApiRequest } from "@/composables/useApiRequest";

const showInstitution = ref(false)
const showMore = ref(true)
const isSubmitting = ref(false);
const pendingAction = ref(''); // Track pending action for loading state
let lastCallTime = 0;
const DEBOUNCE_TIME = 1000;

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
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  
  // Calculate total days
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  
  if (diffDays === 365) return '1 year';
  if (diffDays === 366) return '1 year (leap year)';
  
  // Calculate years and remaining days
  const years = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  
  if (years === 0) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months === 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (days === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
  }
  
  if (remainingDays === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  
  if (months === 0 && days === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
  if (days === 0) return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
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

  // Timestamp-based debounce
  const now = Date.now();
  if (now - lastCallTime < DEBOUNCE_TIME) {
    console.log(`Debounced: Only ${now - lastCallTime}ms since last call`);
    return;
  }

  // Flag-based prevention
  if (isSubmitting.value) {
    console.log('Submission already in progress, skipping...');
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
    institutionUuid: currentInstitution.value?.institutionUuid || "",
    description: institutionForm.value.description || "",
    quotationType: "QUOTATION",
    quoatedServices: quotedServices,
    // Add dates to the payload with proper ISO format
    beginDate: new Date(beginDate.value).toISOString(),
    endDate: new Date(endDate.value).toISOString(),
  };

  console.log(`Making ${action} API call with ${quotedServices.length} services`);
  console.log('Date range:', beginDate.value, 'to', endDate.value);
  console.log('Duration:', calculateDuration(beginDate.value, endDate.value));

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
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <!-- Card Header -->
          <div class="px-6 py-4 bg-gradient-to-r from-blue-50 border-b to-blue-100/50 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-blue-600 rounded"></div>
                <h2 class="text-xl font-semibold text-slate-800">Institution Details</h2>
              </div>
              <button 
                @click.prevent="showInstitution = !showInstitution"
                class="px-3 py-1 text-sm font-medium text-blue-600 rounded-lg transition-colors hover:text-blue-800 hover:bg-blue-50"
              >
                {{ showInstitution ? 'Hide Details' : 'Show Details' }}
              </button>
            </div>
            <div class="flex gap-2 items-center mt-2">
              <span class="text-sm text-slate-600">Registering quotation for:</span>
              <span class="text-sm font-semibold text-green-600">{{ instituton?.institutionName }}</span>
            </div>
          </div>
          
          <!-- Institution Form -->
          <div v-show="showInstitution" class="p-6">
            <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Institution Name</label>
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
                  <label class="block mb-1 text-sm font-medium text-slate-700">Email</label>
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
                  <label class="block mb-1 text-sm font-medium text-slate-700">TIN Number</label>
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
                  <label class="block mb-1 text-sm font-medium text-slate-700">Telephone</label>
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
                  <label class="block mb-1 text-sm font-medium text-slate-700">Description</label>
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
                  <label class="block mb-1 text-sm font-medium text-slate-700">Category</label>
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
                  <label class="block mb-1 text-sm font-medium text-slate-700">Source of Business</label>
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
                  <label class="block mb-1 text-sm font-medium text-slate-700">Address</label>
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
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <div class="px-6 py-5 bg-gradient-to-r from-emerald-50 border-b to-emerald-100/50 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-emerald-600 rounded"></div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">Create New Quotation</h2>
                  <p class="mt-1 text-sm text-slate-600">Add coverage types and configure services for {{ instituton?.institutionName }}</p>
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