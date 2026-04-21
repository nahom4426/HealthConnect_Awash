<script setup>
import { computed, reactive, ref, watch } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import icons from "@/utils/icons";
import AuthorizationDataProvider from "../components/AuthorizationDataProvider.vue";
import AuthorizationRow from "../components/AuthorizationRow.vue";
import SearchSelect from "@/components/SearchSelect.vue";
import { getActiveContract } from "@/features/provider_contracts/api/contractApi.js";
import { getIssuedContracts } from "@/features/underwriting/api/underwritingApi.js";
import { searchInsuredByInstitution } from "@/features/insured_persons/api1/insuredPersonsApi";

const showFilters = ref(false);

const selected = reactive({
  contractUuid: null,
  policyUuid: null,
  institutionUuid: null,
  insuredUuid: null,
  dependantUuid: null,
});

const filters = computed(() => {
  return {
    contractUuid: selected.contractUuid || undefined,
    policyUuid: selected.policyUuid || undefined,
    insuredUuid: selected.insuredUuid || undefined,
    dependantUuid: selected.dependantUuid || undefined,
  };
});

watch(
  () => selected.policyUuid,
  () => {
    selected.insuredUuid = null;
    selected.dependantUuid = null;
  }
);

watch(
  () => selected.contractUuid,
  () => {
    selected.policyUuid = null;
    selected.institutionUuid = null;
    selected.insuredUuid = null;
    selected.dependantUuid = null;
  }
);

function clearFilters() {
  selected.contractUuid = null;
  selected.policyUuid = null;
   selected.institutionUuid = null;
  selected.insuredUuid = null;
  selected.dependantUuid = null;
}
</script>

<template>
  <DefaultPage placeholder="Search Authorizations">
    <template #filter>
      <button
        @click="showFilters = !showFilters"
        class="flex gap-2 justify-center items-center px-6 py-4 bg-gray-100 rounded-md text-primary"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>

    <template #default="{ search }">
      <div v-if="showFilters" class="p-4 bg-white rounded-xl border border-gray-200">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Provider Contract</label>
            <SearchSelect
              placeholder="Search provider / contract"
              :searchCb="(data) => getActiveContract({ ...data })"
              :selectCb="(result) => {
                selected.contractUuid = result?.payerProviderContractUuid || null;
              }"
              :option="{ label: 'providerName', value: 'payerProviderContractUuid' }"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Policy / Institution</label>
            <SearchSelect
              placeholder="Search institution policy"
              :searchCb="(data) => getIssuedContracts({ ...data, status: 'ACTIVE' })"
              :selectCb="(result) => {
                selected.policyUuid = result?.payerInstitutionContractUuid || null;
                selected.institutionUuid = result?.institutionUuid || null;
              }"
              :option="{ label: 'institutionName', value: 'payerInstitutionContractUuid' }"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Insured</label>
            <template v-if="selected.institutionUuid">
              <SearchSelect
                placeholder="Search insured person"
                :searchCb="async (data) => {
                  const res = await searchInsuredByInstitution(selected.institutionUuid, { ...data });
                  const payload = res?.data ?? res;

                  const buildFullName = (first, father, grandFather, fallback) => {
                    const base = [first, father, grandFather]
                      .filter(Boolean)
                      .join(' ');
                    return base || fallback;
                  };

                  const flatten = (items) => {
                    const rows = [];
                    items.forEach((p) => {
                      // Insured row
                      rows.push({
                        ...p,
                        type: 'INSURED',
                        fullName: buildFullName(p?.firstName, p?.fatherName, p?.grandFatherName, p?.insuredUuid),
                      });

                      // Dependants as additional options under same insured
                      if (Array.isArray(p?.dependantResponses)) {
                        p.dependantResponses.forEach((d) => {
                          rows.push({
                            ...d,
                            type: 'DEPENDANT',
                            insuredUuid: p?.insuredUuid,
                            fullName: buildFullName(
                              d?.firstName,
                              d?.fatherName,
                              d?.grandFatherName,
                              d?.dependantUuid
                            ) + (d?.relationship ? ` - ${d.relationship}` : ''),
                          });
                        });
                      }
                    });
                    return rows;
                  };

                  // Handle pageable {content: []} and direct array []
                  if (payload?.content && Array.isArray(payload.content)) {
                    const flattened = flatten(payload.content);
                    return { ...res, data: { ...payload, content: flattened } };
                  }

                  if (Array.isArray(payload)) {
                    const flattened = flatten(payload);
                    return { ...res, data: flattened };
                  }

                  return res;
                }"
                :selectCb="(result) => {
                  // Whether user picked insured or dependant, always filter by insuredUuid
                  selected.insuredUuid = result?.insuredUuid || null;
                  selected.dependantUuid = result?.type === 'DEPENDANT' ? result?.dependantUuid || null : null;
                }"
                :option="{ label: 'fullName', value: 'insuredUuid' }"
              >
                <template #searchResult="{ result, onSelect }">
                  <div
                    v-for="(item, idx) in result"
                    :key="item.insuredUuid || item.dependantUuid || idx"
                    class="flex gap-3 items-center px-3 py-2 rounded-lg transition-colors cursor-pointer hover:bg-blue-50 focus:outline-none"
                    tabindex="0"
                    @click.prevent.stop="onSelect(item)"
                    @keydown.enter.prevent.stop="onSelect(item)"
                  >
                    <!-- Avatar circle -->
                    <div
                      class="flex justify-center items-center w-9 h-9 rounded-xl"
                      :class="item.type === 'DEPENDANT' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'"
                    >
                      <span v-if="item.type === 'DEPENDANT'" class="text-xs font-semibold">
                        D
                      </span>
                      <span v-else class="text-xs font-semibold">
                        I
                      </span>
                    </div>

                    <!-- Text content -->
                    <div class="flex flex-col flex-1 min-w-0">
                      <div class="flex gap-2 items-center">
                        <span class="text-sm font-semibold text-gray-900 truncate">
                          {{ item.fullName }}
                        </span>
                        <span
                          v-if="item.type === 'DEPENDANT'"
                          class="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-100 text-violet-700 border border-violet-200"
                        >
                          Dependant
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-100 text-sky-700 border border-sky-200"
                        >
                          Insured
                        </span>
                      </div>

                      <span
                        v-if="item.relationship && item.type === 'DEPENDANT'"
                        class="text-xs text-gray-500 truncate"
                      >
                        Relationship: {{ item.relationship }}
                      </span>
                      <span
                        v-else-if="item.idNumber"
                        class="text-xs text-gray-400 truncate"
                      >
                        ID: {{ item.idNumber }}
                      </span>
                    </div>
                  </div>
                </template>
              </SearchSelect>
            </template>
            <template v-else>
              <input
                disabled
                class="px-3 h-10 text-sm bg-gray-50 rounded-lg border border-gray-200"
                placeholder="Select policy first"
              />
            </template>
          </div>
        </div>

        <div class="flex gap-2 justify-end mt-4">
          <button
            @click="clearFilters"
            class="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      <AuthorizationDataProvider :search="search" :filters="filters" v-slot="{ pending, authorizations }">
        <Table
          :pending="pending"
          :virtual="true"
          :itemKey="'authorizationUuid'"
          :virtualHeight="600"
          :virtualItemSize="64"
          :rowCom="AuthorizationRow"
          :rows="authorizations"
          :headers="{
            head: [
        
              'Provider Name',
              'Institution Name',
              'Member',
              'Status',
              'End Date',
              'Active Days',
              'Actions'
            ],
            row: [
            
              'providerName',
              'institutionName',
              'member',
              'status',
              'endDate',
              'activeDays'
            ]
          }"
        >
          <!-- <template #placeholder>
            <div class="py-12 text-center">
              <div class="flex flex-col justify-center items-center">
                <i v-html="icons.document"></i>
                <p class="text-gray-500">No authorizations found</p>
                <p v-if="search" class="mt-1 text-sm text-gray-400">
                  No results match your search criteria
                </p>
              </div>
            </div>
          </template> -->
        </Table>
      </AuthorizationDataProvider>
    </template>
  </DefaultPage>
</template>
