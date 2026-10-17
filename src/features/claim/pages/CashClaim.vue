<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import { computed, ref, watch } from "vue";
import { requestCashClaim } from "../api/cashCreditApi";
import Table from "@/components/Table.vue";
import { formatCurrency, toasted } from "@/utils/utils";
import { searchInsuredByInstitution } from "@/features/insured_persons/api/insuredPersonsApi";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionApi";
import icons from "@/utils/icons";
import Button from "@/components/Button.vue";
import { openModal } from "@customizer/modal-x";
import { useSearchedCashCreditInsuredByInstitutionStore } from "../store/searchCashCreditInsuredInstitutionStore";
import { useApiRequest } from "@/composables/useApiRequest";
import TableWithCheckBox from "@/components/TableWithCheckBox.vue";
import { useRouter } from 'vue-router';
import CreditClaimDataProvider from "../components/CreditClaimDataProvider.vue";
import CreditClaimTableRow from "../components/CreditClaimTableRow.vue";
import CreditClaimDetail from "./credit_claim/CreditClaimDetail.vue";
import SearchSelect from "@/components/SearchSelect.vue";
import FilterOnDetector from "@/components/FilterOnDetector.vue";
import { Status } from "@/types/interface";

const institutionUuid = ref("");
const contractUuid = ref("");
const itemType = ref("SERVICE");
const serviceType = ref("CASH"); // default to CASH
const selectedRow = ref(null);
function viewDetail(row) {
  selectedRow.value = row;
}
const router = useRouter();

function editSubmittedService(row) {
  const id = row?.serviceProvidedUuid;
  if (!id) return;
  router.push({
    path: '/cash_services',
    query: { editServiceProvidedUuid: String(id) },
  });
}

const cashCreditInsuredStore = useSearchedCashCreditInsuredByInstitutionStore();

// Insured search (used to add services manually for a patient)
const insuredQuery = ref("");
const insuredResults = ref([]);
const insuredSearchOpen = ref(false);
const insuredSearchReq = useApiRequest();
let insuredSearchTimer;

function runInsuredSearch() {
  const query = insuredQuery.value.trim();
  if (!institutionUuid.value || !query) {
    insuredResults.value = [];
    return;
  }
  insuredSearchReq.send(
    () => searchInsuredByInstitution(institutionUuid.value, { search: query, page: 1, limit: 10 }),
    (res) => {
      const raw = res?.data ?? res;
      insuredResults.value = Array.isArray(raw) ? raw : raw?.content || raw?.data?.content || raw?.data || [];
    }
  );
}

watch(insuredQuery, () => {
  clearTimeout(insuredSearchTimer);
  insuredSearchTimer = setTimeout(runInsuredSearch, 300);
});

function handleInstitutionSelect(result) {
  institutionUuid.value = result?.institutionUuid || '';
}
// A different institution means a different set of insured
watch(institutionUuid, () => {
  insuredQuery.value = '';
  insuredResults.value = [];
  clearSelected();
});

function pickInsured(insured, dependant = null) {
  selected.value = {
    insuredPersonUuid: insured.insuredUuid,
    dependantUuid: dependant?.dependantUuid || null,
    name: dependant ? dependant.dependantFullName : insured.insuredFullName,
  };
  insuredQuery.value = '';
  insuredResults.value = [];
  insuredSearchOpen.value = false;
}

function clearSelected() {
  selected.value = { insuredPersonUuid: "", dependantUuid: null, name: "" };
}

function openManualServices(refresh) {
  openModal(
    'AddClaimServices',
    {
      insuredPersonUuid: selected.value.insuredPersonUuid,
      dependantUuid: selected.value.dependantUuid,
      institutionUuid: institutionUuid.value,
      name: selected.value.name,
    },
    (result) => {
      if (result?.success) refresh?.();
    }
  );
}

function goBack() {
  selectedRow.value = null;
}
// Selected insured details
const selected = ref({
  insuredPersonUuid: "",
  dependantUuid: null,
  name: "",
});

const requestClaimReq = useApiRequest();

function requestClaim() {
  if (requestClaimReq.pending.value) return;

  openModal('Comment', {}, (comment) => {
    if (comment) {
      requestClaimReq.send(
        () => requestCashClaim({
          comment: comment.trim(),
          cashCreditUuidRequest: checked.value.map(el => ({ cashCreditUuid: el })),
        }),
        res => {
          if (res.success) {
            toasted(true, 'Request Created');
            cashCreditInsuredStore.removeAll([...checked.value]);
            checked.value = [];
          }
        }
      );
    }
  });
}
const checked = ref([]);
const search = ref("");

</script>
<template>
  <CreditClaimDataProvider 
    :params="{ 
      institutionUuid, 
      contractUuid, 
      itemType,
      serviceType
    }"
    :search="search"
    :auto="true"
  >
    <template #default="{ claims, pending: dataPending, search: paginationSearch, send }">
      <DefaultPage v-model="search" :hideSearch="selectedRow ? true : false">
         
          <template #header v-if="!selectedRow">
            <FilterOnDetector :watch="[() => institutionUuid.value, () => contractUuid.value]">
          <SearchSelect
            placeholder="Filter by Institution"
            :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
            :selectCb="handleInstitutionSelect"
            :option="{ label: 'institutionName', value: 'institutionUuid' }"
          />
</FilterOnDetector>
        
          <!-- Patient search: pick an insured to add services manually -->
          <div v-if="institutionUuid" class="relative w-full sm:w-72">
            <input
              v-model="insuredQuery"
              type="search"
              class="px-3 w-full h-10 text-sm bg-white rounded-md border border-line-strong focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Search patient to add services..."
              aria-label="Search patient"
              @focus="insuredSearchOpen = true"
              @blur="insuredSearchOpen = false"
            />
            <i
              v-if="insuredSearchReq.pending.value"
              class="absolute right-3 top-3 animate-spin text-ink-subtle *:size-4"
              v-html="icons.spinner"
            />
            <div
              v-if="insuredSearchOpen && insuredQuery.trim()"
              class="overflow-y-auto absolute z-50 mt-1 w-full max-h-80 bg-white rounded-lg border shadow-pop border-line"
            >
              <p v-if="!insuredSearchReq.pending.value && !insuredResults.length" class="p-3 text-sm text-ink-muted">
                No insured found.
              </p>
              <div v-for="insured in insuredResults" :key="insured.insuredUuid" class="border-b border-line last:border-b-0">
                <button
                  type="button"
                  class="flex flex-col items-start px-3 py-2 w-full text-left hover:bg-surface-muted"
                  @mousedown.prevent="pickInsured(insured)"
                >
                  <span class="text-sm font-medium text-ink">{{ insured.insuredFullName }}</span>
                  <span class="text-xs text-ink-muted">{{ insured.insuranceId }}<template v-if="insured.phone"> · {{ insured.phone }}</template></span>
                </button>
                <button
                  v-for="dep in insured.dependants || []"
                  :key="dep.dependantUuid"
                  type="button"
                  class="flex gap-1 items-center py-1.5 pr-3 pl-7 w-full text-xs text-left text-ink-muted hover:bg-surface-muted"
                  @mousedown.prevent="pickInsured(insured, dep)"
                >
                  {{ dep.dependantFullName }} <span class="text-ink-subtle">({{ dep.relationship }})</span>
                </button>
              </div>
            </div>
          </div>
    
        <div
          class="flex flex-1 gap-2 justify-end items-center px-3 font-semibold"
        >
          <Button type="secondary" @click="router.push('/cash_services')">
            Add Cash Services
          </Button>
          <span
            v-if="selected.insuredPersonUuid"
            class="inline-flex gap-1.5 items-center pr-1 pl-3 h-9 text-sm whitespace-nowrap rounded-full bg-primary/10 text-primary"
          >
            {{ selected.name }}
            <button
              type="button"
              class="grid place-items-center w-6 h-6 rounded-full hover:bg-primary/15"
              aria-label="Clear selected patient"
              @click="clearSelected"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </span>
          <Button
            v-if="selected.insuredPersonUuid"
            type="primary"
            @click="openManualServices(send)"
          >
            Add Services Manually
          </Button>
        </div>
        <Button v-if="checked.length" @click="requestClaim" type="primary">
          Process Claim
        </Button>
      </template>
          <Table
           v-if="!selectedRow"
            :pending="dataPending"
            :rowCom="CreditClaimTableRow"
            :headers="{
              head: [
                'Insured Name',
                'Provider Name',
                'Institution',
                'Service Type',
                'Services',
                'Total Amount',
                'Status',
                'Claim Date',
                'Actions',
              ],
              row: [
                'fullname',
                'providerName',
                'institutionName',
                'itemType',
                'providedItems',
                'amount',
                'status',
                'providedDate',
              ],
            }"
            :cells="{
              // onView: (row) => openModal('EditClaimService', {
              //   hospital: row.hospital,
              //   cashCreditUuid: row.cashCreditUuid,
              //   insuredPersonUuid: row.insuredPersonUuid,
              //   dependantUuid: row.dependantUuid,
              //   institutionUuid: row.institutionUuid,
              //   cashServices: row.cashServiceResponses
              // })
              onView: viewDetail,
              onEdit: editSubmittedService,
            }"
            :rows="claims"
          />
          <CreditClaimDetail
        v-else
        :row="selectedRow"
        @back="goBack"
      />
        </DefaultPage>
    </template>
  </CreditClaimDataProvider>
</template>

 