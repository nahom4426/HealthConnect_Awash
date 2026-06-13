<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import QuotationForm from "../form/QuotationForm.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { onMounted, ref, computed } from "vue";
import { getQuotationById, savedIssueQuotation, saveSavedQuotation, acceptQuotation } from "@/features/quotation/api/quotationApi";
import { useRoute, useRouter } from "vue-router";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationCreationDataProvider from "@/features/quotation/components/QuotationCreationDataProvider.vue";
import { toasted } from "@/utils/utils";

const showInstitution = ref(false) // Hidden by default
const showMore = ref(false) // Hidden by default
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
const currentInstitution = ref<any>(null)
const isSubmitting = ref(false); // Add this flag to prevent double submission

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

const route = useRoute();
const router = useRouter();

// Load quotation to get its institutionUuid and services
const loading = ref(false)
const error = ref<string | null>(null)
const institutionUuidForProvider = ref<string | null>(null)
const draft = ref<any>(null)
const pendingAction = ref<string>('')

const isExclusionOrInclusion = computed(() => {
  const t = draft.value?.type;
  return t === 'EXCLUSION' || t === 'INCLUSION';
})

function buildPrefill(packages: any[]): { packageName: string; planType: string; services: any[] }[] {
  if (!draft.value) return [];
  const services = (draft.value.quoatedServices || []) as any[];
  const groups: Record<string, { packageName: string; planType: string; services: any[] }> = {};
  for (const s of services) {
    const pkgName = packages.find((p: any) => p.packageUuid === s.packageUuid)?.packageName || '';
    const key = `${pkgName}__${s.planType}`;
    if (!groups[key]) {
      groups[key] = { packageName: pkgName, planType: s.planType, services: [] };
    }
    groups[key].services.push({ ...s });
  }
  return Object.values(groups);
}

onMounted(async () => {
  const quotationUuid = route.params.quotationUuid as string
  if (!quotationUuid) return
  loading.value = true
  try {
    const resp: any = await getQuotationById(quotationUuid)
    const q = resp?.data || {}
    draft.value = q
    institutionUuidForProvider.value = q.institutionUuid || q.institution?.institutionUuid || null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load quotation'
  } finally {
    loading.value = false
  }
})

function onSavedFormSubmit(e: any) {
  if (!e) return;
  
  // Prevent double submission
  if (isSubmitting.value) {
    console.log('Submission already in progress, skipping...');
    return;
  }
  
  const action = e.action;
  const data = e.data || {};
  const quotationUuid = (draft.value?.quotationUuid || route.params.quotationUuid) as string;
  const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  const mapQuotedServices = (services: any[], uuid: string) => {
    return services?.map((s: any) => ({
      packageUuid: s.packageUuid,
      benefitGroupCode: s.benefitGroupCode || '',
      serviceQuotedUuid: (action === 'duplicate' || !s.serviceQuotedUuid || s.serviceQuotedUuid.length < 24) 
        ? generateUuid() 
        : s.serviceQuotedUuid,
      numberOfInsured: Number(s.numberOfInsured) || 0,
      description: Number(s.description) || 0,
      sumAssured: Number(s.sumAssured ?? s.sumInsured ?? 0),
      quotationUuid: uuid,
      planType: s.planType || '',
      individualType: s.individualType || 'Member',
      spouseSumAssured: Number(s.spouseSumAssured ?? 0),
      depSumAssured: Number(s.depSumAssured ?? 0),
      spouse: Boolean(s.spouse) || false,
      rate: Number(s.rate) || 0,
      premium: Number(s.premium) || 0,
      coverage: Number(s.coverage) || 0,
      sumInsured: Number(s.sumInsured ?? s.sumAssured ?? 0),
      employeeRate: Number(s.employeeRate) || 0,
      dependentRate: Number(s.dependentRate) || 0,
      spouseRate: Number(s.spouseRate) || 0
    })) || [];
  };

  if (action === 'save') {
    pendingAction.value = 'save'
    isSubmitting.value = true; // Set flag
    
    const uuid = data.quotationUuid || quotationUuid;
    
    // Transform the data to match the expected API payload structure
    const payload = {
      institutionUuid: draft.value?.institutionUuid || data.institutionUuid || '',
      description: draft.value?.description || data.description || '',
      quotedServiceUpdateRequests: mapQuotedServices(data.quoatedServices, uuid)
    };
    
    saveSavedQuotation(uuid, payload)
      .then((res: any) => {
        if (!res || !res.success) {
          return;
        }

        toasted(true, 'Saved quotation updated');
        try { sessionStorage.setItem('reloadSavedQuotations', '1') } catch {}
        router.back();
      })
      .catch((err: any) => {
        toasted(false, 'Failed to save quotation', err?.response?.data || err);
      })
      .finally(() => { 
        pendingAction.value = '';
        isSubmitting.value = false; // Reset flag
      });
  } else if (action === 'accept') {
    pendingAction.value = 'accept'
    isSubmitting.value = true; // Set flag
    
    // Handle accept action
    const payload = {
      institutionUuid: draft.value?.institutionUuid || data.institutionUuid || '',
      description: draft.value?.description || data.description || '',
      quotedServiceUpdateRequests: mapQuotedServices(data.quoatedServices, quotationUuid)
    };
    
    // Use the acceptQuotation API function
    acceptQuotation(quotationUuid, payload)
      .then((res: any) => {
        if (!res || !res.success) {
          return;
        }

        toasted(true, 'Quotation accepted successfully');
        try { sessionStorage.setItem('reloadSavedQuotations', '1'); } catch {}
        router.back();
      })
      .catch((err: any) => {
        console.error('Failed to accept quotation:', err);
        toasted(false, 'Failed to accept quotation', err?.response?.data || err);
      })
      .finally(() => { 
        pendingAction.value = '';
        isSubmitting.value = false; // Reset flag
      });
  } else if (action === 'issue') {
    pendingAction.value = 'issue'
    isSubmitting.value = true; // Set flag
    
    const ds = (data.quoatedServices || draft.value?.quoatedServices || []) as any[];
    const payload = {
      institutionUuid: draft.value?.institutionUuid || '',
      description: draft.value?.description || '',
      quotedServiceUpdateRequests: mapQuotedServices(ds, quotationUuid)
    } as any;
    
    savedIssueQuotation(quotationUuid, payload)
      .then((res: any) => {
        if (!res || !res.success) {
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
        isSubmitting.value = false; // Reset flag
      });
  }
}

function issueMidTerm() {
  if (!draft.value) return;
  // Prevent double submission for mid-term
  if (isSubmitting.value) return;
  onSavedFormSubmit({ action: 'issue', data: {} });
}
</script>

<template>
  <DefaultPage :first="false">
    <template #header>
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-slate-800">Saved Quotation</h1>
        <div class="text-sm text-slate-500">
          <span class="px-3 py-1 font-medium text-amber-800 bg-amber-100 rounded-full">Saved</span>
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
    
    <SingleInstitutionDataProvider
      v-else
      v-if="institutionUuidForProvider"
      :institutionUuid="institutionUuidForProvider"
      v-slot="{ instituton }"
    >
      <template v-if="prefillOnce(instituton)"></template>
      
      <div class="mx-auto space-y-6 w-full max-w-7xl">
        <!-- Institution Details Card - Collapsed by default -->
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
            
            <!-- Quick institution summary when collapsed -->
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

        <!-- Saved Quotation / Mid-term Card -->
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
                    <span class="font-semibold text-green-700">{{ instituton?.institutionName }}</span>
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
                  :acceptMode="true"
                  :quotationUuid="draft.quotationUuid"
                  :onSubmit="onSavedFormSubmit"
                  :showHeaderControls="true"
                />
              </QuotationCreationDataProvider>

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

                <!-- Action Information -->
                <div class="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2">
                  <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="flex gap-3 items-start">
                      <div class="p-2 mt-0.5 bg-blue-100 rounded-full">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                      </div>
                      <div>
                        <h4 class="mb-1 font-medium text-blue-800">Save Changes</h4>
                        <p class="text-sm text-blue-700">
                          Update the quotation with your modifications without issuing it.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div class="flex gap-3 items-start">
                      <div class="p-2 mt-0.5 bg-emerald-100 rounded-full">
                        <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 class="mb-1 font-medium text-emerald-800">Issue Saved</h4>
                        <p class="text-sm text-emerald-700">
                          Finalize and issue this quotation to the client.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Mid-term EXCLUSION / INCLUSION quotation: no editing, just issue -->
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
                    <span v-else>Issue Quotation</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </SingleInstitutionDataProvider>
  </DefaultPage>
</template>