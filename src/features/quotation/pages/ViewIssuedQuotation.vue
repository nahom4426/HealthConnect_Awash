<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import { Status } from "@/types/interface";
import QuotationForm from "../form/QuotationForm.vue";
import quotationDataProviderByStatus from "../components/quotationDataProviderByStatus.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { computed, onMounted, ref } from "vue";
import { getQuotationById, saveQuotationDraft, issueQuotation, saveSavedQuotation, acceptQuotation, savedIssueQuotation, downloadQuotationAttachment, viewQuotationAttachment } from "@/features/quotation/api/quotationApi";
import { useRoute, useRouter } from "vue-router";
import { toasted } from "@/utils/utils";
import Button from "@/components/Button.vue";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationCreationDataProvider from "@/features/quotation/components/QuotationCreationDataProvider.vue";
import { getInsuredPersonById } from "@/features/insured_persons/api/insuredPersonsApi";

const showInstitution = ref(false)
const showIndividual = ref(false)
const showMore = ref(true)
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

const pendingAction = ref<string>('')
const isEditing = ref(false) // Track edit mode
const quotationFormRef = ref<any>(null) // Ref to QuotationForm to trigger submitAction

function onIssuedFormSubmit(e: any) {
  if (!e) return;
  const action = e.action;
  const data = e.data || {};
  if (action === 'accept') {
    const qid = (draft.value?.quotationUuid || route.params.quotationUuid) as string;
    pendingAction.value = 'accept'
    acceptQuotation(qid, { quotationUuid: qid })
      .then((res: any) => {
        const body = res?.data ?? res;
        if (body?.statusCode && body?.statusCode >= 400) {
          const msg = body?.message || 'Failed to accept quotation';
          toasted(false, msg, body);
          return;
        }
        
        if (!res?.success && res?.error) {
          toasted(false, res.error || 'Failed to accept quotation');
          return;
        }

        toasted(true, 'Quotation accepted');
        router.back();
      })
      .catch((err: any) => {
        const apiErr = err?.response?.data || err;
        const errorMsg = apiErr?.detail || apiErr?.message || 'Failed to accept quotation';
        toasted(false, errorMsg, apiErr);
      })
      .finally(() => {
        pendingAction.value = ''
      });
  }
}

const prefilled = ref(false)
const currentInstitution = ref<any>(null)
const currentIndividual = ref<any>(null)
const isIndividualQuotation = ref(false)

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

const isViewOnly = computed(() => String(route.query?.viewOnly || '') === '1')

const hasAttachment = computed(() => {
  return draft.value?.status === 'PAID' && draft.value?.file;
})

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
}

const loading = ref(false)
const isAmending = ref(false)
const error = ref<string | null>(null)
const institutionUuidForProvider = ref<string | null>(null)
const draft = ref<any>(null)
const attachmentLoading = ref(false)
const showImageModal = ref(false)
const imageModalSrc = ref<string | null>(null)
const imageFileName = ref<string | null>(null)

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

// Enter edit mode - make form editable
function enterEditMode() {
  isEditing.value = true;
}

// Cancel edit mode - revert to read-only
function cancelEditMode() {
  isEditing.value = false;
}


// Save changes and stay on the page so user can accept or amend again
async function handleSaveChanges(e: any) {
  if (!e) return;
  if (isAmending.value) return;
  
  const data = e.data || {};
  const quotationUuid = draft.value?.quotationUuid as string;
  
  if (!quotationUuid) return;
  
  isAmending.value = true;
  pendingAction.value = 'amend'
  
  const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  const ds = (data.quoatedServices || draft.value?.quoatedServices || []) as any[];

  const payload: any = {
    description: draft.value.description || '',
    quotedServiceUpdateRequests: ds.map((s) => ({
      packageUuid: s.packageUuid,
      benefitGroupCode: s.benefitGroupCode || '',
      serviceQuotedUuid: s.serviceQuotedUuid || generateUuid(),
      numberOfInsured: Number(s.numberOfInsured) || 0,
      numberOfAdultFemale: Number(s.numberOfAdultFemale) || 0,
      numberOfAdultMale: Number(s.numberOfAdultMale) || 0,
      description: Number(s.description) || 0,
      sumAssured: Number(s.sumAssured ?? s.sumInsured ?? 0),
      quotationUuid: quotationUuid,
      planType: s.planType || 'Individual_Plan',
      individualType: s.individualType || 'Member',
      spouse: Boolean(s.spouse) || false,
      depSumAssured: Number(s.depSumAssured ?? 0),
      spouseSumAssured: Number(s.spouseSumAssured ?? 0),
      discount: Number(s.discount) || 0,
    })),
  };

  // Handle institution vs individual
  if (isIndividualQuotation.value) {
    payload.insuredUuid = draft.value?.insuredUuid || null;
  } else {
    payload.institutionUuid = draft.value?.institutionUuid || null;
  }

  if (draft.value?.policyType) {
    payload.policyType = draft.value.policyType;
  }

  // Clean up null/empty values
  Object.keys(payload).forEach(key => {
    if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
      delete payload[key];
    }
  });

  try {
    const response: any = await savedIssueQuotation(quotationUuid, payload);
    const body = response?.data ?? response;

    if (body?.statusCode && body.statusCode >= 400) {
      toasted(false, body?.message || body?.detail || 'Failed to save changes');
      return;
    }
    if (body?.type === 'INTERNAL_ERROR') {
      toasted(false, body?.detail || body?.message || 'Internal server error. Please try again.');
      return;
    }
    if (response?.success === false || body?.success === false) {
      toasted(false, body?.error || body?.message || 'Failed to save changes');
      return;
    }

    toasted(true, 'Changes saved successfully');

    try {
      const resp: any = await getQuotationById(quotationUuid);
      const q = resp?.data || {};
      draft.value = q;
      
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
      prefilled.value = false;
    } catch {
      if (body?.quoatedServices) {
        draft.value = { ...draft.value, ...body };
      }
    }

    isEditing.value = false;
  } catch (err: any) {
    const apiError = err?.response?.data || err;
    const errorMessage = apiError?.detail || apiError?.message || err?.message || 'Failed to save changes';
    toasted(false, errorMessage);
  } finally {
    isAmending.value = false;
    pendingAction.value = '';
  }
}

function acceptDirect() {
  onIssuedFormSubmit({ action: 'accept', data: {} });
}

async function viewAttachment() {
  if (!draft.value?.file) return;
  
  attachmentLoading.value = true;
  try {
    const fileName = draft.value.file;
    imageFileName.value = fileName;
    const response = await viewQuotationAttachment(fileName);
    const imageUrl = URL.createObjectURL(response.data);
    imageModalSrc.value = imageUrl;
    showImageModal.value = true;
  } catch (error: any) {
    console.error('Error viewing attachment:', error);
    toasted(false, 'Failed to view attachment');
  } finally {
    attachmentLoading.value = false;
  }
}

async function downloadAttachmentFromModal() {
  if (!imageFileName.value) return;
  
  try {
    const response = await downloadQuotationAttachment(imageFileName.value);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = imageFileName.value.split('/').pop() || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toasted(true, 'File downloaded successfully');
  } catch (error: any) {
    console.error('Error downloading attachment:', error);
    toasted(false, 'Failed to download attachment');
  }
}

function closeImageModal() {
  if (imageModalSrc.value) {
    URL.revokeObjectURL(imageModalSrc.value);
  }
  showImageModal.value = false;
  imageModalSrc.value = null;
  imageFileName.value = null;
}

function buildPrefill(packages: any[]): { packageName: string; planType: string; services: any[] }[] {
  if (!draft.value) return [];
  const services = (draft.value.quoatedServices || []) as any[];
  const groups: Record<string, { packageName: string; planType: string; services: any[] }> = {};
  for (const s of services) {
    const pkgName = packages.find((p: any) => p.packageUuid === s.packageUuid)?.packageName || s.packageName || '';
    const key = `${pkgName}__${s.planType}`;
    if (!groups[key]) {
      groups[key] = { packageName: pkgName, planType: s.planType, services: [] };
    }
    groups[key].services.push({ 
      ...s,
      discount: s.discount || 0,
      originalPremium: s.discount > 0 ? s.premium / (1 - s.discount / 100) : s.premium
    });
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
    
    // Check if it's an individual quotation
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
    error.value = e?.message || 'Failed to load issued quotation'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <DefaultPage :first="false">
    <template #header>
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-slate-800">Issued Quotation</h1>
        <div class="flex gap-3 items-center">
          <span v-if="isEditing" class="px-3 py-1 font-medium text-orange-800 bg-orange-100 rounded-full">Editing</span>
          <span v-else class="px-3 py-1 font-medium text-blue-800 bg-blue-100 rounded-full">Issued</span>
        </div>
      </div>
    </template>
    
    <div v-if="loading" class="p-8">
      <div class="flex flex-col justify-center items-center py-12">
        <div class="mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        <p class="text-slate-600">Loading quotation details...</p>
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
    
    <div v-else class="mx-auto space-y-6 w-full max-w-7xl">
      <!-- Institution Details Card (for institution quotations) -->
      <SingleInstitutionDataProvider
        v-if="!isIndividualQuotation && institutionUuidForProvider"
        :institutionUuid="institutionUuidForProvider as any"
        v-slot="{ instituton, pending }"
      >
        <template v-if="prefillOnce(instituton)"></template>
        
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <div class="px-6 py-4 bg-gradient-to-r from-blue-50 border-b to-blue-100/50 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-blue-600 rounded"></div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">Institution Details</h2>
                  <p class="mt-1 text-sm text-slate-600">Quotation recipient information</p>
                </div>
              </div>
              <button 
                @click.prevent="showInstitution = !showInstitution"
                class="px-3 py-1 text-sm font-medium text-blue-600 rounded-lg transition-colors hover:text-blue-800 hover:bg-blue-50"
              >
                {{ showInstitution ? 'Hide Details' : 'Show Details' }}
              </button>
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
      </SingleInstitutionDataProvider>

      <!-- Individual Details Card (for individual quotations) -->
      <div v-if="isIndividualQuotation" class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
        <div class="px-6 py-4 bg-gradient-to-r from-blue-50 border-b to-blue-100/50 border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 bg-blue-600 rounded"></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-800">Individual Details</h2>
                <p class="mt-1 text-sm text-slate-600">Quotation recipient information</p>
              </div>
            </div>
            <button 
              @click.prevent="showIndividual = !showIndividual"
              class="px-3 py-1 text-sm font-medium text-blue-600 rounded-lg transition-colors hover:text-blue-800 hover:bg-blue-50"
            >
              {{ showIndividual ? 'Hide Details' : 'Show Details' }}
            </button>
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

      <!-- Quotation Details Card -->
      <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
        <div class="px-6 py-5 bg-gradient-to-r from-amber-50 border-b to-amber-100/50 border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 bg-amber-600 rounded"></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-800">
                  {{ isEditing ? 'Edit Quotation Details' : 'Quotation Details' }}
                </h2>
                <div class="flex gap-2 items-center mt-1">
                  <p class="text-sm text-slate-600">Issued for:</p>
                  <span class="text-sm font-semibold text-green-600">
                    {{ isIndividualQuotation ? individualForm.fullName : instituton?.institutionName }}
                  </span>
                  <span class="text-xs text-slate-500">• Quotation ID: {{ draft?.quotationUuid?.slice(-8) }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex gap-3 items-center">
              <div class="text-sm text-slate-600">
                <span class="font-medium">{{ draft?.quoatedServices?.length || 0 }}</span> services
              </div>
              
              <!-- View Attachment Button (PAID status) -->
              <button
                v-if="hasAttachment"
                @click="viewAttachment"
                :disabled="attachmentLoading"
                class="inline-flex gap-2 items-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg transition-colors hover:bg-amber-100 hover:border-amber-300 disabled:opacity-60 disabled:cursor-not-allowed"
                :title="`${draft?.file} (${formatFileSize(draft?.fileSize || 0)})`"
              >
                <svg v-if="!attachmentLoading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>View</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <QuotationCreationDataProvider v-slot="{ packages, pending: pkgPending }">
            <div v-if="pkgPending" class="flex justify-center items-center py-12">
              <div class="w-12 h-12 rounded-full border-b-2 border-amber-600 animate-spin"></div>
            </div>
            
            <div v-else-if="!draft" class="py-12 text-center text-slate-500">
              <p>No quotation data available</p>
            </div>
            <QuotationForm
              v-else
              ref="quotationFormRef"
              :packages="packages"
              :prefill="buildPrefill(packages)"
              :showHeaderControls="false"
              :readOnlyRows="!isEditing"
              :hideFooterActions="true"
              :individualMode="isIndividualQuotation"
              @submit="handleSaveChanges"
              :discountMap="discountMapFromServices"
              :showIssuePremiumAdvice="false"
              :showAmendButton="false"
            />
          </QuotationCreationDataProvider>
          
          <!-- Discount Summary -->
          <div v-if="draft && hasDiscounts" class="p-4 mt-6 rounded-lg bg-amber-50 border border-amber-200">
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
                
                <!-- Total Savings -->
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

          <!-- Additional Quotation Information -->
          <div v-if="draft" class="pt-6 mt-8 border-t border-slate-200">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="p-4 rounded-lg bg-slate-50">
                <div class="mb-1 text-sm text-slate-500">Quotation ID</div>
                <div class="font-mono text-sm font-medium text-slate-800">{{ draft.quotationUuid }}</div>
              </div>
              <div class="p-4 rounded-lg bg-slate-50">
                <div class="mb-1 text-sm text-slate-500">Status</div>
                <div class="flex gap-2 items-center">
                  <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span class="font-medium text-amber-700">Issued</span>
                </div>
              </div>
              <div class="p-4 rounded-lg bg-slate-50">
                <div class="mb-1 text-sm text-slate-500">Created Date</div>
                <div class="font-medium text-slate-800">
                  {{ new Date(draft.createdDate || Date.now()).toLocaleDateString() }}
                </div>
              </div>
            </div>
          </div>

          <!-- Issued quotation actions -->
          <div
            v-if="draft && !isViewOnly"
            class="flex flex-wrap gap-3 justify-end pt-6 mt-8 border-t border-slate-200"
          >
            <!-- Edit Mode: Show Save Changes and Cancel buttons -->
            <template v-if="isEditing">
              <button
                type="button"
                @click="cancelEditMode"
                :disabled="isAmending"
                class="inline-flex gap-2 items-center px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="quotationFormRef?.submitAction('save')"
                :disabled="isAmending"
                class="inline-flex gap-2 items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="isAmending" class="flex gap-2 items-center">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>Save Changes</span>
              </button>
            </template>
            
            <!-- View Mode: Show Amend and Accept buttons -->
            <template v-else>
              <button
                type="button"
                @click="enterEditMode"
                class="inline-flex gap-2 items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Amend Quotation
              </button>
              
              <button
                type="button"
                @click="acceptDirect"
                :disabled="pendingAction === 'accept'"
                class="inline-flex gap-2 items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="pendingAction === 'accept'" class="flex gap-2 items-center">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accepting...
              </span>
              <span v-else>Accept Quotation</span>
            </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">{{ imageFileName?.split('/').pop() }}</h2>
          <button
            @click="closeImageModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Image Container -->
        <div class="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-100">
          <img
            v-if="imageModalSrc"
            :src="imageModalSrc"
            :alt="imageFileName?.split('/').pop()"
            class="max-w-full max-h-full object-contain"
          />
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            @click="closeImageModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            @click="downloadAttachmentFromModal"
            class="inline-flex gap-2 items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  </DefaultPage>
</template>