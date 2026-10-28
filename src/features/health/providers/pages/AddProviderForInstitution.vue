<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Table from "@/components/Table.vue";
import TableWithCheckBox from "@/components/TableWithCheckBox.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import ActiveProvidersDataProvider from "../components/ActiveProviderDataProvider.vue";
import MappedContractsDataProvider from "../components/MappedContractsDataProvider.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import providerStatusRow from "../components/providerInstutionStatusRow.vue";
import MappedContractRow from "../components/MappedContractRow.vue";
import { mapContracts } from "../api/providerApi";
import { openModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import icons from "@/utils/icons";
// Define emits to handle the navigate event
const emit = defineEmits(["navigate"]);

const router = useRouter();
const route = useRoute();
const dataProvider = ref();
const mappedDataProvider = ref();
const statusReq = useApiRequest();
const deleteReq = useApiRequest();
const mapReq = useApiRequest();
const active = ref(0);

// Selected provider contract UUIDs for bulk mapping
const selectedProviders = ref([]);

const refetchToBeMappedCounter = ref(0);
const refetchMappedCounter = ref(0);

function refetchToBeMapped() {
  console.log('[AddProviderForInstitution] refetchToBeMapped before=', refetchToBeMappedCounter.value);
  refetchToBeMappedCounter.value += 1;
  console.log('[AddProviderForInstitution] refetchToBeMapped after=', refetchToBeMappedCounter.value);
}

function refetchMappedContracts() {
  console.log('[AddProviderForInstitution] refetchMappedContracts before=', refetchMappedCounter.value);
  refetchMappedCounter.value += 1;
  console.log('[AddProviderForInstitution] refetchMappedContracts after=', refetchMappedCounter.value);
}

function refetchBothTabs() {
  console.log('[AddProviderForInstitution] refetchBothTabs');
  refetchToBeMapped();
  refetchMappedContracts();
}

function handleMappingChanged(e) {
  console.log('[AddProviderForInstitution] provider-mapping-changed', e?.detail);
  refetchBothTabs();
}

onMounted(() => {
  window.addEventListener('provider-mapping-changed', handleMappingChanged);
});

onUnmounted(() => {
  window.removeEventListener('provider-mapping-changed', handleMappingChanged);
});

const components = [
  {
    name: "To Be Mapped",
    component: "active-providers",
  },
  {
    name: "Mapped Contracts",
    component: "mapped-contracts",
  },
];

const setActive = (item) => {
  active.value = item;
};

function refreshData() {
  console.log("Refreshing provider data");
  if (dataProvider.value) {
    dataProvider.value.refresh();
  }
}

function handlePageChange(page) {
  if (dataProvider.value) {
    dataProvider.value.setPage(page);
  }
}

function handleLimitChange(limit) {
  if (dataProvider.value) {
    dataProvider.value.setLimit(limit);
  }
}

function viewDetails(id) {
  router.push(`/providers/${id}`);
}

// Bulk mapping function
function mapSelectedContracts() {
  if (selectedProviders.value.length === 0) return;

  const payerInstitutionContractUuid = route.params.payerProviderContractUuid || route.params.id;
  
  const payload = selectedProviders.value.map((payerProviderContractUuid) => ({
    payerProviderContractUuid,
    payerInstitutionContractUuid,
  }));

  mapReq.send(
    () => mapContracts(payload),
    (res) => {
      if (res.success) {
        toasted(res.success, `${selectedProviders.value.length} contract(s) mapped successfully`, res.error);
        selectedProviders.value = [];
        window.dispatchEvent(new CustomEvent('provider-mapping-changed', { detail: { action: 'bulk-add' } }));
        refetchBothTabs();
      } else {
        toasted(false, "Failed to map contracts", res.error || res.message);
      }
    }
  );
}

</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
    <!-- Tabs -->
    <div class="flex rounded border border-base-clr w-fit">
      <div
        v-for="(item, index) in components"
        :key="index"
        @click="setActive(index)"
        :class="[
          'px-4 py-3 transition-colors cursor-pointer duration-300',
          active === index
            ? index === 0
              ? 'bg-base-clr w-fit text-white rounded-l font-medium'
              : 'bg-base-clr text-white rounded-r font-medium'
            : '',
        ]"
      >
        {{ item.name }}
      </div>
    </div>

    <!-- To Be Mapped Tab -->
    <div v-if="active === 0">
      <DefaultPage placeholder="Search Providers to Map">
        <template #default="{ search }">
          <ActiveProvidersDataProvider
            ref="dataProvider"
            :search="search"
            :refetch="refetchToBeMappedCounter"
            v-slot="{ providers, pending }"
          >
            <!-- Bulk action bar -->
            <div
              v-if="selectedProviders.length > 0"
              class="flex items-center justify-between px-4 py-3 mb-3 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300"
            >
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {{ selectedProviders.length }}
                </span>
                <span class="text-sm font-medium text-blue-800">
                  provider{{ selectedProviders.length > 1 ? 's' : '' }} selected
                </span>
              </div>
              <div class="flex items-center gap-3">
                <button
                  @click="selectedProviders = []"
                  class="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  @click="mapSelectedContracts"
                  :disabled="mapReq.pending.value"
                  class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg v-if="mapReq.pending.value" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ mapReq.pending.value ? 'Mapping...' : `Map Selected (${selectedProviders.length})` }}</span>
                </button>
              </div>
            </div>

            <TableWithCheckBox
              v-model="selectedProviders"
              :pending="pending"
              :headers="{
                head: [
                  'Provider Name',
                  'Contract Name',
                  'Contract Code',
                ],
                row: [
                  'providerName',
                  'payerProviderContractName',
                  'payerProviderContractCode',
                ],
              }"
              :rows="providers"
              :rowCom="providerStatusRow"
              toBeSelected="payerProviderContractUuid"
              :rowComProps="{
                onView: viewDetails,
                onRowClick: (row) => {},
                onRefetch: refetchBothTabs,
                showActions: false,
              }"
            />
          </ActiveProvidersDataProvider>
        </template>
      </DefaultPage>
    </div>

    <!-- Mapped Contracts Tab -->
    <div v-if="active === 1">
      <DefaultPage placeholder="Search Mapped Contracts">
        <template #default="{ search }">
          <MappedContractsDataProvider
            ref="mappedDataProvider"
            :search="search"
            :refetch="refetchMappedCounter"
            v-slot="{ mappedContracts, pending }"
          >
            <Table
              :pending="pending"
              :headers="{
                head: [
                  'Provider Name',
                  'Contract Name',
                  'Contract Code',
            
                  'Actions',
                ],
                row: [
                  'providerName',
                  'payerProviderContractName',
                  'payerProviderContractCode',
                 
                ],
              }"
              :rows="mappedContracts"
              :rowCom="MappedContractRow"
            >
              <template #row>
                <MappedContractRow
                  :rowData="mappedContracts"
                  :rowKeys="[
                    'providerName',
                    'payerProviderContractName',
                    'payerProviderContractCode',
                    'status',
                  ]"
                  :headKeys="[
                    '',
                    'Provider Name',
                    'Contract Name',
                    'Contract Code',
                    'Status',
                  ]"
                  :onRefetch="refetchBothTabs"
                />
              </template>
            </Table>
          </MappedContractsDataProvider>
        </template>
      </DefaultPage>
    </div>
  </div>
</template>
