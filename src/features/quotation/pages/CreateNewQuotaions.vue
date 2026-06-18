<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationForm from "../form/QuotationForm.vue";
import QuotationCreationDataProvider from "../components/QuotationCreationDataProvider.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { ref, computed } from "vue";
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

// ── Date defaults (today to 1 year from now) ─────────────────
function getDefaultBeginDate() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

function getDefaultEndDate() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  return nextYear.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

// Calculate duration between dates
function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate difference in months and days
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;
  
  if (totalMonths === 12) return '1 year';
  if (totalMonths < 12) return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
  
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

// Reactive date fields with defaults
const beginDate = ref(getDefaultBeginDate());
const endDate = ref(getDefaultEndDate());

// Computed property for date validation
const dateError = computed(() => {
  if (!beginDate.value || !endDate.value) {
    return 'Both dates are required';
  }
  if (new Date(endDate.value) <= new Date(beginDate.value)) {
    return 'End date must be after begin date';
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
                </label>
                <input
                  v-model="beginDate"
                  type="date"
                  class="px-3 py-2 w-4/5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  :class="{ 'border-red-500': dateError && !beginDate }"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">
                  Coverage End Date
                </label>
                <input
                  v-model="endDate"
                  type="date"
                  class="px-3 py-2 w-4/5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  :class="{ 'border-red-500': dateError && !endDate }"
                />
              </div>
            </div>
            <!-- Date error message -->
            <div v-if="dateError" class="mt-2 text-sm text-red-600">
              {{ dateError }}
            </div>
            <!-- Date summary -->
            <div v-else class="mt-2 text-sm text-slate-600">
              Coverage period: <span class="font-semibold text-slate-800">{{ beginDate }}</span> to <span class="font-semibold text-slate-800">{{ endDate }}</span>
              <span class="ml-2 text-emerald-600">({{ calculateDuration(beginDate, endDate) }})</span>
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