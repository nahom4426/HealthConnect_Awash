<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import { usePagination } from "@/composables/usePagination";
import { computed, ref, watch } from "vue";
import { requestCashClaim } from "../api/cashCreditApi";
import Table from "@/components/Table.vue";
import { formatCurrency, toasted } from "@/utils/utils";
import { searchInsuredByInstitution } from "@/features/insured_persons/api/insuredPersonsApi";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionApi";
import Dropdown from "@/components/Dropdown.vue";
import icons from "@/utils/icons";
import Button from "@/components/Button.vue";
import { openModal } from "@customizer/modal-x";
import { useSearchedCashCreditInsuredByInstitutionStore } from "../store/searchCashCreditInsuredInstitutionStore";
import { useApiRequest } from "@/composables/useApiRequest";
import InsuredInformationCard from "../components/InsuredInformationCard.vue";
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

// Initialize searchInsured composable
const searchInsured = usePagination(
  (params) => searchInsuredByInstitution(institutionUuid.value, params),
  { pageSize: 10 }
);
function handleInstitutionSelect(result) {
  institutionUuid.value = result?.institutionUuid || '';
  send();
}
// Watch for institution changes and reset search
watch(institutionUuid, (newInstitutionUuid) => {
  if (newInstitutionUuid) {
    // Reset search when institution changes
    searchInsured.search.value = '';
    searchInsured.data.value = [];
  }
});

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
// Insured detail structure
const focusedInsured = ref({});
let timeout;

function assignUser(value) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    focusedInsured.value = value;
  }, 100);
}

const checked = ref([]);
const search = ref("");

watch(checked, () => {
  console.log('checked', checked.value);
});
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
        
          <!-- <Dropdown v-slot="{ setRef, toggle }">
            <div
              class="focus-within:sys-focus !pr-0 input-style flex"
              v-if="institutionUuid"
            >
              <input
                @focus="toggle(true)"
                class="flex-1 focus:shadow-none"
                v-model="searchInsured.search.value"
                placeholder="Search for a Patient"
              />
              <div class="grid place-items-center size-10">
                <i
                  v-if="searchInsured.pending.value"
                  class="animate-spin"
                  v-html="icons.spinner"
                />
              </div>
            </div>
       <div :ref="setRef">
              <div
                tabindex="0"
                class="group w-80 h-max max-h-[20rem] show-scrollbar border flex flex-col gap-2 rounded bg-base-clr4 shadow-lg !p-2"
              >
                <template v-if="!searchInsured.data.value?.length">
                  <div class="m-auto text-sm">
                    {{
                      searchInsured.dirty.value
                        ? "Search For Another Insured"
                        : "Search For Insured"
                    }}
                  </div>
                </template>
                <InsuredInformationCard
                  :key="focusedInsured.insuredName"
                  :focusedInsured="focusedInsured"
                />
                <div
                  v-for="insured in searchInsured.data.value"
                  :key="insured.insuredUuid"
                  class="grid gap-x-2 items-center w-full insured-grid"
                >
                  <div class="grid place-items-center size-8">
                    <i class="*:size-4" v-html="icons.insured" />
                  </div>
                  <b
                    @mouseover="assignUser({
                      insuranceId: insured.insuranceId,
                      insuredName: insured.insuredFullName,
                      phone: insured.phone
                    })"
                    v-ripple
                    @click="
                      () => {
                        selected.insuredPersonUuid = insured.insuredUuid;
                        selected.dependantUuid = null;
                        selected.name = insured.insuredFullName;
                      }
                    "
                    class="cursor-pointer"
                    >{{ insured.insuredFullName }}</b
                  >
                  <div class="dependants-area">
                    <p class="text-[9px] font-semibold">dependants</p>
                    <div class="flex flex-col gap-2">
                      <div
                        @mouseover="assignUser({
                          insuranceId: insured.insuranceId,
                          insuredName: dep.dependantFullName,
                          phone: insured.phone
                        })"
                        v-ripple
                        @click="
                          () => {
                            selected.insuredPersonUuid = insured.insuredUuid;
                            selected.dependantUuid = dep.dependantUuid;
                            selected.name = dep.dependantFullName;
                          }
                        "
                        class="cursor-pointer"
                        :key="dep.dependantUuid"
                        v-for="dep in insured.dependants"
                      >
                        {{ dep?.dependantFullName }} (<span
                          class="font-semibold text-xxs"
                          >{{ dep.relationship }}</span
                        >)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Dropdown> -->
    
        <div
          class="flex flex-1 gap-2 justify-end items-center px-3 font-semibold"
        >
          <Button type="secondary" @click="router.push('/cash_services')">
            Add Cash Services
          </Button>
          <!-- <span class="px-3 py-1 rounded shadow-md bg-primary/10">{{
            selected.name
          }}</span> -->
          <Button
            v-if="selected.insuredPersonUuid"
            @click="
              openModal('AddClaimServices', {
                insuredPersonUuid: selected.insuredPersonUuid,
                dependantUuid: selected.dependantUuid,
                institutionUuid: institution,
              })
            "
            type="primary"
          >
            Add Service
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

<style>
.insured-grid {
  grid-template-columns: 2rem 1fr;
  grid-template-rows: minmax(2rem, max-content) max-content;
  grid-template-areas:
    "l m"
    "e d";
}

.dependants-area {
  grid-area: d;
}
</style>
 