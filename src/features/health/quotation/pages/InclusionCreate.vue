<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import QuotationForm from "../form/QuotationForm.vue";
import SingleInstitutionDataProvider from "@/features/institutions/components/SingleInstitutionDataProvider.vue";
import QuotationCreationDataProvider from "../components/QuotationCreationDataProvider.vue";
import { onMounted, ref, computed } from "vue";
import { getQuotationById, createInclusionExclusionQuotation } from "@/features/quotation/api/quotationApi";
import { useRoute, useRouter } from "vue-router";
import { toasted } from "@/utils/utils";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref<string | null>(null);
const institutionUuidForProvider = ref<string | null>(null);
const quotation = ref<any>(null);
const description = ref("");
const startDate = ref<string>("");
const submitting = ref(false);
const pendingAction = ref("");
const prefillData = ref<any[]>([]);

// Extract route params
const quotationUuid = computed(() => route.params.quotationUuid as string);
// This is the payer institution contract UUID that will be sent as policyUuid
const payerInstitutionContractUuid = computed(() => route.params.payerInstitutionContractUuid as string);

// Set default date to today on mount
onMounted(() => {
  const today = new Date();
  startDate.value = today.toISOString().split('T')[0];
});

/**
 * Normalize description values to numeric IDs
 */
function normalizeDescription(raw: any): number {
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

/**
 * Build prefill data from existing quotation's quoatedServices
 * Groups services by benefitGroupCode for the initializeFromPrefill method
 */
function buildPrefillFromQuotation(quotationData: any): any[] {
  if (!quotationData?.quoatedServices || !Array.isArray(quotationData.quoatedServices)) {
    return [];
  }
  
  // Group services by benefitGroupCode (or create a composite key)
  const groups: Record<string, any> = {};
  
  quotationData.quoatedServices.forEach((service: any) => {
    // Use benefitGroupCode if available, otherwise create a key from planType + description + numberOfInsured
    const key = service.benefitGroupCode || 
                `${service.planType || 'Individual_Plan'}_${service.description || '0'}_${service.numberOfInsured || 0}`;
    
    if (!groups[key]) {
      groups[key] = {
        benefitGroupCode: service.benefitGroupCode || key,
        numberOfInsured: service.numberOfInsured || 0,
        description: service.description || 0,
        services: []
      };
    }
    groups[key].services.push(service);
  });

  return Object.values(groups);
}

/**
 * Handle form submission from QuotationForm
 * Called when user clicks Save Inclusion or Create Inclusion
 */
function handleFormSubmit(e: any) {
  if (!e) return;

  const action = e.action; // 'save' or 'issue'
  const data = e.data || {};
  
  console.log('=== FORM SUBMISSION STARTED ===');
  console.log('Action:', action);
  
  // Validate required fields
  if (!payerInstitutionContractUuid.value) {
    console.error('❌ Missing payerInstitutionContractUuid');
    toasted(false, "Payer Institution Contract UUID is required");
    return;
  }
  
  if (!startDate.value) {
    console.error('❌ Missing startDate');
    toasted(false, "Start date is required");
    return;
  }
  
  submitting.value = true;
  pendingAction.value = action;

  const payload = {
    institutionUuid: quotation.value?.institutionUuid || "",
    policyUuid: payerInstitutionContractUuid.value,
    description: description.value || quotation.value?.description || "",
    startDate: startDate.value,
    quotationType: "INCLUSION",
    quoatedServices: (data.quoatedServices || []).map((service: any) => ({
      packageUuid: service.packageUuid,
      benefitGroupCode: service.benefitGroupCode || "",
      numberOfInsured: Number(service.numberOfInsured) || 0,
      description: normalizeDescription(service.description),
      sumAssured: Number(service.sumAssured) || 0,
      planType: service.planType || "Individual_Plan",
      individualType: service.individualType || "Member",
      spouseSumAssured: Number(service.spouseSumAssured) || 0,
      depSumAssured: Number(service.depSumAssured) || 0,
      spouse: Boolean(service.spouse) || false,
      rate: Number(service.rate) || 0,
      premium: Number(service.premium) || 0,
      employeeRate: Number(service.employeeRate) || 0,
      dependentRate: Number(service.dependentRate) || 0,
      spouseRate: Number(service.spouseRate) || 0,
      coverage: Number(service.coverage) || 0,
      sumInsured: Number(service.sumInsured) || 0,
    })),
  };

  console.log('📤 Full Payload:', JSON.stringify(payload, null, 2));

  createInclusionExclusionQuotation(payload)
    .then((response: any) => {
      console.log('📥 FULL RESPONSE OBJECT:', response);
      console.log('📥 response.data:', response?.data);
      console.log('📥 response.status:', response?.status);
      console.log('📥 response.statusText:', response?.statusText);
      
      // The API might wrap the response differently
      // Check all possible response structures
      const responseData = response?.data || response;
      console.log('📥 Parsed responseData:', responseData);
      
      // Check for success indicators
      const isSuccess = 
        response?.status === 200 || 
        response?.status === 201 || 
        responseData?.success === true ||
        responseData?.statusCode === 200 ||
        responseData?.statusCode === 201;
      
      const isError = 
        response?.status >= 400 || 
        responseData?.statusCode >= 400 ||
        responseData?.success === false ||
        responseData?.error;
      
      console.log('📥 isSuccess:', isSuccess);
      console.log('📥 isError:', isError);
      
      if (isError) {
        // Handle error response
        const errorMessage = 
          responseData?.message || 
          responseData?.error || 
          response?.statusText || 
          'Failed to create inclusion';
        
        console.error('❌ Error detected:', errorMessage);
        toasted(false, errorMessage);
        submitting.value = false;
        pendingAction.value = "";
        return;
      }
      
      if (isSuccess) {
        // Handle success
        console.log('✅ Success!');
        toasted(true, "Inclusion created successfully");
        
        // Reset form state
        submitting.value = false;
        pendingAction.value = "";
        
        // Navigate after short delay
        setTimeout(() => {
          console.log('🚀 Redirecting to /inclusion');
          router.push("/inclusion");
        }, 1500);
      } else {
        // Unknown response structure
        console.warn('⚠️ Unknown response structure:', responseData);
        toasted(false, 'Unexpected response from server');
        submitting.value = false;
        pendingAction.value = "";
      }
    })
    .catch((err: any) => {
      console.error('❌❌❌ CAUGHT IN CATCH BLOCK ❌❌❌');
      console.error('Error object:', err);
      console.error('Error response:', err?.response);
      console.error('Error response data:', err?.response?.data);
      console.error('Error message:', err?.message);
      
      // Extract error message
      let errorMessage = 'Failed to create inclusion';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      console.error('Final error message:', errorMessage);
      toasted(false, errorMessage);
      
      // Reset state
      submitting.value = false;
      pendingAction.value = "";
    });
}
/**
 * Load quotation data on mount
 */
onMounted(async () => {
  // Validate route params
  if (!quotationUuid.value) {
    error.value = "No quotation UUID provided";
    return;
  }
  
  if (!payerInstitutionContractUuid.value) {
    error.value = "No payer institution contract UUID provided";
    return;
  }

  loading.value = true;
  
  try {
    const resp: any = await getQuotationById(quotationUuid.value);
    const quotationData = resp?.data || resp || {};
    
    if (!quotationData || Object.keys(quotationData).length === 0) {
      error.value = "Quotation not found";
      return;
    }
    
    quotation.value = quotationData;
    
    // Set institution UUID for the provider
    institutionUuidForProvider.value =
      quotationData.institutionUuid ||
      quotationData.institution?.institutionUuid ||
      null;
    
    // Build prefill data from the quotation's existing services
    prefillData.value = buildPrefillFromQuotation(quotationData);
    
    // Pre-fill description if available
    if (quotationData.description) {
      description.value = quotationData.description;
    }
    
    console.log('Quotation loaded successfully:', {
      quotationUuid: quotationUuid.value,
      payerInstitutionContractUuid: payerInstitutionContractUuid.value,
      willBeSentAsPolicyUuid: payerInstitutionContractUuid.value,
      institutionUuid: institutionUuidForProvider.value,
      servicesCount: quotationData.quoatedServices?.length || 0
    });
    
  } catch (e: any) {
    console.error("Failed to load quotation:", e);
    error.value = e?.message || "Failed to load quotation details";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <DefaultPage :first="false">
    <template #header>
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Create Inclusion</h1>
          <p class="mt-1 text-sm text-slate-500">Edit existing benefit groups and create an inclusion quotation</p>
        </div>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="p-8">
      <div class="flex flex-col justify-center items-center py-12">
        <div class="mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        <p class="text-slate-600">Loading quotation details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-8">
      <div class="p-6 bg-red-50 rounded-xl border border-red-200">
        <div class="flex gap-3 items-start">
          <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div>
            <h3 class="font-semibold text-red-900">Error Loading Quotation</h3>
            <p class="mt-1 text-red-700 text-sm">{{ error }}</p>
            <button 
              @click="router.back()" 
              class="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <SingleInstitutionDataProvider
      v-else-if="institutionUuidForProvider"
      :institution-uuid="(institutionUuidForProvider as string)"
      v-slot="{ instituton, pending: institutionPending }"
    >
      <div class="mx-auto space-y-6 w-full max-w-7xl">
        
        <!-- Header Info Card -->
        <div class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
          <div class="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-slate-200">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 bg-blue-600 rounded"></div>
              <div>
                <h2 class="text-lg font-semibold text-slate-800">Quotation Details</h2>
                <p class="text-sm text-slate-600">Original quotation information</p>
              </div>
            </div>
          </div>
          
          <div class="p-6 space-y-4">
            <!-- Info Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Institution</p>
                <p class="mt-1 text-sm font-semibold text-slate-900">
                  {{ institutionPending ? 'Loading...' : (instituton?.institutionName || "—") }}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Policy UUID (from Contract)</p>
                <p class="mt-1 text-sm font-mono text-slate-600">
                  {{ payerInstitutionContractUuid?.slice(0, 12) || "—" }}...
                </p>
                <p class="mt-0.5 text-xs text-slate-400">Payer Institution Contract UUID</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotation Code</p>
                <p class="mt-1 text-sm font-semibold text-slate-900">
                  {{ quotation?.quotationCode || "—" }}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                <p class="mt-1">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': quotation?.status === 'PAID',
                      'bg-yellow-100 text-yellow-800': quotation?.status === 'PENDING',
                      'bg-blue-100 text-blue-800': quotation?.status === 'ISSUED',
                      'bg-gray-100 text-gray-800': !quotation?.status
                    }"
                  >
                    {{ quotation?.status || "UNKNOWN" }}
                  </span>
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Original Policy UUID</p>
                <p class="mt-1 text-sm font-mono text-slate-600">
                  {{ quotation?.policyUuid?.slice(0, 12) || "—" }}...
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotation Type</p>
                <p class="mt-1 text-sm text-slate-900">
                  {{ quotation?.quotationType || "QUOTATION" }}
                </p>
              </div>
            </div>

            <!-- Start Date and Description Fields -->
            <div class="pt-4 border-t border-slate-200">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Start Date <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="startDate"
                    type="date"
                    required
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <p class="mt-1 text-xs text-slate-500">When should the inclusion take effect?</p>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Inclusion Description
                  </label>
                  <input
                    v-model="description"
                    type="text"
                    placeholder="e.g., Adding maternity coverage for new employees"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <p class="mt-1 text-xs text-slate-500">Optional description for this inclusion</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Benefit Groups Section -->
        <div class="bg-white rounded-xl border shadow-sm border-slate-200 overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-slate-200">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-8 bg-emerald-600 rounded"></div>
              <div>
                <h2 class="text-lg font-semibold text-slate-800">Benefit Groups</h2>
                <p class="text-sm text-slate-600">
                  Edit employee counts, descriptions, and coverage amounts for existing packages
                </p>
              </div>
            </div>
          </div>
          
          <div class="p-6">
            <QuotationCreationDataProvider v-slot="{ packages, pending: packagesPending }">
              <!-- Loading packages -->
              <div v-if="packagesPending" class="flex justify-center items-center py-12">
                <div class="w-10 h-10 rounded-full border-b-2 border-emerald-600 animate-spin"></div>
              </div>
              
              <!-- No packages available -->
              <div v-else-if="!packages || packages.length === 0" class="text-center py-8">
                <svg class="mx-auto w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <p class="mt-2 text-sm text-slate-500">No packages available</p>
              </div>
              
              <!-- Quotation Form in Inclusion Mode -->
              <QuotationForm
                v-else
                :packages="packages"
                :prefill="prefillData"
                :on-submit="handleFormSubmit"
                :pending-action="pendingAction"
                :show-header-controls="true"
                :read-only-rows="false"
                :inclusion-mode="true"
                :accept-mode="false"
              />
            </QuotationCreationDataProvider>
          </div>
        </div>

        <!-- Info Banner -->
        <div class="flex gap-3 items-start p-4 bg-blue-50 rounded-xl border border-blue-200">
          <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="text-sm font-medium text-blue-800">About Inclusions</p>
            <p class="mt-1 text-sm text-blue-700">
              In this view, you can edit the number of employees, descriptions, and coverage amounts for existing benefit groups. 
              Plan types and package selections are locked. To add new benefit groups, create a new quotation instead.
            </p>
          </div>
        </div>
      </div>
    </SingleInstitutionDataProvider>

    <!-- No Institution Found -->
    <div v-else-if="!loading && !error && !institutionUuidForProvider" class="p-8">
      <div class="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
        <div class="flex gap-3 items-start">
          <svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div>
            <h3 class="font-semibold text-yellow-900">No Institution Found</h3>
            <p class="mt-1 text-yellow-700 text-sm">
              The quotation does not have an associated institution. This may indicate corrupted data.
            </p>
            <button 
              @click="router.back()" 
              class="mt-3 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  </DefaultPage>
</template>