<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import QuotationForm from "../form/QuotationForm.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { onMounted, ref, computed } from "vue";
import { getQuotationById, savedIssueQuotation, saveSavedQuotation, acceptQuotation } from "@/features/quotation/api/quotationApi";
import { getInsuredPersonById } from "@/features/insured_persons/api/insuredPersonsApi";
import { useRoute, useRouter } from "vue-router";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationCreationDataProvider from "@/features/quotation/components/QuotationCreationDataProvider.vue";
import { toasted } from "@/utils/utils";

const showInstitution = ref(false)
const showIndividual = ref(false)
const showMore = ref(false)

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

const individualForm = ref({
  fullName: "",
  email: "",
  phone: "",
  idNumber: "",
  gender: "",
  status: "",
  address: "",
})

const prefilled = ref(false)
const currentInstitution = ref<any>(null)
const currentIndividual = ref<any>(null)
const isIndividualQuotation = ref(false)
const isSubmitting = ref(false);

// Discount-related computed properties
const hasDiscounts = computed(() => {
  if (!draft.value?.quoatedServices) return false;
  return draft.value.quoatedServices.some((s: any) => (s.discount || 0) > 0);
});

const discountedServices = computed(() => {
  if (!draft.value?.quoatedServices) return [];
  return draft.value.quoatedServices
    .filter((s: any) => (s.discount || 0) > 0)
    .map((s: any) => ({
      ...s,
      originalPremium: s.discount > 0 ? s.premium / (1 - s.discount / 100) : s.premium,
      packageName: s.packageName || 'Unknown Package'
    }));
});

const discountMapFromServices = computed(() => {
  if (!draft.value?.quoatedServices) return {};
  const map: Record<string, number> = {};
  draft.value.quoatedServices.forEach((s: any) => {
    if (s.discount > 0) {
      map[s.packageUuid] = s.discount;
    }
  });
  return map;
});

const totalOriginalPremium = computed(() => {
  if (!draft.value?.quoatedServices) return 0;
  return draft.value.quoatedServices.reduce((total: number, s: any) => {
    const originalPremium = s.discount > 0 ? s.premium / (1 - s.discount / 100) : s.premium;
    return total + originalPremium;
  }, 0);
});

const totalDiscountedPremium = computed(() => {
  if (!draft.value?.quoatedServices) return 0;
  return draft.value.quoatedServices.reduce((total: number, s: any) => {
    return total + (s.premium || 0);
  }, 0);
});

const totalDiscountAmount = computed(() => {
  return totalOriginalPremium.value - totalDiscountedPremium.value;
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function prefillOnce(v: any) {
  if (!prefilled.value && v) {
    institutionForm.value = {
      institutionName: v.institutionName || "",
      email: v.email || "",
      tinNumber: (v.tinNumber as any) || "",
      telephone: v.telephone || "",
      description: v.description || "",
      category: (v.category as any) || "",
      referralType: v.referralType || "Direct",
      address: `${v.address1 || ''} ${v.address2 || ''} ${v.address3 || ''}, ${v.state || ''}`,
    }
    prefilled.value = true
    currentInstitution.value = v
  }
  return true
}

function prefillIndividual(v: any) {
  if (!prefilled.value && v) {
    individualForm.value = {
      fullName: `${v.firstName || ''} ${v.fatherName || ''} ${v.grandFatherName || ''}`.trim(),
      email: v.email || "",
      idNumber: v.idNumber || v.insuranceId || "",
      phone: v.phone || "",
      gender: v.gender || "",
      status: v.status || "",
      address: `${v.address1 || ''} ${v.address2 || ''} ${v.address3 || ''}, ${v.state || ''}`,
    }
    prefilled.value = true
    currentIndividual.value = v
  }
  return true
}

const route = useRoute();
const router = useRouter();

const loading = ref(false)
const error = ref<string | null>(null)
const institutionUuidForProvider = ref<string | null>(null)
const draft = ref<any>(null)
const pendingAction = ref<string>('')

const isExclusionOrInclusion = computed(() => {
  const t = draft.value?.type;
  return t === 'EXCLUSION' || t === 'INCLUSION';
})

function buildPrefill(packages: any[]): any[] {
  if (!draft.value) return [];
  const services = (draft.value.quoatedServices || []) as any[];
  
  const groups: Record<string, any> = {};
  for (const s of services) {
    const key = s.benefitGroupCode || `${s.planType}_${s.description}_${s.numberOfInsured}`;
    if (!groups[key]) {
      groups[key] = {
        benefitGroupCode: s.benefitGroupCode || key,
        numberOfInsured: s.numberOfInsured,
        description: s.description,
        services: []
      };
    }
    groups[key].services.push({ 
      ...s,
      discount: s.discount || 0,
      originalPremium: s.discount > 0 ? s.premium / (1 - s.discount / 100) : s.premium
    });
  }
  
  return Object.values(groups).map(group => ({
    ...group,
  }));
}

onMounted(async () => {
  const quotationUuid = route.params.quotationUuid as string
  if (!quotationUuid) return
  loading.value = true
  try {
    const resp: any = await getQuotationById(quotationUuid)
    const q = resp?.data || {}
    draft.value = q
    
    if (q.policyType === 'INDIVIDUAL' && q.insuredUuid) {
      isIndividualQuotation.value = true;
      try {
        const indRes = await getInsuredPersonById(q.insuredUuid);
        if (indRes?.data || indRes) {
          prefillIndividual(indRes.data || indRes);
        }
      } catch (e) {
        console.error('Failed to load individual details', e);
      }
    } else {
      isIndividualQuotation.value = false;
      institutionUuidForProvider.value = q.institutionUuid || q.institution?.institutionUuid || null;
    }
  } catch (e: any) {
    error.value = e?.message || 'Failed to load quotation'
  } finally {
    loading.value = false
  }
})

function onSavedFormSubmit(e: any) {
  if (!e) return;
  
  if (isSubmitting.value) {
    return;
  }
  
  const action = e.action;
  const data = e.data || {};
  const quotationUuid = (draft.value?.quotationUuid || route.params.quotationUuid) as string;
  const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  // Single mapping function for all actions - always uses quotedServiceUpdateRequests
  const mapQuotedServiceUpdateRequests = (services: any[], uuid: string) => {
    return services?.map((s: any) => ({
      packageUuid: s.packageUuid,
      benefitGroupCode: s.benefitGroupCode || '',
      serviceQuotedUuid: (action === 'duplicate' || !s.serviceQuotedUuid || s.serviceQuotedUuid.length < 24) 
        ? generateUuid() 
        : s.serviceQuotedUuid,
      numberOfInsured: Number(s.numberOfInsured) || 0,
      numberOfAdultFemale: Number(s.numberOfAdultFemale) || 0,
      numberOfAdultMale: Number(s.numberOfAdultMale) || 0,
      description: Number(s.description) || 0,
      sumAssured: Number(s.sumAssured ?? s.sumInsured ?? 0),
      quotationUuid: uuid,
      planType: s.planType || 'Individual_Plan',
      individualType: s.individualType || 'Member',
      spouseSumAssured: Number(s.spouseSumAssured ?? 0),
      depSumAssured: Number(s.depSumAssured ?? 0),
      discount: Number(s.discount) || 0,
      spouse: Boolean(s.spouse) || false,
    })) || [];
  };

  // Build base payload common to all actions
  const buildBasePayload = (servicesUuid: string) => {
    const payload: any = {
      description: draft.value?.description || data.description || '',
      quotedServiceUpdateRequests: mapQuotedServiceUpdateRequests(
        data.quoatedServices || draft.value?.quoatedServices || [], 
        servicesUuid
      )
    };
    
    if (draft.value?.policyType) {
      payload.policyType = draft.value.policyType;
    }
    
    // Handle institution vs individual
    if (isIndividualQuotation.value) {
      payload.insuredUuid = draft.value?.insuredUuid || null;
      payload.institutionUuid = null;
    } else {
      payload.institutionUuid = draft.value?.institutionUuid || data.institutionUuid || null;
      payload.insuredUuid = null;
    }
    
    // Clean up null values
    Object.keys(payload).forEach(key => {
      if (payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    return payload;
  };

  if (action === 'save') {
    pendingAction.value = 'save'
    isSubmitting.value = true;
    
    const uuid = data.quotationUuid || quotationUuid;
    const payload = buildBasePayload(uuid);
    
    saveSavedQuotation(uuid, payload)
      .then((res: any) => {
        if (!res || !res.success) {
          toasted(false, 'Failed to save quotation', res?.error || 'Unknown error');
          return;
        }

        toasted(true, 'Saved quotation updated successfully');
        router.push('/saved_quotation');
      })
      .catch((err: any) => {
        toasted(false, 'Failed to save quotation', err?.response?.data || err);
      })
      .finally(() => { 
        pendingAction.value = '';
        isSubmitting.value = false;
      });
  } else if (action === 'accept') {
    pendingAction.value = 'accept'
    isSubmitting.value = true;
    
    const payload = buildBasePayload(quotationUuid);
    
    acceptQuotation(quotationUuid, payload)
      .then((res: any) => {
        if (!res || !res.success) {
          toasted(false, 'Failed to accept quotation', res?.error || 'Unknown error');
          return;
        }

        toasted(true, 'Quotation accepted successfully');
        try { sessionStorage.setItem('reloadSavedQuotations', '1'); } catch {}
        router.back();
      })
      .catch((err: any) => {
        toasted(false, 'Failed to accept quotation', err?.response?.data || err);
      })
      .finally(() => { 
        pendingAction.value = '';
        isSubmitting.value = false;
      });
  } else if (action === 'issue') {
    pendingAction.value = 'issue'
    isSubmitting.value = true;
    
    const payload = buildBasePayload(quotationUuid);
    
    savedIssueQuotation(quotationUuid, payload)
      .then((res: any) => {
        if (!res || !res.success) {
          toasted(false, 'Failed to issue quotation', res?.error || 'Unknown error');
          return;
        }

        toasted(true, 'Saved quotation issued successfully');
        try { sessionStorage.setItem('reloadSavedQuotations', '1') } catch {}
        router.back();
      })
      .catch((err: any) => {
        toasted(false, 'Failed to issue saved quotation', err?.response?.data || err);
      })
      .finally(() => { 
        pendingAction.value = '';
        isSubmitting.value = false;
      });
  }
}

function issueMidTerm() {
  if (!draft.value) return;
  if (isSubmitting.value) return;
  onSavedFormSubmit({ action: 'issue', data: {} });
}
</script>

<template>
  <DefaultPage :first="false">
    <template #header>
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-slate-800">Saved Quotation</h1>
        <div class="flex gap-3 items-center">
          <span class="px-3 py-1 font-medium text-amber-800 bg-amber-100 rounded-full">Saved Draft</span>
          <button
            v-if="draft && !isExclusionOrInclusion"
            @click="onSavedFormSubmit({ action: 'save', data: {} })"
            :disabled="pendingAction === 'save' || isSubmitting"
            class="inline-flex gap-2 items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="pendingAction === 'save'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>Save Draft</span>
          </button>
          <button
            v-if="draft && !isExclusionOrInclusion"
            @click="onSavedFormSubmit({ action: 'issue', data: {} })"
            :disabled="pendingAction === 'issue' || isSubmitting"
            class="inline-flex gap-2 items-center px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="pendingAction === 'issue'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Issuing...
            </span>
            <span v-else>Issue Quotation</span>
          </button>
        </div>
      </div>
    </template>
    
    <div v-if="loading" class="p-8">
      <div class="flex flex-col justify-center items-center py-12">
        <div class="mb-4 w-12 h-12 rounded-full border-b-2 border-amber-600 animate-spin"></div>
        <p class="text-slate-600">Loading saved quotation...</p>
      </div>
    </div>
    
    <div v-else-if="error" class="p-8">
      <div class="p-6 bg-red-50 rounded-xl border border-red-200">
        <div class="flex gap-3 items-center">
          <div class="p-2 bg-red-100 rounded-full">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-red-800">Failed to load quotation</h3>
            <p class="mt-1 text-red-600">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Institution Details -->
    <SingleInstitutionDataProvider
      v-if="!isIndividualQuotation && institutionUuidForProvider"
      :institutionUuid="institutionUuidForProvider"
      v-slot="{ instituton }"
    >
      <template v-if="prefillOnce(instituton)"></template>
      
      <div class="mx-auto space-y-6 w-full max-w-7xl">
        <!-- Institution Details Card -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <div class="px-6 py-4 bg-gradient-to-r border-b from-slate-50 to-slate-100 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 rounded bg-slate-600"></div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">Client Information</h2>
                  <p class="mt-1 text-sm text-slate-600">Institution details for this saved quotation</p>
                </div>
              </div>
              <button 
                @click.prevent="showInstitution = !showInstitution"
                class="flex gap-2 items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <svg 
                  class="w-4 h-4 transition-transform duration-200" 
                  :class="{ 'rotate-180': showInstitution }" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
                {{ showInstitution ? 'Hide Details' : 'Show Details' }}
              </button>
            </div>
            
            <div v-if="!showInstitution" class="mt-3">
              <div class="flex gap-4 items-center text-sm text-slate-600">
                <span class="font-medium">{{ instituton?.institutionName }}</span>
                <span class="text-slate-400">•</span>
                <span>{{ institutionForm.telephone }}</span>
                <span class="text-slate-400">•</span>
                <span>{{ institutionForm.email }}</span>
              </div>
            </div>
          </div>
          
          <div v-show="showInstitution" class="p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="space-y-4">
                <div>
                  <label class="block mb-1 text-sm font-medium text-slate-700">Institution Name</label>
                  <Input 
                    name="institutionName" 
                    v-model="institutionForm.institutionName" 
                    :attributes="{
                      class: 'w-full bg-slate-50',
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
                      class: 'w-full bg-slate-50',
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
                      class: 'w-full bg-slate-50',
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
                      class: 'w-full bg-slate-50',
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
                      class: 'w-full bg-slate-50',
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
                      class: 'w-full bg-slate-50',
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
                      class: 'w-full bg-slate-50',
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
                      class: 'w-full bg-slate-50',
                      disabled: true
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quotation Form Card -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <div class="px-6 py-5 bg-gradient-to-r from-amber-50 border-b to-amber-100/50 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-amber-600 rounded"></div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">
                    {{ isExclusionOrInclusion ? 'Mid-term Quotation' : 'Edit Saved Quotation' }}
                  </h2>
                  <div class="flex flex-wrap gap-2 items-center mt-1 text-sm text-slate-600">
                    <span>Saved for:</span>
                    <span class="font-semibold text-green-700">
                      {{ isIndividualQuotation ? individualForm.fullName : instituton?.institutionName }}
                    </span>
                    <span
                      v-if="draft?.type"
                      class="px-2 py-0.5 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full border border-amber-200"
                    >
                      {{ draft.type }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="!isExclusionOrInclusion" class="flex gap-3 items-center">
                <div class="text-sm text-slate-600">
                  <span class="font-medium">{{ draft?.quoatedServices?.length || 0 }}</span> services
                </div>
                <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div class="p-6">
            <!-- Normal saved quotation: full editable form -->
            <template v-if="!isExclusionOrInclusion">
              <QuotationCreationDataProvider v-slot="{ packages, pending: pkgPending }">
                <div v-if="pkgPending" class="flex justify-center items-center py-12">
                  <div class="w-12 h-12 rounded-full border-b-2 border-amber-600 animate-spin"></div>
                </div>

                <div v-else-if="!draft" class="py-12 text-center text-slate-500">
                  <p>No saved quotation data available</p>
                </div>

                <QuotationForm
                  v-else
                  :packages="packages"
                  :prefill="buildPrefill(packages)"
                  :pendingAction="pendingAction"
                  :readOnlyRows="false"
                  :acceptMode="false"
                  :issueMode="false"
                  :quotationUuid="draft.quotationUuid"
                  :onSubmit="onSavedFormSubmit"
                  :showHeaderControls="true"
                  :showIssuePremiumAdvice="false"
                  :showAmendButton="false"
                  :discountMap="discountMapFromServices"
                  :individualMode="isIndividualQuotation"
                />
              </QuotationCreationDataProvider>

              <!-- Discount Summary -->
              <div v-if="draft && hasDiscounts" class="p-4 mt-6 rounded-lg bg-amber-50 border border-amber-200">
                <div class="flex gap-3 items-start">
                  <svg class="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M17 17h.01M6.5 17.5l11-11M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm6 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
                  </svg>
                  <div class="flex-1">
                    <h4 class="font-semibold text-amber-800">Current Discounts</h4>
                    <div class="mt-2 space-y-2">
                      <div v-for="service in discountedServices" :key="service.serviceQuotedUuid" class="flex justify-between items-center p-2 rounded bg-white/60">
                        <div>
                          <span class="font-medium text-slate-700">{{ service.packageName }}</span>
                          <span class="ml-2 text-sm text-slate-500">{{ service.planType?.replace(/_/g, ' ') }}</span>
                        </div>
                        <div class="text-right">
                          <div class="text-sm">
                            <span class="text-slate-500 line-through">{{ formatCurrency(service.originalPremium) }}</span>
                            <span class="ml-2 font-semibold text-green-700">{{ formatCurrency(service.premium) }}</span>
                          </div>
                          <div class="text-xs font-medium text-amber-700">
                            {{ service.discount }}% discount
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="flex justify-between items-center pt-3 mt-3 border-t border-amber-200">
                      <div class="text-sm font-medium text-slate-700">
                        <span>Total Savings</span>
                      </div>
                      <div class="text-right">
                        <div class="text-sm">
                          <span class="font-bold text-green-700">{{ formatCurrency(totalDiscountAmount) }}</span>
                        </div>
                        <div class="text-xs text-slate-500">
                          {{ formatCurrency(totalOriginalPremium) }} → {{ formatCurrency(totalDiscountedPremium) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quotation Status & Actions -->
              <div v-if="draft" class="pt-6 mt-8 border-t border-slate-200">
                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div class="mb-1 text-sm font-medium text-amber-700">Quotation ID</div>
                    <div class="font-mono text-sm text-amber-900 truncate">{{ draft.quotationUuid }}</div>
                  </div>
                  <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div class="mb-1 text-sm font-medium text-amber-700">Status</div>
                    <div class="flex gap-2 items-center">
                      <div class="w-2 h-2 bg-amber-600 rounded-full"></div>
                      <span class="font-medium text-amber-800">Saved Draft</span>
                    </div>
                  </div>
                  <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div class="mb-1 text-sm font-medium text-amber-700">Last Updated</div>
                    <div class="font-medium text-amber-800">
                      {{ new Date(draft.lastModifiedDate || draft.createdDate || Date.now()).toLocaleDateString() }}
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Mid-term EXCLUSION / INCLUSION quotation -->
            <template v-else>
              <div class="space-y-6">
                <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <div class="mb-1 text-sm font-medium text-amber-700">Quotation Code</div>
                      <div class="font-mono text-sm text-amber-900 truncate">{{ draft.quotationCode }}</div>
                    </div>
                    <div>
                      <div class="mb-1 text-sm font-medium text-amber-700">Type</div>
                      <div class="text-sm font-medium text-amber-900">{{ draft.type }}</div>
                    </div>
                    <div>
                      <div class="mb-1 text-sm font-medium text-amber-700">Status</div>
                      <div class="flex gap-2 items-center">
                        <span class="w-2 h-2 bg-amber-600 rounded-full"></span>
                        <span class="text-sm font-medium text-amber-900">Saved Draft</span>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 text-sm text-amber-900">
                    {{ draft.description }}
                  </div>
                </div>

                <div v-if="hasDiscounts" class="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div class="flex gap-3 items-start">
                    <svg class="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M17 17h.01M6.5 17.5l11-11M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm6 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
                    </svg>
                    <div class="flex-1">
                      <h4 class="font-semibold text-amber-800">Discounts Applied</h4>
                      <div class="mt-2 space-y-2">
                        <div v-for="service in discountedServices" :key="service.serviceQuotedUuid" class="flex justify-between items-center p-2 rounded bg-white/60">
                          <div>
                            <span class="font-medium text-slate-700">{{ service.packageName }}</span>
                          </div>
                          <div class="text-right">
                            <div class="text-sm">
                              <span class="font-semibold text-green-700">{{ formatCurrency(service.premium) }}</span>
                            </div>
                            <div class="text-xs font-medium text-amber-700">
                              {{ service.discount }}% off
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="p-4 rounded-lg border bg-slate-50 border-slate-200">
                  <div class="flex gap-3 items-start">
                    <div class="p-2 mt-0.5 rounded-full bg-slate-200">
                      <svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 class="mb-1 text-sm font-medium text-slate-900">Auto-generated mid-term quotation</h4>
                      <p class="text-sm text-slate-600">
                        This quotation was generated from an inclusion / exclusion process. Coverage packages
                        cannot be edited here. Review the details above and issue the quotation when ready.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex gap-3 justify-end">
                  <button
                    type="button"
                    @click="issueMidTerm"
                    :disabled="pendingAction === 'issue' || isSubmitting"
                    class="inline-flex gap-2 items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span v-if="pendingAction === 'issue'">Issuing...</span>
                    <span v-else>Issue Quotations</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </SingleInstitutionDataProvider>

    <!-- Individual Details -->
    <div v-if="isIndividualQuotation" class="mx-auto space-y-6 w-full max-w-7xl">
      <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
        <div class="px-6 py-4 bg-gradient-to-r border-b from-slate-50 to-slate-100 border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 rounded bg-slate-600"></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-800">Client Information</h2>
                <p class="mt-1 text-sm text-slate-600">Individual details for this saved quotation</p>
              </div>
            </div>
            <button 
              @click.prevent="showIndividual = !showIndividual"
              class="flex gap-2 items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            >
              <svg 
                class="w-4 h-4 transition-transform duration-200" 
                :class="{ 'rotate-180': showIndividual }" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
              {{ showIndividual ? 'Hide Details' : 'Show Details' }}
            </button>
          </div>
          
          <div v-if="!showIndividual" class="mt-3">
            <div class="flex gap-4 items-center text-sm text-slate-600">
              <span class="font-medium">{{ individualForm.fullName }}</span>
              <span class="text-slate-400">•</span>
              <span>{{ individualForm.phone }}</span>
              <span class="text-slate-400">•</span>
              <span>{{ individualForm.email }}</span>
            </div>
          </div>
        </div>
        
        <div v-show="showIndividual" class="p-6">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Full Name</label>
                <Input 
                  name="fullName" 
                  v-model="individualForm.fullName" 
                  :attributes="{
                    class: 'w-full bg-slate-50',
                    disabled: true
                  }"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Email</label>
                <Input 
                  name="email" 
                  v-model="individualForm.email" 
                  :attributes="{
                    class: 'w-full bg-slate-50',
                    disabled: true
                  }"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">ID Number</label>
                <Input 
                  name="idNumber" 
                  v-model="individualForm.idNumber" 
                  :attributes="{
                    class: 'w-full bg-slate-50',
                    disabled: true
                  }"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Phone</label>
                <Input 
                  name="phone" 
                  v-model="individualForm.phone" 
                  :attributes="{
                    class: 'w-full bg-slate-50',
                    disabled: true
                  }"
                />
              </div>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Gender</label>
                <Input 
                  name="gender" 
                  v-model="individualForm.gender" 
                  :attributes="{
                    class: 'w-full bg-slate-50',
                    disabled: true
                  }"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Status</label>
                <Input 
                  name="status" 
                  v-model="individualForm.status" 
                  :attributes="{
                    class: 'w-full bg-slate-50',
                    disabled: true
                  }"
                />
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-slate-700">Address</label>
                <Input 
                  name="address" 
                  v-model="individualForm.address" 
                  :attributes="{
                    class: 'w-full bg-slate-50',
                    disabled: true
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quotation Form Card -->
      <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
        <div class="px-6 py-5 bg-gradient-to-r from-amber-50 border-b to-amber-100/50 border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 bg-amber-600 rounded"></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-800">
                  {{ isExclusionOrInclusion ? 'Mid-term Quotation' : 'Edit Saved Quotation' }}
                </h2>
                <div class="flex flex-wrap gap-2 items-center mt-1 text-sm text-slate-600">
                  <span>Saved for:</span>
                  <span class="font-semibold text-green-700">{{ individualForm.fullName }}</span>
                  <span
                    v-if="draft?.type"
                    class="px-2 py-0.5 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full border border-amber-200"
                  >
                    {{ draft.type }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="!isExclusionOrInclusion" class="flex gap-3 items-center">
              <div class="text-sm text-slate-600">
                <span class="font-medium">{{ draft?.quoatedServices?.length || 0 }}</span> services
              </div>
              <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div class="p-6">
          <template v-if="!isExclusionOrInclusion">
            <QuotationCreationDataProvider v-slot="{ packages, pending: pkgPending }">
              <div v-if="pkgPending" class="flex justify-center items-center py-12">
                <div class="w-12 h-12 rounded-full border-b-2 border-amber-600 animate-spin"></div>
              </div>

              <div v-else-if="!draft" class="py-12 text-center text-slate-500">
                <p>No saved quotation data available</p>
              </div>

              <QuotationForm
                v-else
                :packages="packages"
                :prefill="buildPrefill(packages)"
                :pendingAction="pendingAction"
                :readOnlyRows="false"
                :acceptMode="false"
                :issueMode="false"
                :quotationUuid="draft.quotationUuid"
                :onSubmit="onSavedFormSubmit"
                :showHeaderControls="true"
                :showIssuePremiumAdvice="false"
                :showAmendButton="false"
                :discountMap="discountMapFromServices"
                :individualMode="true"
              />
            </QuotationCreationDataProvider>

            <div v-if="draft && hasDiscounts" class="p-4 mt-6 rounded-lg bg-amber-50 border border-amber-200">
              <div class="flex gap-3 items-start">
                <svg class="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M17 17h.01M6.5 17.5l11-11M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm6 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
                </svg>
                <div class="flex-1">
                  <h4 class="font-semibold text-amber-800">Current Discounts</h4>
                  <div class="mt-2 space-y-2">
                    <div v-for="service in discountedServices" :key="service.serviceQuotedUuid" class="flex justify-between items-center p-2 rounded bg-white/60">
                      <div>
                        <span class="font-medium text-slate-700">{{ service.packageName }}</span>
                        <span class="ml-2 text-sm text-slate-500">{{ service.planType?.replace(/_/g, ' ') }}</span>
                      </div>
                      <div class="text-right">
                        <div class="text-sm">
                          <span class="text-slate-500 line-through">{{ formatCurrency(service.originalPremium) }}</span>
                          <span class="ml-2 font-semibold text-green-700">{{ formatCurrency(service.premium) }}</span>
                        </div>
                        <div class="text-xs font-medium text-amber-700">
                          {{ service.discount }}% discount
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center pt-3 mt-3 border-t border-amber-200">
                    <div class="text-sm font-medium text-slate-700">
                      <span>Total Savings</span>
                    </div>
                    <div class="text-right">
                      <div class="text-sm">
                        <span class="font-bold text-green-700">{{ formatCurrency(totalDiscountAmount) }}</span>
                      </div>
                      <div class="text-xs text-slate-500">
                        {{ formatCurrency(totalOriginalPremium) }} → {{ formatCurrency(totalDiscountedPremium) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="draft" class="pt-6 mt-8 border-t border-slate-200">
              <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div class="mb-1 text-sm font-medium text-amber-700">Quotation ID</div>
                  <div class="font-mono text-sm text-amber-900 truncate">{{ draft.quotationUuid }}</div>
                </div>
                <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div class="mb-1 text-sm font-medium text-amber-700">Status</div>
                  <div class="flex gap-2 items-center">
                    <div class="w-2 h-2 bg-amber-600 rounded-full"></div>
                    <span class="font-medium text-amber-800">Saved Draft</span>
                  </div>
                </div>
                <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div class="mb-1 text-sm font-medium text-amber-700">Last Updated</div>
                  <div class="font-medium text-amber-800">
                    {{ new Date(draft.lastModifiedDate || draft.createdDate || Date.now()).toLocaleDateString() }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="space-y-6">
              <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <div class="mb-1 text-sm font-medium text-amber-700">Quotation Code</div>
                    <div class="font-mono text-sm text-amber-900 truncate">{{ draft.quotationCode }}</div>
                  </div>
                  <div>
                    <div class="mb-1 text-sm font-medium text-amber-700">Type</div>
                    <div class="text-sm font-medium text-amber-900">{{ draft.type }}</div>
                  </div>
                  <div>
                    <div class="mb-1 text-sm font-medium text-amber-700">Status</div>
                    <div class="flex gap-2 items-center">
                      <span class="w-2 h-2 bg-amber-600 rounded-full"></span>
                      <span class="text-sm font-medium text-amber-900">Saved Draft</span>
                    </div>
                  </div>
                </div>
                <div class="mt-4 text-sm text-amber-900">
                  {{ draft.description }}
                </div>
              </div>

              <div v-if="hasDiscounts" class="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div class="flex gap-3 items-start">
                  <svg class="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M17 17h.01M6.5 17.5l11-11M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm6 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
                  </svg>
                  <div class="flex-1">
                    <h4 class="font-semibold text-amber-800">Discounts Applied</h4>
                    <div class="mt-2 space-y-2">
                      <div v-for="service in discountedServices" :key="service.serviceQuotedUuid" class="flex justify-between items-center p-2 rounded bg-white/60">
                        <div>
                          <span class="font-medium text-slate-700">{{ service.packageName }}</span>
                        </div>
                        <div class="text-right">
                          <div class="text-sm">
                            <span class="font-semibold text-green-700">{{ formatCurrency(service.premium) }}</span>
                          </div>
                          <div class="text-xs font-medium text-amber-700">
                            {{ service.discount }}% off
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="p-4 rounded-lg border bg-slate-50 border-slate-200">
                <div class="flex gap-3 items-start">
                  <div class="p-2 mt-0.5 rounded-full bg-slate-200">
                    <svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="mb-1 text-sm font-medium text-slate-900">Auto-generated mid-term quotation</h4>
                    <p class="text-sm text-slate-600">
                      This quotation was generated from an inclusion / exclusion process. Coverage packages
                      cannot be edited here. Review the details above and issue the quotation when ready.
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 justify-end">
                <button
                  type="button"
                  @click="issueMidTerm"
                  :disabled="pendingAction === 'issue' || isSubmitting"
                  class="inline-flex gap-2 items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span v-if="pendingAction === 'issue'">Issuing...</span>
                  <span v-else>Issue Quotations</span>
                </button>
              </div>
            </div>
          </template>
          
        </div>
      </div>
    </div>
  </DefaultPage>
</template>