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
              :rows="providers"
              :rowCom="providerStatusRow"
            >
              <template #row>
                <providerStatusRow
                  :rowData="providers"
                  :rowKeys="[
                    'providerName',
                    'email',
                    'telephone',
                    'category',
                    'level',
                    'status',
                  ]"
                  :headKeys="[
                    '',
                    'Provider Name',
                    'Email',
                    'Telephone',
                    'Category',
                    'Level',
                    'Status',
                    'Actions',
                  ]"
                  :onView="viewDetails"
                  :onRowClick="(row) => {}"
                  :onRefetch="refetchBothTabs"
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
