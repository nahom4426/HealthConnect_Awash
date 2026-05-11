<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { Status } from "@/types/interface";
import Button from "@/components/Button.vue";
import Input from "@/components/new_form_elements/Input.vue";
import ModalFormSubmitButton from "@/components/new_form_builder/ModalFormSubmitButton.vue";
import { toasted } from "@/utils/utils";
import { useApiRequest } from "@/composables/useApiRequest";
import { requestCashClaim } from "@/features/claim/api/cashCreditApi";
import SearchSelect from "@/components/SearchSelect.vue";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionApi";
import GenerateCashCreditClaimDataProvider from "@/features/claim/components/GenerateCashCreditClaimDataProvider.vue";
import { useRequestdClaims } from "@/features/claim/store/requestedCreditClaimStore";
import CreateCashClaimTableRow from "../component/CreateCashClaimTableRow.vue";

const router = useRouter();
const route = useRoute();

const dataProvider = ref(null);

/* ----- reactive state (kept logic) ----- */
const contractUuid = ref(null);
const providerUuid = ref(null);
const providerName = ref("");
const institutionUuid = ref("");
const institutionName = ref("");
const itemType = ref("SERVICE");
const serviceType = ref("CASH");
const isGenerating = ref(false);
const isSubmitting = ref(false);
const hasGenerated = ref(false);
const searchTerm = ref("");
const selectedClaims = ref([]);
const allClaims = ref([]);
const comment = ref("");
const selectedContract = ref(null);
const sortBy = ref('insuredName');
const sortDirection = ref('asc');
const currentDate = new Date();
const previousMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
const fromDate = ref(previousMonthDate.toISOString().split("T")[0]);
const toDate = ref(new Date().toISOString().split("T")[0]);

/* request helper */
const requestClaimReq = useApiRequest();

/* computed guards */
const isReadyToGenerate = computed(() => !!institutionUuid.value);
const isReadyToSubmit = computed(() => selectedClaims.value.length > 0);

/* ----- selection handlers ----- */
function handleInstitutionSelect(inst) {
  institutionUuid.value = inst?.institutionUuid || "";
  institutionName.value = inst?.institutionName || "";

  if (!inst) {
    institutionUuid.value = "";
    institutionName.value = "";
  }
}

/* ----- generate & submit ----- */
const claimStore = useRequestdClaims();

const generateClaimsFromProvider = async () => {
  if (!isReadyToGenerate.value) return;
  if (!dataProvider.value?.send) return;

  isGenerating.value = true;
  try {
    await dataProvider.value.send();
    // wait for data provider watcher to map pagination.data -> store
    await nextTick();
    const claimsData = claimStore.requestedClaims || [];
    if (claimsData.length > 0) {
      selectedClaims.value = [...claimsData];
    }
    hasGenerated.value = true;
  } catch (err) {
    console.error("Generate failed:", err);
    toasted(false, "Failed to generate claims");
  } finally {
    isGenerating.value = false;
  }
};

const generateClaims = async (send) => {
  console.log('🚀 generateClaims called');
  if (!isReadyToGenerate.value) return;
  isGenerating.value = true;
  try {
    // Call send to fetch data from API (it updates the store)
    await send();
    console.log('✅ API call completed');
    // wait for data provider watcher to map pagination.data -> store
    await nextTick();
    
    // Get claims from the store (where send() puts them)
    const claimsData = claimStore.requestedClaims || [];
    console.log('📋 Extracted claims from store:', claimsData.length);
    console.log('📋 claimStore.requestedClaims:', claimStore.requestedClaims);
    
    if (claimsData.length > 0) {
      selectedClaims.value = [...claimsData];
      console.log('✅ Loaded', selectedClaims.value.length, 'claims into selectedClaims');
      console.log('✅ selectedClaims.value:', selectedClaims.value);
    } else {
      console.warn('⚠️ No claims found in store');
    }
    hasGenerated.value = true;
  } catch (err) {
    console.error("Generate failed:", err);
    toasted(false, "Failed to generate claims");
  } finally {
    isGenerating.value = false;
  }
};

const submitClaims = async () => {
  console.log('🔥 SUBMIT BUTTON CLICKED');
  console.log('📊 selectedClaims.value at submit START:', selectedClaims.value);
  console.log('📊 selectedClaims.value.length:', selectedClaims.value.length);
  console.log('📊 claimStore.requestedClaims:', claimStore.requestedClaims);
  
  if (!isReadyToSubmit.value || isSubmitting.value) {
    console.log('❌ Not ready to submit. isReadyToSubmit:', isReadyToSubmit.value, 'isSubmitting:', isSubmitting.value);
    return;
  }
  isSubmitting.value = true;
  try {
    console.log('📊 selectedClaims.value at submit (after guard):', selectedClaims.value);
    console.log('📊 selectedClaims.value.length:', selectedClaims.value.length);
    
    // Calculate total amount
    const totalExtraAmount = selectedClaims.value.reduce((sum, claim) => {
      const items = Array.isArray(claim?.providedItemResponses) ? claim.providedItemResponses : [];
      const extra = items.reduce((s, it) => s + (parseFloat(it?.extraAmount) || 0), 0);
      return sum + extra;
    }, 0);

    const totalAmount = selectedClaims.value.reduce((sum, claim) => {
      return sum + (parseFloat(claim.amount) || 0);
    }, 0) - totalExtraAmount;

    const first = selectedClaims.value?.[0] || {};
    const derivedContractUuid =
      contractUuid.value ||
      first?.contractUuid ||
      first?.payerProviderContractUuid ||
      first?.payerProviderContractUuidRequest;

    const derivedProviderUuid =
      providerUuid.value ||
      first?.providerUuid ||
      first?.providerUUID ||
      first?.providerId;

    const derivedInstitutionUuid =
      institutionUuid.value ||
      first?.institutionUuid ||
      first?.institutionUUID ||
      first?.institutionId;

    // Build the payload with correct structure
    const payload = {
      institutionUuid: derivedInstitutionUuid,
      contractUuid: derivedContractUuid,
      providerUuid: derivedProviderUuid,
      claimFromDate: fromDate.value || undefined,
      claimToDate: toDate.value || undefined,
      totalAmount: totalAmount,
      serviceProvidedUuid: selectedClaims.value.map(claim => claim.serviceProvidedUuid)
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    console.log('📤 Submitting payload:', payload);
    console.log('🔍 serviceProvidedUuid array:', payload.serviceProvidedUuid);

    await requestClaimReq.send(
      () => requestCashClaim(payload),
      res => {
        if (res.success) {
          toasted(true, 'Request Created Successfully');
          selectedClaims.value = [];
          comment.value = "";
          hasGenerated.value = false;
          providerUuid.value = null;
          providerName.value = "";
          contractUuid.value = null;
          selectedContract.value = null;
          institutionUuid.value = "";
          institutionName.value = "";
          router.push('/process_claims');
        }
      }
    );
  } catch (error) {
    console.error("Submit failed:", error);
    toasted(false, error?.message || "Failed to submit claims");
  } finally {
    isSubmitting.value = false;
  }
};

/* remove claim */
const removeClaim = (claimUuid) => {
  console.log('🗑️ removeClaim called with UUID:', claimUuid);
  console.log('📋 Current selectedClaims before removal:', selectedClaims.value);
  console.log('📊 Total claims before:', selectedClaims.value.length);
  
  const beforeLength = selectedClaims.value.length;
  
  // Log each claim's serviceProvidedUuid to debug
  console.log('🔍 Checking each claim:');
  selectedClaims.value.forEach((c, idx) => {
    console.log(`  [${idx}] serviceProvidedUuid: ${c.serviceProvidedUuid}, matches: ${c.serviceProvidedUuid === claimUuid}`);
  });
  
  // Filter out the claim
  selectedClaims.value = selectedClaims.value.filter(c => {
    const keep = c.serviceProvidedUuid !== claimUuid;
    console.log(`  Keeping ${c.serviceProvidedUuid}? ${keep}`);
    return keep;
  });
  
  const afterLength = selectedClaims.value.length;
  console.log('✂️ After filter - Before:', beforeLength, 'After:', afterLength);
  console.log('📋 selectedClaims after removal:', selectedClaims.value);
  
  // Force Vue to detect the change
  selectedClaims.value = [...selectedClaims.value];
  console.log('✅ Vue reactivity triggered. Final count:', selectedClaims.value.length);
  console.log('🔄 filteredAndSortedClaims will now recompute:', filteredAndSortedClaims.value.length);
};

/* filtered and sorted claims */
const filteredAndSortedClaims = computed(() => {
  console.log('🔄 Computing filteredAndSortedClaims');
  console.log('📊 selectedClaims.value.length:', selectedClaims.value.length);
  console.log('🔍 searchTerm.value:', searchTerm.value);
  
  if (!selectedClaims.value || selectedClaims.value.length === 0) {
    console.log('ℹ️ No claims to filter');
    return [];
  }
  
  let filtered = [...selectedClaims.value];
  
  // Apply search filter
  if (searchTerm.value && searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase().trim();
    console.log('🔎 Searching for:', search);
    
    filtered = filtered.filter(claim => {
      const insuredMatch = claim.insuredName?.toLowerCase().includes(search);
      const dependantMatch = claim.dependantName?.toLowerCase().includes(search);
      const providerMatch = claim.providerName?.toLowerCase().includes(search);
      const institutionMatch = claim.institutionName?.toLowerCase().includes(search);
      
      const matches = insuredMatch || dependantMatch || providerMatch || institutionMatch;
      
      if (matches) {
        console.log('  ✅ Match found:', claim.insuredName || claim.dependantName);
      }
      return matches;
    });
    console.log('📊 After search filter:', filtered.length, 'of', selectedClaims.value.length);
  }
  
  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortBy.value];
    let bVal = b[sortBy.value];
    
    if (aVal === undefined || bVal === undefined) return 0;
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    return sortDirection.value === 'asc' 
      ? aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      : aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
  });
  
  console.log('✅ Final sorted claims:', sorted.length);
  return sorted;
});

/* handle sorting */
function handleSort({ column, direction }) {
  sortBy.value = column;
  sortDirection.value = direction;
}

/* --- lifecycle --- */
onMounted(() => {
  if (typeof route.query?.institutionUuid === 'string' && route.query.institutionUuid) {
    institutionUuid.value = route.query.institutionUuid;
  }
  if (typeof route.query?.institutionName === 'string' && route.query.institutionName) {
    institutionName.value = route.query.institutionName;
  }

  if (route.query?.autoGenerate === '1') {
    nextTick(() => {
      generateClaimsFromProvider();
    });
  }
  // optionally, preload providers
  // loadProviders();
});

/* watch selectedClaims for debugging */
watch(selectedClaims, (newVal) => {
  console.log('🔄 selectedClaims changed to:', newVal.length, 'items');
  console.log('🔄 selectedClaims.value:', newVal);
}, { deep: true });
</script>

<template>
  <GenerateCashCreditClaimDataProvider 
  ref="dataProvider"
    :params="{ institutionUuid, itemType, serviceType, fromDate, toDate }"
    :auto="false"
  >
    <template #default="{ claims, pending, search, send }">
      <DefaultPage :hideSearch="true">
        <!-- FILTER HEADER -->
        <template #header v-if="!hasGenerated">
          <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="flex flex-col gap-4 md:flex-row md:items-end">
              <!-- Institution -->
              <div class="flex-1 min-w-0">
                <label class="block mb-2 text-sm font-medium text-gray-700">Institution</label>
                <SearchSelect
                  v-model="institutionName"
                  placeholder="Search institution..."
                  :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
                  :selectCb="handleInstitutionSelect"
                  :option="{ label: 'institutionName', value: 'institutionUuid' }"
                />
              </div>

              <!-- From date -->
              <div class="w-full md:w-48">
                <Input
                  v-model="fromDate"
                  label="From"
                  name="fromDate"
                  :attributes="{ type: 'date', placeholder: 'Start date' }"
                />
              </div>

              <!-- To date -->
              <div class="w-full md:w-48">
                <Input
                  v-model="toDate"
                  label="To"
                  name="toDate"
                  :attributes="{ type: 'date', placeholder: 'End date', min: fromDate }"
                />
              </div>

              <!-- Generate CTA -->
              <div class="flex items-center w-full md:w-auto">
                <ModalFormSubmitButton
                  :pending="isGenerating"
                  btn-text="Generate Claims"
                  :disabled="!isReadyToGenerate"
                  :title="!isReadyToGenerate ? 'Please select institution' : ''"
                  @click="generateClaims(send)"
                  class="w-full md:w-auto"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- RESULTS -->
        <div v-if="hasGenerated" class="space-y-6">
          <!-- summary -->
          <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="gap-4 md:flex md:items-center md:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Cash Claims</h3>
                <div v-if="institutionName" class="p-2 mt-2 bg-blue-50 rounded border border-blue-200">
                  <p class="text-sm text-blue-900"><strong>Institution:</strong> {{ institutionName }}</p>
                </div>
              </div>
              <div class="p-2 mt-2 rounded border border-blue-200 bg-primary-50">
                <p class="mt-1 text-sm text-gray-600">{{ fromDate }} → {{ toDate }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ selectedClaims.length }} of {{ claims?.length || 0 }} claims selected</p>
              </div>
              <div class="flex gap-3 items-center mt-4 md:mt-0">
                <Button type="secondary" @click="() => { hasGenerated = false; selectedClaims = []; }">Back to Filter</Button>
                <ModalFormSubmitButton
                  :pending="isSubmitting"
                  :btn-text="`Submit ${selectedClaims.length} Claims`"
                  :disabled="!isReadyToSubmit"
                  :title="!isReadyToSubmit ? 'Please select claims and add a comment' : ''"
                  @click="submitClaims"
                />
              </div>
            </div>
          </div>

          <!-- table -->
          <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="mb-4">
              <Input
                v-model="searchTerm"
                label="Search Claims"
                name="searchClaims"
                :attributes="{
                  placeholder: 'Search by insured name, provider, service type...',
                  type: 'text'
                }"
              />
            </div>
            
            <Table
              :pending="pending"
              :rowCom="CreateCashClaimTableRow"
              :headers="{
                head: [
           
                  'Insured Name',
                  'Provider',
                  'Institution',
                  'Item Type',
                  'Items',
                  'Extra Amount',
                  'Amount',
                  'Status',
                  'Provided Date',
                  'Actions'
                ],
                row: [
                  'insuredName',
                  'providerName',
                  'institutionName',
                  'itemType',
                  'providedItems',
                  'extraAmount',
                  'amount',
                  'status',
                  'providedDate',
                ]
              }"
              :sortable="true"
              :sortBy="sortBy"
              :sortDirection="sortDirection"
              :sortableColumns="['insuredName', 'providerName', 'itemType', 'amount', 'status', 'providedDate']"
              @sort="handleSort"
              :cells="{
                onView: (row) => {
                  console.log('👁️ View Details clicked for:', row.insuredName);
                  // Just log for now - all claims are auto-selected
                }
              }"
              :rows="filteredAndSortedClaims"
              @remove="removeClaim"
            />
          </div>
        </div>

        <!-- EMPTY / PROMPT -->
        <div v-else class="flex flex-col gap-4 justify-center items-center p-12 bg-white rounded-lg border border-gray-200 border-dashed">
          <div class="flex justify-center items-center w-16 h-16 bg-gray-50 rounded-full">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m0 0h6"></path>
            </svg>
          </div>
          <div class="text-center">
            <p class="text-lg font-medium text-gray-700">Select Institution</p>
            <p class="mt-1 text-sm text-gray-500">Choose an institution to generate cash claims</p>
          </div>
        </div>
      </DefaultPage>
    </template>
  </GenerateCashCreditClaimDataProvider>
</template>

<style scoped>
/* small helpers */
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ensure dropdown sits above other panels */
.relative .absolute.z-50 {
  z-index: 9999;
}

/* responsive tweaks */
@media (max-width: 768px) {
  /* Make summary actions full width on mobile */
  .md\\:flex .md\\:items-center .md\\:justify-between {
    gap: 1rem;
  }
}
</style>
