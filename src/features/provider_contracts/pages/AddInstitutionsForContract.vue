<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import { mapContracts, deleteMapContract } from '@/features/providers/api/providerApi';
import PoliciesDataProvider from '../components/PoliciesDataProvider.vue';
import MappedInstitutionsDataProvider from '../components/MappedInstitutionsDataProvider.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import icons from '@/utils/icons';

const route = useRoute();
const router = useRouter();
const { addToast } = useToast();

// Route params
const payerProviderContractUuid = route.params.payerProviderContractUuid;
const contractName = route.params.contractName || 'Contract';

// Tabs
const active = ref(0);
const tabs = ['To Be Mapped', 'Mapped Institutions'];

// Refetch counters
const refetchPolicies = ref(0);
const refetchMapped = ref(0);

function refetchBoth() {
  refetchPolicies.value++;
  refetchMapped.value++;
}

// ────── TO BE MAPPED tab ──────
const selectedPolicies = ref(new Set()); // Set of payerInstitutionContractUuid
const allPoliciesSelected = ref(false);
const policyRows = ref([]);    // filled from slot
const mappingPending = ref(false);

function onPoliciesLoaded(policies) {
  policyRows.value = policies ?? [];
  // keep selection consistent
  if (allPoliciesSelected.value) {
    policyRows.value.forEach(p => selectedPolicies.value.add(p.payerInstitutionContractUuid));
  }
}

function toggleSelectAllPolicies(policies) {
  if (allPoliciesSelected.value) {
    selectedPolicies.value.clear();
    allPoliciesSelected.value = false;
  } else {
    policies.forEach(p => selectedPolicies.value.add(p.payerInstitutionContractUuid));
    allPoliciesSelected.value = true;
  }
}

function togglePolicy(uuid) {
  if (selectedPolicies.value.has(uuid)) {
    selectedPolicies.value.delete(uuid);
    allPoliciesSelected.value = false;
  } else {
    selectedPolicies.value.add(uuid);
  }
}

function isPolicySelected(uuid) {
  return selectedPolicies.value.has(uuid);
}

async function mapSelected() {
  if (selectedPolicies.value.size === 0) return;
  mappingPending.value = true;
  try {
    const payload = [...selectedPolicies.value].map(payerInstitutionContractUuid => ({
      payerProviderContractUuid,
      payerInstitutionContractUuid,
    }));
    await mapContracts(payload);
    addToast({ type: 'success', title: 'Success', message: `${payload.length} institution(s) mapped successfully` });
    selectedPolicies.value.clear();
    allPoliciesSelected.value = false;
    refetchBoth();
  } catch (e) {
    addToast({ type: 'error', title: 'Error', message: 'Failed to map institutions' });
  } finally {
    mappingPending.value = false;
  }
}

// ────── MAPPED tab ──────
const selectedMapped = ref(new Set()); // Set of mapContractUuid
const allMappedSelected = ref(false);
const unmappingPending = ref(false);

function toggleSelectAllMapped(institutions) {
  if (allMappedSelected.value) {
    selectedMapped.value.clear();
    allMappedSelected.value = false;
  } else {
    institutions.forEach(i => selectedMapped.value.add(i.mapContractUuid));
    allMappedSelected.value = true;
  }
}

function toggleMapped(uuid) {
  if (selectedMapped.value.has(uuid)) {
    selectedMapped.value.delete(uuid);
    allMappedSelected.value = false;
  } else {
    selectedMapped.value.add(uuid);
  }
}

function isMappedSelected(uuid) {
  return selectedMapped.value.has(uuid);
}

async function unmapSelected() {
  if (selectedMapped.value.size === 0) return;
  unmappingPending.value = true;
  try {
    const uuids = [...selectedMapped.value];
    await Promise.all(uuids.map(uuid => deleteMapContract(uuid)));
    addToast({ type: 'success', title: 'Success', message: `${uuids.length} institution(s) unmapped successfully` });
    selectedMapped.value.clear();
    allMappedSelected.value = false;
    refetchBoth();
  } catch (e) {
    addToast({ type: 'error', title: 'Error', message: 'Failed to unmap one or more institutions' });
  } finally {
    unmappingPending.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-white rounded-lg min-h-screen">

    <!-- Page Header -->
    <div class="flex gap-4 items-center pb-4 border-b border-line">
      <button
        @click="router.back()"
        class="flex gap-2 items-center px-3 py-2 text-sm text-ink-muted bg-surface-muted rounded-lg transition-colors hover:bg-line"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <div>
        <h1 class="text-xl font-bold text-ink">Add Institutions</h1>
        <p class="text-sm text-ink-subtle">{{ contractName }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex rounded border border-base-clr w-fit">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        @click="active = index"
        :class="[
          'px-4 py-3 transition-colors cursor-pointer duration-300',
          active === index
            ? index === 0
              ? 'bg-base-clr text-white rounded-l font-medium'
              : 'bg-base-clr text-white rounded-r font-medium'
            : 'text-ink-muted hover:bg-surface-muted',
        ]"
      >
        {{ tab }}
      </div>
    </div>

    <!-- ─── TO BE MAPPED TAB ─── -->
    <div v-if="active === 0">
      <DefaultPage placeholder="Search Institutions to Map">
        <template #default="{ search }">
          <PoliciesDataProvider
            :payerProviderContractUuid="payerProviderContractUuid"
            :search="search"
            :refetch="refetchPolicies"
            v-slot="{ policies, pending }"
          >
            <!-- Bulk action bar -->
            <div
              v-if="selectedPolicies.size > 0"
              class="flex gap-3 justify-between items-center px-4 py-3 mb-3 bg-primary/5 rounded-lg border border-primary/20"
            >
              <span class="text-sm font-medium text-primary-hover">
                {{ selectedPolicies.size }} institution(s) selected
              </span>
              <div class="flex gap-2">
                <button
                  @click="selectedPolicies.clear(); allPoliciesSelected = false"
                  class="px-3 py-1.5 text-sm text-ink-muted bg-white rounded-lg border border-line-strong hover:bg-surface-muted"
                >
                  Clear
                </button>
                <button
                  @click="mapSelected"
                  :disabled="mappingPending"
                  class="flex gap-2 items-center px-4 py-1.5 text-sm font-semibold text-white bg-primary rounded-lg transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  <svg v-if="mappingPending" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {{ mappingPending ? 'Mapping...' : `Map ${selectedPolicies.size} Selected` }}
                </button>
              </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto rounded-lg border border-line shadow-sm">
              <table class="min-w-full divide-y divide-line">
                <thead class="bg-surface-muted">
                  <tr>
                    <!-- Select All checkbox -->
                    <th class="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        :checked="allPoliciesSelected"
                        @change="toggleSelectAllPolicies(policies ?? [])"
                        class="w-4 h-4 text-primary rounded border-line-strong cursor-pointer focus:ring-primary"
                      />
                    </th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">#</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Institution Name</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Contract Name</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Contract Code</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Status</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Action</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-line">
                  <!-- Loading -->
                  <tr v-if="pending">
                    <td colspan="7" class="py-12 text-center">
                      <div class="flex gap-2 justify-center items-center text-ink-subtle">
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading policies...
                      </div>
                    </td>
                  </tr>
                  <!-- Empty -->
                  <tr v-else-if="!policies || policies.length === 0">
                    <td colspan="7" class="py-12 text-center text-ink-subtle">No policies found</td>
                  </tr>
                  <!-- Rows -->
                  <tr
                    v-else
                    v-for="(policy, idx) in policies"
                    :key="policy.payerInstitutionContractUuid"
                    @click="togglePolicy(policy.payerInstitutionContractUuid)"
                    :class="[
                      'transition-colors duration-150 cursor-pointer hover:bg-surface-muted',
                      isPolicySelected(policy.payerInstitutionContractUuid) ? 'bg-primary/5' : 'bg-white',
                    ]"
                  >
                    <td class="px-4 py-3" @click.stop>
                      <input
                        type="checkbox"
                        :checked="isPolicySelected(policy.payerInstitutionContractUuid)"
                        @change="togglePolicy(policy.payerInstitutionContractUuid)"
                        class="w-4 h-4 text-primary rounded border-line-strong cursor-pointer focus:ring-primary"
                      />
                    </td>
                    <td class="px-4 py-3 text-sm text-ink-subtle">{{ idx + 1 }}</td>
                    <td class="px-4 py-3">
                      <div class="text-sm font-medium text-ink">{{ policy.institutionName || policy.payerInstitutionName || '—' }}</div>
                    </td>
                    <td class="px-4 py-3 text-sm text-ink-muted">{{ policy.payerInstitutionContractName || policy.contractName || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-ink-muted">{{ policy.payerInstitutionContractCode || policy.contractCode || '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-soft text-success-strong">
                        {{ policy.status || 'ACTIVE' }}
                      </span>
                    </td>
                    <td class="px-4 py-3" @click.stop>
                      <button
                        @click="
                          selectedPolicies.clear();
                          selectedPolicies.add(policy.payerInstitutionContractUuid);
                          mapSelected();
                        "
                        :disabled="mappingPending"
                        class="flex gap-1.5 items-center px-3 py-1.5 text-sm font-medium text-primary bg-primary/5 rounded-lg border border-primary/20 transition-colors hover:bg-primary/10 disabled:opacity-60"
                      >
                        <i v-html="icons.plus || '+'" class="w-3.5 h-3.5" />
                        Map
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PoliciesDataProvider>
        </template>
      </DefaultPage>
    </div>

    <!-- ─── MAPPED INSTITUTIONS TAB ─── -->
    <div v-if="active === 1">
      <DefaultPage placeholder="Search Mapped Institutions">
        <template #default="{ search }">
          <MappedInstitutionsDataProvider
            :payerProviderContractUuid="payerProviderContractUuid"
            :search="search"
            :refetch="refetchMapped"
            v-slot="{ institutions, pending }"
          >
            <!-- Bulk action bar -->
            <div
              v-if="selectedMapped.size > 0"
              class="flex gap-3 justify-between items-center px-4 py-3 mb-3 bg-error-soft rounded-lg border border-error/20"
            >
              <span class="text-sm font-medium text-error-strong">
                {{ selectedMapped.size }} institution(s) selected
              </span>
              <div class="flex gap-2">
                <button
                  @click="selectedMapped.clear(); allMappedSelected = false"
                  class="px-3 py-1.5 text-sm text-ink-muted bg-white rounded-lg border border-line-strong hover:bg-surface-muted"
                >
                  Clear
                </button>
                <button
                  @click="unmapSelected"
                  :disabled="unmappingPending"
                  class="flex gap-2 items-center px-4 py-1.5 text-sm font-semibold text-white bg-error rounded-lg transition-colors hover:bg-error-strong disabled:opacity-60"
                >
                  <svg v-if="unmappingPending" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {{ unmappingPending ? 'Unmapping...' : `Unmap ${selectedMapped.size} Selected` }}
                </button>
              </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto rounded-lg border border-line shadow-sm">
              <table class="min-w-full divide-y divide-line">
                <thead class="bg-surface-muted">
                  <tr>
                    <th class="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        :checked="allMappedSelected"
                        @change="toggleSelectAllMapped(institutions ?? [])"
                        class="w-4 h-4 text-error rounded border-line-strong cursor-pointer focus:ring-error"
                      />
                    </th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">#</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Institution Name</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Contract Name</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Contract Code</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Status</th>
                    <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-ink-subtle uppercase">Action</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-line">
                  <tr v-if="pending">
                    <td colspan="7" class="py-12 text-center">
                      <div class="flex gap-2 justify-center items-center text-ink-subtle">
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading mapped institutions...
                      </div>
                    </td>
                  </tr>
                  <tr v-else-if="!institutions || institutions.length === 0">
                    <td colspan="7" class="py-12 text-center text-ink-subtle">No mapped institutions found</td>
                  </tr>
                  <tr
                    v-else
                    v-for="(inst, idx) in institutions"
                    :key="inst.mapContractUuid"
                    @click="toggleMapped(inst.mapContractUuid)"
                    :class="[
                      'transition-colors duration-150 cursor-pointer hover:bg-surface-muted',
                      isMappedSelected(inst.mapContractUuid) ? 'bg-error-soft' : 'bg-white',
                    ]"
                  >
                    <td class="px-4 py-3" @click.stop>
                      <input
                        type="checkbox"
                        :checked="isMappedSelected(inst.mapContractUuid)"
                        @change="toggleMapped(inst.mapContractUuid)"
                        class="w-4 h-4 text-error rounded border-line-strong cursor-pointer focus:ring-error"
                      />
                    </td>
                    <td class="px-4 py-3 text-sm text-ink-subtle">{{ idx + 1 }}</td>
                    <td class="px-4 py-3">
                      <div class="text-sm font-medium text-ink">{{ inst.institutionName || '—' }}</div>
                    </td>
                    <td class="px-4 py-3 text-sm text-ink-muted">{{ inst.payerInstitutionContractName || inst.contractName || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-ink-muted">{{ inst.payerInstitutionContractCode || inst.contractCode || '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-soft text-success-strong">
                        {{ inst.status || 'ACTIVE' }}
                      </span>
                    </td>
                    <td class="px-4 py-3" @click.stop>
                      <button
                        @click="
                          selectedMapped.clear();
                          selectedMapped.add(inst.mapContractUuid);
                          unmapSelected();
                        "
                        :disabled="unmappingPending"
                        class="flex gap-1.5 items-center px-3 py-1.5 text-sm font-medium text-error bg-error-soft rounded-lg border border-error/20 transition-colors hover:bg-error-soft disabled:opacity-60"
                      >
                        <i v-html="icons.trash || '✕'" class="w-3.5 h-3.5" />
                        Unmap
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </MappedInstitutionsDataProvider>
        </template>
      </DefaultPage>
    </div>

  </div>
</template>
