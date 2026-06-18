<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import { Status } from "@/types/interface";
import QuotationForm from "../form/QuotationForm.vue";
import quotationDataProviderByStatus from "../components/quotationDataProviderByStatus.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { computed, onMounted, ref } from "vue";
import { getQuotationById, saveQuotationDraft, issueQuotation,saveSavedQuotation, acceptQuotation, savedIssueQuotation, downloadQuotationAttachment, viewQuotationAttachment } from "@/features/quotation/api/quotationApi";
import { useRoute, useRouter } from "vue-router";
import { toasted } from "@/utils/utils";
import Button from "@/components/Button.vue";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationCreationDataProvider from "@/features/quotation/components/QuotationCreationDataProvider.vue";

const showInstitution = ref(false)
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

const pendingAction = ref<string>('')

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

        toasted(true, 'Quotation accepted');
        router.back();
      })
      .catch((err: any) => {
        const apiErr = err?.response?.data || err;
        toasted(false, 'Failed to accept quotation', apiErr);
      })
      .finally(() => {
        pendingAction.value = ''
      });
  }
}

const prefilled = ref(false)
const currentInstitution = ref<any>(null)
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


async function handleAmend() {
  if (!draft.value?.quotationUuid) return;
  console.log(draft.value);
  isAmending.value = true;
  pendingAction.value = 'amend'
  try {
    const quotationUuid = draft.value.quotationUuid;
    const ds = (draft.value.quoatedServices || []) as any[];
    
    const payload = {
      institutionUuid: draft.value.institutionUuid || '',
      description: draft.value.description || '',
      quotedServiceUpdateRequests: ds.map((s) => ({
        packageUuid: s.packageUuid,
        serviceQuotedUuid: s.serviceQuotedUuid || '',
        numberOfInsured: Number(s.numberOfInsured) || 0,
        description: s.description || '',
        rate: Number(s.rate) || 0,
        premium: Number(s.premium) || 0,
        sumInsured: Number(s.sumInsured) || 0,
        coverage: Number(s.coverage) || 0,
        quotationUuid: quotationUuid,
        planType: s.planType || 'Individual Plan',
        individualType: s.individualType || 'Member',
        spouse: Boolean(s.spouse) || false,
      })),
    };

    const response = await savedIssueQuotation(quotationUuid, payload);
    const newQuotationUuid = response?.data?.quotationUuid || quotationUuid;
    
    toasted(true, 'Quotation amended successfully');
    
    router.push({ 
      // name: 'EditQuotation', 
      params: { quotationUuid: newQuotationUuid },
      query: { fromIssued: 'true' }
    });
    
  } catch (error: any) {
    console.error('Error amending quotation:', error);
    const errorMessage = error?.response?.data?.message || 'Failed to amend quotation';
    toasted(false, errorMessage);
  } finally {
    isAmending.value = false;
    pendingAction.value = ''
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
    // Create a blob URL from the response
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
    // Create a temporary download link
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
        <div class="text-sm text-slate-500">
          <span class="px-3 py-1 font-medium text-blue-800 bg-blue-100 rounded-full">Issued</span>
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
    
    <SingleInstitutionDataProvider
      v-else
      v-if="institutionUuidForProvider"
      :institutionUuid="institutionUuidForProvider as any"
      v-slot="{ instituton, pending }"
    >
      <template v-if="prefillOnce(instituton)"></template>
      
      <div class="mx-auto space-y-6 w-full max-w-7xl">
        <!-- Institution Details Card -->
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

        <!-- Quotation Details Card -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <div class="px-6 py-5 bg-gradient-to-r from-amber-50 border-b to-amber-100/50 border-slate-200">
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div class="w-2 h-8 bg-amber-600 rounded"></div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-800">Quotation Details</h2>
                  <div class="flex gap-2 items-center mt-1">
                    <p class="text-sm text-slate-600">Issued for:</p>
                    <span class="text-sm font-semibold text-green-600">{{ instituton?.institutionName }}</span>
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
                :packages="packages"
                :prefill="buildPrefill(packages)"
                :showHeaderControls="false"
                :readOnlyRows="true"
                :hideFooterActions="true"
              />
            </QuotationCreationDataProvider>
            
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

            <!-- Issued quotation actions: Amend & Accept -->
            <div
              v-if="draft && !isViewOnly"
              class="flex flex-wrap gap-3 justify-end pt-6 mt-8 border-t border-slate-200"
            >
            <!--  <button
                type="button"
                @click="handleAmend"
                :disabled="pendingAction === 'amend'"
                class="inline-flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="pendingAction === 'amend'">Amending...</span>
                <span v-else>Amend Quotation</span>
              </button>
-->
              <button
                type="button"
                @click="acceptDirect"
                :disabled="pendingAction === 'accept'"
                class="inline-flex gap-2 items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="pendingAction === 'accept'">Accepting...</span>
                <span v-else>Accept Quotation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SingleInstitutionDataProvider>

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