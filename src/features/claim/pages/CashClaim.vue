<script setup lang="ts">
import CustomSelect from "@/components/CustomSelect.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { usePagination } from "@/composables/usePagination"; 
import InstitutionPolicyByStatusDataProvider from "@/features/institutions/components/InstitutionPolicyByStatusDataProvider.vue";
import { computed, ref, watch } from "vue";
import { getCashCreditByInstitution, requestCashClaim } from "../api/cashCreditApi";
import Table from "@/components/Table.vue";
import { formatCurrency, toasted } from "@/utils/utils";
import { searchInsuredByInstitution } from "@/features/insured_persons/api/insuredPersonsApi";
import Dropdown from "@/components/Dropdown.vue";
import icons from "@/utils/icons";
import Button from "@/components/Button.vue";
import { openModal } from "@customizer/modal-x";
import { useSearchedCashCreditInsuredByInstitutionStore } from "../store/searchCashCreditInsuredInstitutionStore";
import { useApiRequest } from "@/composables/useApiRequest";
import InsuredInformationCard from "../components/InsuredInformationCard.vue";
import TableWithCheckBox from "@/components/TableWithCheckBox.vue";

const institution = ref("");

const cashCreditInsuredStore = useSearchedCashCreditInsuredByInstitutionStore();
const cashCredit = usePagination({
  auto: false,
  store: cashCreditInsuredStore,
  cb: (data: any) => {
    return getCashCreditByInstitution({
      ...data,
      institutionUuid: institution.value,
    });
  },
  watch: [institution],
});

const searchInsured = usePagination({
  auto: false,
  cb: (data: any, config: any) => {
    return searchInsuredByInstitution(institution.value, data, config);
  },
});

interface Selectedinsured {
  insuredPersonUuid: string;
  dependantUuid: string | null;
  name: string;
}

const selected = ref<Selectedinsured>({
  insuredPersonUuid: "",
  dependantUuid: null,
  name: "",
});

const requestClaimReq = useApiRequest()
function requestClaim() {
  if(requestClaimReq.pending.value) return
  
  openModal('Comment', {}, (comment: string) => {
    if(comment) {
      requestClaimReq.send(
        () => requestCashClaim({
          comment: comment.trim(),
          cashCreditUuidRequest: checked.value.map(el => ({cashCreditUuid: el}))
        }),
        res => {
          if(res.success) {
            toasted(true, 'Request Created')
            cashCreditInsuredStore.removeAll([...checked.value])
            checked.value = []
          }
        }
      )
    }
  })
}

interface InsuredDetail {
  insuredName?: string,
  phone?: string,
  insuranceId?: string
}

const focusedInsured = ref<InsuredDetail>({})
let timeout: number
function assignUser(value: InsuredDetail) {
  if(timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    focusedInsured.value = value
  }, 100)
}

const checked = ref([])
watch(checked, () => {
  console.log('checked', checked.value);
})
</script>

<template>
  <InstitutionPolicyByStatusDataProvider v-slot="{ pending, institutions }">
    <DefaultPage>
      <template #header>
        <div class="flex items-center gap-2">
          <CustomSelect
            :pending="pending"
            v-model="institution"
            placeholder="Select Institution"
            :options="
              institutions.map((el) => ({
                value: el.institutionUuid,
                label: el.institutionName,
              }))
            "
          />
          <Dropdown v-slot="{ setRef, toggle }">
            <div
              class="focus-within:sys-focus !pr-0 input-style flex"
              v-if="institution"
            >
              <input
                @focus="toggle(true)"
                class="flex-1 focus:shadow-none"
                v-model="searchInsured.search.value"
                placeholder="Search for a Patient"
              />
              <div class="size-10 grid place-items-center">
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
                  class="grid insured-grid w-full items-center gap-x-2"
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
                          class="text-xxs font-semibold"
                          >{{ dep.relationship }}</span
                        >)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
        <div
          class="flex-1 flex items-center gap-2 justify-end font-semibold px-3"
        >
          <span class="px-3 rounded bg-primary/10 py-1 shadow-md">{{
            selected.name
          }}</span>
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
      <TableWithCheckBox
        v-model="checked"
        to-be-selected="cashCreditUuid"
        :pending="cashCredit.pending.value"
        :headers="{
          head: [
            'Patient Full Name',
            'Hospital Name',
            'Total Amount',
            'actions',
          ],
          row: ['fullName', 'hospital', 'totalAmount'],
        }"
        :cells="{
					totalAmount: (totalAmount: number) => formatCurrency(totalAmount)
				}"
        :rows="cashCreditInsuredStore.cashCreditInsured"
      >
        <template #actions="{ row }">
          <button
            @click="
              openModal('EditClaimService', {
                hospital: row.hospital,
                cashCreditUuid: row.cashCreditUuid,
                insuredPersonUuid: row.insuredPersonUuid,
                dependantUuid: row.dependantUuid,
                institutionUuid: row.institutionUuid,
                cashServices: row.cashServiceResponses
              })
            "
            class="text-primary italic"
          >
            Edit
          </button>
        </template>
      </TableWithCheckBox>
    </DefaultPage>
  </InstitutionPolicyByStatusDataProvider>
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
