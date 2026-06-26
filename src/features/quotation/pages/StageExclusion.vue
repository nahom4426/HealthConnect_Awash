<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";
import { toasted } from "@/utils/utils";
import { stageExclusion, getActiveInsuredByContract } from "@/features/quotation/api/quotationApi";
import { getIssuedContracts } from "@/features/Nyalaunderwriting/api/underwritingApi";
import IssuedContractsDataProvider from "@/features/underwriting/components/IssuedContractsDataProvider.vue";
import Table from "@/components/Table.vue";
import StageExclusionContractRow from "@/features/quotation/components/StageExclusionContractRow.vue";

const route = useRoute();

const routeContractUuid = computed(() => route.params.payerInstitutionContractUuid);
const localContractUuid = ref("");
const contractUuid = computed(() => routeContractUuid.value || localContractUuid.value);

// Contract selection state (when opened without a route param)
const contractSearch = ref("");
const contractStatus = ref("ACTIVE");
const contractsProvider = ref();

const search = ref("");
const page = ref(1);
const limit = ref(25);
const loading = ref(false);
const submitting = ref(false);

const insuredList = ref([]);
const totalItems = ref(0);

// Exclusions hold full insured objects; we map to UUIDs on submit
const exclusions = ref([]);

// Optional: fallback direct fetch kept for reference (not used with DataProvider)

async function fetchInsured() {
  if (!contractUuid.value) {
    insuredList.value = [];
    totalItems.value = 0;
    return;
  }
  loading.value = true;
  try {
    const params = { page: page.value, limit: limit.value };
    if (search.value.trim()) params.search = search.value.trim();
    const res = await getActiveInsuredByContract(contractUuid.value, params);
    const data = res?.data ?? res;
    insuredList.value = Array.isArray(data?.content) ? data.content
      : Array.isArray(data?.data) ? data.data
      : Array.isArray(data) ? data
      : [];
    totalItems.value = data?.totalElements ?? data?.total ?? insuredList.value.length;
  } catch (e) {
    toasted(false, "Failed to load insured persons", e?.message || "");
  } finally {
    loading.value = false;
  }
}

watch(contractUuid, () => {
  page.value = 1;
  fetchInsured();
});

function addInsuredAsExclusion(insured) {
  const key = insured?.insuredUuid || insured?.id;
  if (!key) return;

  const alreadyExists = exclusions.value.some(
    (ex) => (ex?.insuredUuid || ex?.id || ex) === key
  );

  if (!alreadyExists) {
    exclusions.value.push(insured);
    toasted(true, `Added: ${getFullName(insured) || key}`, "");
  }
}

function removeExclusion(idx) {
  exclusions.value.splice(idx, 1);
}

async function handleSubmit() {
  if (!contractUuid.value) {
    toasted(false, "Contract UUID not found", "");
    return;
  }
  if (exclusions.value.length === 0) {
    toasted(false, "Add at least one exclusion", "");
    return;
  }
  submitting.value = true;
  try {
    const payload = exclusions.value
      .map((ex) => ex?.insuredUuid || ex?.id || ex)
      .filter(Boolean);

    const res = await stageExclusion(contractUuid.value, payload);
    const body = res?.data ?? res;
    // Consider typical API shapes for success/failure
    if (body?.success === false || body?.error || body?.status === 'ERROR' || (typeof body === 'string' && /not found|error/i.test(body))) {
      const message = body?.message || (typeof body === 'string' ? body : 'Failed to stage exclusions');
      throw new Error(message);
    }
    toasted(true, "Exclusions staged successfully", "");
    exclusions.value = [];
  } catch (e) {
    toasted(false, e?.message || "Failed to stage exclusions", "");
  } finally {
    submitting.value = false;
  }
}

function getFullName(insured) {
  return [insured?.firstName, insured?.fatherName, insured?.grandFatherName]
    .filter(Boolean)
    .join(" ");
}

let searchTimeout = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    fetchInsured();
  }, 350);
}

onMounted(() => {
  fetchInsured();
});
</script>

<template>
  <DefaultPage>
    <template #header>
      <div class="flex flex-col gap-2 w-full md:flex-row md:justify-between md:items-center">
        <h1 class="text-lg font-semibold">Stage Exclusion</h1>
      </div>
    </template>

    <!-- Contract selection table when no contract chosen -->
    <div v-if="!contractUuid" class="flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold text-gray-700">Select a Policy/Contract</h2>
          <div class="flex gap-2 items-center">
            <input
              v-model="contractSearch"
              placeholder="Search contracts..."
              class="px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[260px]"
            />
          </div>
        </div>

        <IssuedContractsDataProvider
          ref="contractsProvider"
          :status="contractStatus"
          :search="contractSearch"
          v-slot="{ contracts, pending, currentPage, itemsPerPage, totalPages }"
        >
          <Table
            :pending="pending"
            :hideIndex="true"
            :rowCom="StageExclusionContractRow"
            :rowComProps="{
              onSelect: (row) => { localContractUuid = row?.payerInstitutionContractUuid },
              currentPage,
              perPage: itemsPerPage,
            }"
            :headers="{
              head: ['#', 'Policy', 'Institution', 'Code / Number', 'Status', 'Actions'],
              row: ['index', 'contractName', 'institutionName', 'codeNum', 'status', 'actions']
            }"
            :rows="contracts"
            :pagination="{
              currentPage,
              itemsPerPage,
              totalPages,
              onPageChange: (p) => contractsProvider?.setPage(p),
              onLimitChange: (l) => contractsProvider?.setLimit(l),
            }"
          />
        </IssuedContractsDataProvider>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">

      <!-- LEFT: Active Insured Search -->
      <div class="flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold text-gray-700">Active Insured Persons</h2>
          <span class="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 rounded-full border border-blue-200">
            {{ totalItems }} total
          </span>
        </div>

        <!-- Search -->
        <div class="flex gap-2 items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
          <i v-html="icons.search" class="text-gray-400 shrink-0" />
          <input
            v-model="search"
            @input="onSearchInput"
            placeholder="Search by name or ID..."
            class="flex-1 text-sm bg-transparent outline-none"
          />
        </div>

        <!-- List -->
        <div class="overflow-y-auto max-h-96 divide-y divide-gray-100">
          <div v-if="loading" class="py-8 text-sm text-center text-gray-400">
            Loading...
          </div>
          <div v-else-if="insuredList.length === 0" class="py-8 text-sm text-center text-gray-400">
            No insured persons found
          </div>
          <div
            v-for="insured in insuredList"
            :key="insured?.insuredUuid || insured?.id"
            class="flex justify-between items-center px-2 py-2.5 transition-colors hover:bg-gray-50"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-800">{{ getFullName(insured) || '—' }}</span>
              <span class="text-xs text-gray-400">{{ insured?.idNumber || insured?.insuredUuid }}</span>
            </div>
            <button
              @click="addInsuredAsExclusion(insured)"
              :disabled="exclusions.includes(insured?.insuredUuid || insured?.id)"
              class="flex gap-1 items-center px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
              :class="exclusions.includes(insured?.insuredUuid || insured?.id)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'"
            >
              <span v-if="exclusions.includes(insured?.insuredUuid || insured?.id)">Added</span>
              <span v-else>+ Exclude</span>
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
          <button
            :disabled="page <= 1"
            @click="page--; fetchInsured()"
            class="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span class="text-xs text-gray-500">Page {{ page }}</span>
          <button
            :disabled="insuredList.length < limit"
            @click="page++; fetchInsured()"
            class="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <!-- RIGHT: Exclusion List -->
      <div class="flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold text-gray-700">Exclusion List</h2>
          <span class="px-2 py-0.5 text-xs rounded-full border"
            :class="exclusions.length > 0 ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-500 bg-gray-50 border-gray-200'">
            {{ exclusions.length }} item{{ exclusions.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Exclusion items (only from selected insured persons) -->
        <div class="overflow-y-auto flex-1 space-y-2 max-h-80">
          <div v-if="exclusions.length === 0" class="py-8 text-sm text-center text-gray-400">
            No exclusions added yet.<br />
            <span class="text-xs">Select insured persons from the left to build the exclusion list.</span>
          </div>
          <div
            v-for="(ex, idx) in exclusions"
            :key="idx"
            class="flex justify-between items-center px-3 py-2.5 rounded-xl border border-red-100 bg-red-50/70 shadow-xs"
          >
            <div class="flex flex-col max-w-[80%]">
              <span class="text-sm font-medium text-red-700 truncate">{{ getFullName(ex) || ex?.insuredUuid || ex }}</span>
              <span class="text-[11px] text-red-500/80" v-if="ex?.idNumber || ex?.insuredUuid">
                {{ ex?.idNumber || ex?.insuredUuid }}
              </span>
            </div>
            <button
              @click="removeExclusion(idx)
              "
              class="inline-flex justify-center items-center w-7 h-7 text-red-500 rounded-full transition-colors hover:bg-red-100 hover:text-red-700"
              title="Remove from exclusions"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          @click="handleSubmit"
          :disabled="submitting || exclusions.length === 0"
          class="flex gap-2 justify-center items-center px-4 py-2.5 w-full text-sm font-semibold text-white rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :class="exclusions.length > 0 ? 'bg-primary hover:bg-primary/90' : 'bg-gray-400'"
        >
          <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ submitting ? 'Staging...' : `Stage ${exclusions.length} Exclusion${exclusions.length !== 1 ? 's' : ''}` }}
        </button>
      </div>
    </div>
  </DefaultPage>
</template>
