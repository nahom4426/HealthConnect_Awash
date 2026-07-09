<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DefaultPage from '@/components/DefaultPage.vue';
import QuotationCreationDataProvider from '@/features/quotation/components/QuotationCreationDataProvider.vue';
import SingleInstitutionDataProvider from '@/features/institutions/components/SingleInstitutionDataProvider.vue';
import QuotationForm from '@/features/quotation/form/QuotationForm.vue';
import Input from '@/components/new_form_elements/Input.vue';
import { getRenewalBenefitPackages, saveQuotationDraft, issueQuotation } from '@/features/quotation/api/quotationApi';
import { toasted } from '@/utils/utils';
import { useApiRequest } from '@/composables/useApiRequest';
import { useBrokerStore } from '@/features/broker_management/stores/brokerStore';

const route = useRoute();
const router = useRouter();

const routeContractUuid = computed(() => String(route.params.contractUuid || ''));
const contractUuid = computed(() => String(route.query.contractUuid || routeContractUuid.value || ''));
const institutionName = computed(() => String(route.query.institutionName || ''));
const institutionUuid = computed(() => String(route.query.institutionUuid || ''));
const policyType = computed(() => String(route.query.policyType || 'GENERAL'));
const insuredUuid = computed(() => String(route.query.insuredUuid || ''));
const policyNumber = computed(() => String(route.query.policyNumber || ''));
const renewedFromContractUuid = computed(() => String(route.query.renewedFromContractUuid || ''));

const draft = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const pendingAction = ref('');
const isSubmitting = ref(false);
const showInstitution = ref(false);

const brokerStore = useBrokerStore();
const isBrokerEnabled = ref(false);
const selectedBrokerUuid = ref<string | null>(null);
const attemptedSubmit = ref(false);

watch(isBrokerEnabled, async (newVal) => {
  if (newVal && brokerStore.brokers.length === 0) {
    await brokerStore.fetchAllBrokers({ page: 0, size: 100 });
  }
});

const saveReq = useApiRequest(false);
const issueReq = useApiRequest(false);

let lastCallTime = 0;
const DEBOUNCE_TIME = 1000;

const qBeginDate = String(route.query.beginDate || '');
const qEndDate = String(route.query.endDate || '');

const beginDate = ref(qBeginDate ? qBeginDate.split('T')[0] : '');
const endDate = ref(qEndDate ? qEndDate.split('T')[0] : '');

const institutionForm = ref({
  institutionName: "",
  email: "",
  tinNumber: "",
  telephone: "",
  description: "",
  category: "",
  referralType: "",
  address: "",
});

const prefilled = ref(false);
const currentInstitution = ref<any>(null);

function prefillOnce(v: any) {
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
    };
    prefilled.value = true;
    currentInstitution.value = v;
  }
  return true;
}

// ── Date defaults (today to 1 year minus 1 day) ─────────────────
function getDefaultBeginDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getDefaultEndDate(startDate: string | null = null) {
  const baseDate = startDate ? new Date(startDate) : new Date();
  const nextYear = new Date(baseDate);
  nextYear.setFullYear(baseDate.getFullYear() + 1);
  nextYear.setDate(nextYear.getDate() - 1);
  return nextYear.toISOString().split('T')[0];
}

function calculateDuration(startDate: string, endDate: string) {
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

function mapFamilySizeToDescription(familySize: any) {
  const size = Number(familySize);
  return Number.isNaN(size) || size < 1 ? 1 : size;
}

async function loadRenewalPackages() {
  const renewalUuid = renewedFromContractUuid.value || routeContractUuid.value;
  if (!renewalUuid) return;

  loading.value = true;
  error.value = null;

  try {
    const response: any = await getRenewalBenefitPackages(renewalUuid);
    const packages = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];

    if (!beginDate.value) beginDate.value = getDefaultBeginDate();
    if (!endDate.value) endDate.value = getDefaultEndDate(beginDate.value);

    draft.value = {
      quotationUuid: routeContractUuid.value,
      policyUuid: routeContractUuid.value,
      contractUuid: contractUuid.value || routeContractUuid.value,
      institutionUuid: institutionUuid.value || '',
      policyType: policyType.value || 'GENERAL',
      insuredUuid: insuredUuid.value || undefined,
      description: policyNumber.value || '',
      quoatedServices: packages.map((pkg: any) => ({
        packageUuid: pkg.packageUuid,
        packageName: pkg.packageName,
        benefitGroupCode: pkg.benefitGroupCode,
        planType: pkg.planType,
        individualType: pkg.individualType,
        description: mapFamilySizeToDescription(pkg.familySize),
        numberOfInsured: pkg.maxAllowedSlots || 1,
        numberOfAdultFemale: pkg.numberOfAdultFemale || 0,
        numberOfAdultMale: pkg.numberOfAdultMale || 0,
        sumAssured: pkg.agreedSumAssured || pkg.sumAssured || 0,
        depSumAssured: pkg.depSumAssured || 0,
        spouseSumAssured: pkg.spouseSumAssured || 0,
        premium: pkg.premium || 0,
        rate: pkg.rate || 0,
        discount: 0,
        spouse: Boolean(pkg.spouse),
      })),
    };
  } catch (err: any) {
    error.value = err?.message || 'Failed to load renewal quotation';
  } finally {
    loading.value = false;
  }
}

function buildPrefill(packages: any[]) {
  if (!draft.value) return [];
  const services = (draft.value.quoatedServices || []) as any[];

  const groups: Record<string, any> = {};
  for (const service of services) {
    const pkgName = service.packageName || packages.find((pkg: any) => pkg.packageUuid === service.packageUuid)?.packageName || '';
    const description = service.description ?? service.familySize ?? 1;
    const key = `${pkgName || service.packageUuid}__${service.planType || 'Individual_Plan'}__${description}`;
    if (!groups[key]) {
      groups[key] = { packageName: pkgName, planType: service.planType, description, services: [] };
    }
    groups[key].services.push({ ...service });
  }

  return Object.values(groups);
}

function normalizeDescription(raw: any) {
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

function handleSubmit(e: any) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  if (!e) return;

  const action = e.action;
  const data = e.data || {};
  if (action !== 'save' && action !== 'issue') return;

  attemptedSubmit.value = true;

  // Validate broker selection if enabled
  if (isBrokerEnabled.value && !selectedBrokerUuid.value) {
    toasted(false, 'Please select a Broker (Agent)');
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

  const quotedServices = (data.quoatedServices || []).map((s: any) => ({
    ...s,
    description: normalizeDescription(s?.description),
  }));

  const payload: any = {
    policyType: draft.value?.policyType || 'GENERAL',
    institutionUuid: draft.value?.institutionUuid || institutionUuid.value || currentInstitution.value?.institutionUuid || null,
    insuredUuid: draft.value?.insuredUuid ?? (insuredUuid.value ? insuredUuid.value : null),
    stakeholderUuid: isBrokerEnabled.value ? selectedBrokerUuid.value : null,
    policyUuid: draft.value?.contractUuid || routeContractUuid.value || '',
    description: institutionForm.value.description || draft.value?.description || '',
    quotationType: 'QUOTATION',
    quoatedServices: quotedServices,
    beginDate: new Date(beginDate.value).toISOString(),
    endDate: new Date(endDate.value).toISOString(),
  };

  const req = action === 'save' ? saveReq : issueReq;
  const requestFn = () => (action === 'save' ? saveQuotationDraft(payload) : issueQuotation(payload));

  req.send(requestFn, (res: any) => {
    if (res?.success) {
      toasted(true, action === 'save' ? 'Renewal quotation saved successfully' : 'Renewal quotation issued successfully', res?.error);
      router.back();
    }
    setTimeout(() => {
      isSubmitting.value = false;
      pendingAction.value = '';
    }, 500);
  }).catch((err: any) => {
    const apiErr = err?.response?.data || err;
    toasted(false, 'Failed to process renewal quotation', apiErr);
    setTimeout(() => {
      isSubmitting.value = false;
      pendingAction.value = '';
    }, 500);
  });
}

onMounted(() => {
  loadRenewalPackages();
});
</script>

<template>
  <SingleInstitutionDataProvider :institutionUuid="institutionUuid" v-slot="{ instituton, pending: instPending }">
    <DefaultPage :first="false">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Edit Pending Renewal Quotation</h1>
            <p class="mt-1 text-sm text-slate-600">
              {{ institutionName || policyNumber || 'Renewal quotation' }}
            </p>
          </div>
          <span class="px-3 py-1 text-sm font-medium text-amber-700 bg-amber-100 rounded-full">Pending Renewal</span>
        </div>
      </template>

      <template v-if="prefillOnce(instituton)"></template>

      <div v-if="loading || instPending" class="p-8">
        <div class="flex flex-col items-center justify-center py-12">
          <div class="w-12 h-12 mb-4 border-b-2 border-amber-600 rounded-full animate-spin"></div>
          <p class="text-slate-600">Loading renewal quotation...</p>
        </div>
      </div>

      <div v-else-if="error" class="p-8">
        <div class="p-6 border border-red-200 rounded-xl bg-red-50">
          <h3 class="font-semibold text-red-800">Failed to load renewal quotation</h3>
          <p class="mt-1 text-red-600">{{ error }}</p>
        </div>
      </div>

      <div v-else class="flex flex-col gap-4 mx-auto w-full max-w-7xl">
        
        <!-- Institution Details Card -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
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
          
          <div v-show="showInstitution" class="p-6">
            <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Institution Name</label>
                  <Input name="institutionName" v-model="institutionForm.institutionName" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Email</label>
                  <Input name="email" v-model="institutionForm.email" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">TIN Number</label>
                  <Input name="tinNumber" v-model="institutionForm.tinNumber" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Telephone</label>
                  <Input name="telephone" v-model="institutionForm.telephone" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Description</label>
                  <Input name="description" v-model="institutionForm.description" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Category</label>
                  <Input name="category" v-model="institutionForm.category" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Source of Business</label>
                  <Input name="referralType" v-model="institutionForm.referralType" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Address</label>
                  <Input name="address" v-model="institutionForm.address" :attributes="{ class: 'w-full', disabled: true }" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quotation Details Card -->
        <QuotationCreationDataProvider v-slot="{ packages, pending: pkgPending }">
          <div class="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">Renewal quotation details</h2>
                  <p class="mt-1 text-sm text-slate-600">Edit the package selection and coverage values before issuing.</p>
                </div>
                <div class="text-sm text-slate-600">
                  <span class="font-medium text-emerald-700">{{ draft?.quoatedServices?.length || 0 }} services</span>
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
              <div v-if="dateError" class="mt-2 text-sm text-red-600">{{ dateError }}</div>
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
            
            <!-- Broker (Agent) Selection Toggle and Dropdown -->
            <div class="px-6 py-4">
              <div class="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div class="flex items-center">
                  <label class="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      v-model="isBrokerEnabled" 
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span class="ml-3 text-sm font-semibold text-slate-700">Broker (Agent)</span>
                  </label>
                </div>
                
                <div v-if="isBrokerEnabled" class="flex flex-col gap-1">
                  <label class="block text-sm font-medium text-slate-700">
                    Select Broker (Agent)
                    <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="selectedBrokerUuid"
                    class="px-3 py-2 w-4/5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    :class="{ 'border-red-500': attemptedSubmit && !selectedBrokerUuid }"
                  >
                    <option :value="null" disabled>Select a Broker...</option>
                    <option
                      v-for="broker in brokerStore.activeBrokers"
                      :key="broker.stakeholderUuid"
                      :value="broker.stakeholderUuid"
                    >
                      {{ broker.firstName }} {{ broker.lastName }} ({{ broker.licenseNumber || 'No License' }})
                    </option>
                  </select>
                  <p v-if="brokerStore.loading" class="text-xs text-slate-400 mt-0.5 animate-pulse">Loading brokers...</p>
                  <p v-else-if="brokerStore.activeBrokers.length === 0" class="text-xs text-amber-500 mt-0.5">No active brokers found</p>
                  <p v-if="attemptedSubmit && !selectedBrokerUuid" class="text-xs text-red-500 mt-0.5">Please select a broker</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quotation Form Section -->
          <div v-if="pkgPending" class="p-8 text-center text-slate-500">Loading package catalog...</div>
          <div v-else-if="!draft" class="p-8 text-center text-slate-500">No renewal quotation data available.</div>
          <div v-else class="p-6">
            <QuotationForm
              :packages="packages"
              :prefill="buildPrefill(packages)"
              :pendingAction="pendingAction"
              :showHeaderControls="true"
              :readOnlyRows="false"
              :acceptMode="false"
              :issueMode="false"
              :beginDate="beginDate"
              :endDate="endDate"
              :onSubmit="handleSubmit"
            />
          </div>
        </QuotationCreationDataProvider>
      </div>
    </DefaultPage>
  </SingleInstitutionDataProvider>
</template>