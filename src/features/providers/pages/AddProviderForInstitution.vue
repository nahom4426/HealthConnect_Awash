<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import ActiveProvidersDataProvider from "../components/ActiveProviderDataProvider.vue";
import MappedContractsDataProvider from "../components/MappedContractsDataProvider.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import providerStatusRow from "../components/providerInstutionStatusRow.vue";
import MappedContractRow from "../components/MappedContractRow.vue";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
// Define emits to handle the navigate event
const emit = defineEmits(["navigate"]);

const router = useRouter();
const dataProvider = ref();
const mappedDataProvider = ref();
const statusReq = useApiRequest();
const deleteReq = useApiRequest();
const active = ref(0);

const refetchToBeMappedCounter = ref(0);
const refetchMappedCounter = ref(0);

// --- Selection State ---
const selectedToBeMapped = ref(new Set());
const allToBeMappedSelected = ref(false);
const mappingPending = ref(false);

const selectedMapped = ref(new Set());
const allMappedSelected = ref(false);
const unmappingPending = ref(false);

import { mapContracts, deleteMapContract } from '@/features/providers/api/providerApi';
import { useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';

const route = useRoute();
const { addToast } = useToast();
const payerInstitutionContractUuid = route.params.payerInstitutionContractUuid || route.params.id;

// --- To Be Mapped Methods ---
function toggleSelectAllToBeMapped(providers) {
  if (allToBeMappedSelected.value) {
    selectedToBeMapped.value.clear();
    allToBeMappedSelected.value = false;
  } else {
    providers.forEach(p => selectedToBeMapped.value.add(p.payerProviderContractUuid));
    allToBeMappedSelected.value = true;
  }
}

function handleToggleToBeMapped(uuid) {
  if (selectedToBeMapped.value.has(uuid)) {
    selectedToBeMapped.value.delete(uuid);
    allToBeMappedSelected.value = false;
  } else {
    selectedToBeMapped.value.add(uuid);
  }
}

async function mapSelected() {
  if (selectedToBeMapped.value.size === 0) return;
  mappingPending.value = true;
  try {
    const payload = [...selectedToBeMapped.value].map(payerProviderContractUuid => ({
      payerInstitutionContractUuid,
      payerProviderContractUuid
    }));
    await mapContracts(payload);
    addToast({ type: 'success', title: 'Success', message: `${payload.length} provider(s) mapped successfully` });
    selectedToBeMapped.value.clear();
    allToBeMappedSelected.value = false;
    refetchBothTabs();
  } catch (e) {
    addToast({ type: 'error', title: 'Error', message: 'Failed to map providers' });
  } finally {
    mappingPending.value = false;
  }
}

// --- Mapped Contracts Methods ---
function toggleSelectAllMapped(contracts) {
  if (allMappedSelected.value) {
    selectedMapped.value.clear();
    allMappedSelected.value = false;
  } else {
    contracts.forEach(c => selectedMapped.value.add(c.mapContractUuid));
    allMappedSelected.value = true;
  }
}

function handleToggleMapped(uuid) {
  if (selectedMapped.value.has(uuid)) {
    selectedMapped.value.delete(uuid);
    allMappedSelected.value = false;
  } else {
    selectedMapped.value.add(uuid);
  }
}

async function unmapSelected() {
  if (selectedMapped.value.size === 0) return;
  unmappingPending.value = true;
  try {
    const uuids = [...selectedMapped.value];
    await Promise.all(uuids.map(uuid => deleteMapContract(uuid)));
    addToast({ type: 'success', title: 'Success', message: `${uuids.length} provider(s) unmapped successfully` });
    selectedMapped.value.clear();
    allMappedSelected.value = false;
    refetchBothTabs();
  } catch (e) {
    addToast({ type: 'error', title: 'Error', message: 'Failed to unmap providers' });
  } finally {
    unmappingPending.value = false;
  }
}

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
            <div class="flex flex-wrap gap-4 items-center mb-3">
              <div
                v-if="selectedToBeMapped.size > 0"
                class="flex gap-3 justify-between items-center px-4 py-1 bg-blue-50 rounded-lg border border-blue-200"
              >
                <span class="text-sm font-medium text-blue-700">
                  {{ selectedToBeMapped.size }} provider(s) selected
                </span>
                <div class="flex gap-2">
                  <button
                    @click="selectedToBeMapped.clear(); allToBeMappedSelected = false"
                    class="px-3 py-1 text-sm text-gray-600 bg-white rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    @click="mapSelected"
                    :disabled="mappingPending"
                    class="flex gap-2 items-center px-4 py-1 text-sm font-semibold text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    <i v-html="icons.plus || '+'" class="w-4 h-4"></i>
                    {{ mappingPending ? 'Mapping...' : `Map ${selectedToBeMapped.size} Selected` }}
                  </button>
                </div>
              </div>
            </div>

            <Table
              :firstCol="true"
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
              :rows="providers"
              :rowCom="providerStatusRow"
              :rowComProps="{
                selectedUuids: selectedToBeMapped,
                selectionKey: 'payerProviderContractUuid',
                onToggleSelection: handleToggleToBeMapped
              }"
            >
              <template #headerFirst>
                <input
                  type="checkbox"
                  :checked="allToBeMappedSelected"
                  @change="toggleSelectAllToBeMapped(providers)"
                  class="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer focus:ring-blue-500"
                />
              </template>
            </Table>
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
            <!-- Bulk action bar -->
            <div class="flex flex-wrap gap-4 items-center mb-3">
              <div
                v-if="selectedMapped.size > 0"
                class="flex gap-3 justify-between items-center px-4 py-1 bg-red-50 rounded-lg border border-red-200"
              >
                <span class="text-sm font-medium text-red-700">
                  {{ selectedMapped.size }} provider(s) selected
                </span>
                <div class="flex gap-2">
                  <button
                    @click="selectedMapped.clear(); allMappedSelected = false"
                    class="px-3 py-1 text-sm text-gray-600 bg-white rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    @click="unmapSelected"
                    :disabled="unmappingPending"
                    class="flex gap-2 items-center px-4 py-1 text-sm font-semibold text-white bg-red-600 rounded-lg transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    <i v-html="icons.trash || '✕'" class="w-4 h-4"></i>
                    {{ unmappingPending ? 'Unmapping...' : `Unmap ${selectedMapped.size} Selected` }}
                  </button>
                </div>
              </div>
            </div>

            <Table
              :firstCol="true"
              :pending="pending"
              :headers="{
                head: [
                  'Provider Name',
                  'Contract Name',
                  'Contract Code',
                  'Status',
                ],
                row: [
                  'providerName',
                  'payerProviderContractName',
                  'payerProviderContractCode',
                  'status',
                ],
              }"
              :rows="mappedContracts"
              :rowCom="MappedContractRow"
              :rowComProps="{
                selectedUuids: selectedMapped,
                selectionKey: 'mapContractUuid',
                onToggleSelection: handleToggleMapped,
                onRefetch: refetchBothTabs
              }"
            >
              <template #headerFirst>
                <input
                  type="checkbox"
                  :checked="allMappedSelected"
                  @change="toggleSelectAllMapped(mappedContracts)"
                  class="w-4 h-4 text-red-600 rounded border-gray-300 cursor-pointer focus:ring-red-500"
                />
              </template>
            </Table>
          </MappedContractsDataProvider>
        </template>
      </DefaultPage>
    </div>
  </div>
</template>
