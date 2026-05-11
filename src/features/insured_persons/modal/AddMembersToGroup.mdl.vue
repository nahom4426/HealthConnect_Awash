<script setup>
import Table from "@/components/Table.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { computed, onMounted, ref, watch } from "vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import {
  addInsuredsToServiceQuotedBenefit,
  getMappedInsuredsForServiceQuotedBenefit,
} from "../api/groupServiceApi";
import { toasted } from "@/utils/utils";
import Spinner from "@/components/Spinner.vue";
import Pagination from "@/components/Pagination.vue";
import { useRoute } from "vue-router";
import { searchInsuredByInstitution } from "../api/insuredPersonsApi";

const route = useRoute();
const api = useApiRequest();
const props = defineProps({
  data: Object,
});

const auth = useAuthStore();
const institutionId = ref(auth.auth?.user?.payerUuid || "");
const search = ref("");
const searchTimeout = ref(null);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(1000);
const itemsPerPageOptions = [25, 50, 100, 1000];
const totalItems = ref(0);
const allMembers = ref([]);
const isLoading = ref(false);

// Selection management
const isSelected = ref(false);
const selected = ref([]);
const selectedDependants = ref([]);
const allSelectedOnPage = ref(false);
const allDependantsSelectedOnPage = ref(false);

const mappedBenefit = ref(null);

const removedInsuredUuids = ref([]);
const removedDependantUuids = ref([]);

const mappedInsuredUuidSet = computed(() => {
  const uuids = (mappedBenefit.value?.insureds || []).map((i) => i?.insuredUuid).filter(Boolean);
  return new Set(uuids);
});

const mappedDependantUuidSet = computed(() => {
  const uuids = (mappedBenefit.value?.dependants || []).map((d) => d?.dependantUuid).filter(Boolean);
  return new Set(uuids);
});

const effectiveMappedInsuredUuidSet = computed(() => {
  const base = mappedInsuredUuidSet.value;
  const removed = new Set(removedInsuredUuids.value);
  return new Set(Array.from(base).filter((id) => !removed.has(id)));
});

const effectiveMappedDependantUuidSet = computed(() => {
  const base = mappedDependantUuidSet.value;
  const removed = new Set(removedDependantUuids.value);
  return new Set(Array.from(base).filter((id) => !removed.has(id)));
});

const mappedInsuredCount = computed(() => (mappedBenefit.value?.insureds || []).length);
const mappedDependantCount = computed(() => (mappedBenefit.value?.dependants || []).length);

const removedInsuredCount = computed(() => removedInsuredUuids.value.length);
const removedDependantCount = computed(() => removedDependantUuids.value.length);

const hasPendingChanges = computed(() => {
  return (
    selected.value.length > 0 ||
    selectedDependants.value.length > 0 ||
    removedInsuredUuids.value.length > 0 ||
    removedDependantUuids.value.length > 0
  );
});

const allInsuredSelected = computed(() => {
  const selectable = filteredMembers.value
    .map((m) => m?.insuredUuid)
    .filter((id) => id && !mappedInsuredUuidSet.value.has(id));
  return selectable.length > 0 && selectable.every((id) => selected.value.includes(id));
});

const allDependantsSelected = computed(() => {
  const selectable = [];
  filteredMembers.value.forEach((insured) => {
    (insured?.dependantResponses || []).forEach((dep) => {
      if (dep?.dependantUuid && !mappedDependantUuidSet.value.has(dep.dependantUuid)) {
        selectable.push(dep.dependantUuid);
      }
    });
  });
  return selectable.length > 0 && selectable.every((id) => selectedDependants.value.includes(id));
});

// Computed properties
const filteredMembers = computed(() => {
  if (!search.value) return allMembers.value;

  const term = search.value.toLowerCase();
  return allMembers.value.filter((member) =>
    (member.firstName?.toLowerCase().includes(term) ||
    member.fatherName?.toLowerCase().includes(term) ||
    member.idNumber?.toLowerCase().includes(term) ||
    member.phone?.toLowerCase().includes(term))
  );
});

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredMembers.value.slice(start, end);
});

// Watch for changes in filtered members to update totalItems
watch(filteredMembers, (newVal) => {
  totalItems.value = newVal.length;
}, { immediate: true });

// Methods
function handleSelectAll(checked) {
  if (checked) {
    paginatedMembers.value.forEach((item) => {
      if (item?.insuredUuid && !selected.value.includes(item.insuredUuid)) {
        if (!mappedInsuredUuidSet.value.has(item.insuredUuid)) {
          selected.value.push(item.insuredUuid);
        }
      }
    });
    allSelectedOnPage.value = true;

    // Also select dependants for the same page
    paginatedMembers.value.forEach((insured) => {
      (insured?.dependantResponses || []).forEach((dep) => {
        if (dep?.dependantUuid && !selectedDependants.value.includes(dep.dependantUuid)) {
          if (!mappedDependantUuidSet.value.has(dep.dependantUuid)) {
            selectedDependants.value.push(dep.dependantUuid);
          }
        }
      });
    });
    allDependantsSelectedOnPage.value = true;
  } else {
    const pageItemIds = paginatedMembers.value.map((item) => item.insuredUuid);
    selected.value = selected.value.filter((id) => !pageItemIds.includes(id));
    allSelectedOnPage.value = false;

    const pageDepIds = [];
    paginatedMembers.value.forEach((insured) => {
      (insured?.dependantResponses || []).forEach((dep) => {
        if (dep?.dependantUuid) pageDepIds.push(dep.dependantUuid);
      });
    });
    selectedDependants.value = selectedDependants.value.filter((id) => !pageDepIds.includes(id));
    allDependantsSelectedOnPage.value = false;
  }
  isSelected.value = selected.value.length === filteredMembers.value.length;
}

function handleSelectAllInsuredsGlobal(checked) {
  if (checked) {
    filteredMembers.value.forEach((item) => {
      if (item?.insuredUuid && !selected.value.includes(item.insuredUuid)) {
        if (!mappedInsuredUuidSet.value.has(item.insuredUuid)) {
          selected.value.push(item.insuredUuid);
        }
      }
    });
  } else {
    const allIds = filteredMembers.value.map((m) => m?.insuredUuid).filter(Boolean);
    selected.value = selected.value.filter((id) => !allIds.includes(id));
    allSelectedOnPage.value = false;
  }
}

function handleSelectAllDependants(checked) {
  if (checked) {
    paginatedMembers.value.forEach((insured) => {
      (insured?.dependantResponses || []).forEach((dep) => {
        if (dep?.dependantUuid && !selectedDependants.value.includes(dep.dependantUuid)) {
          if (!mappedDependantUuidSet.value.has(dep.dependantUuid)) {
            selectedDependants.value.push(dep.dependantUuid);
          }
        }
      });
    });
    allDependantsSelectedOnPage.value = true;
  } else {
    const pageDepIds = [];
    paginatedMembers.value.forEach((insured) => {
      (insured?.dependantResponses || []).forEach((dep) => {
        if (dep?.dependantUuid) pageDepIds.push(dep.dependantUuid);
      });
    });

    selectedDependants.value = selectedDependants.value.filter((id) => !pageDepIds.includes(id));
    allDependantsSelectedOnPage.value = false;
  }
}

function handleSelectAllDependantsGlobal(checked) {
  if (checked) {
    filteredMembers.value.forEach((insured) => {
      (insured?.dependantResponses || []).forEach((dep) => {
        if (dep?.dependantUuid && !selectedDependants.value.includes(dep.dependantUuid)) {
          if (!mappedDependantUuidSet.value.has(dep.dependantUuid)) {
            selectedDependants.value.push(dep.dependantUuid);
          }
        }
      });
    });
  } else {
    const allDepIds = [];
    filteredMembers.value.forEach((insured) => {
      (insured?.dependantResponses || []).forEach((dep) => {
        if (dep?.dependantUuid) allDepIds.push(dep.dependantUuid);
      });
    });
    selectedDependants.value = selectedDependants.value.filter((id) => !allDepIds.includes(id));
    allDependantsSelectedOnPage.value = false;
  }
}

function selectService(id) {
  const idx = selected.value.findIndex((el) => el === id);
  if (idx > -1) {
    selected.value.splice(idx, 1);
    allSelectedOnPage.value = false;
    isSelected.value = false;
  } else {
    if (!mappedInsuredUuidSet.value.has(id)) {
      selected.value.push(id);
    }
    allSelectedOnPage.value = paginatedMembers.value.every((item) =>
      selected.value.includes(item.insuredUuid)
    );
    isSelected.value = selected.value.length === filteredMembers.value.length;
  }
}

function toggleDependant(depUuid) {
  const idx = selectedDependants.value.findIndex((el) => el === depUuid);
  if (idx > -1) {
    selectedDependants.value.splice(idx, 1);
    allDependantsSelectedOnPage.value = false;
  } else {
    if (!mappedDependantUuidSet.value.has(depUuid)) {
      selectedDependants.value.push(depUuid);
    }

    const allDepIdsOnPage = [];
    paginatedMembers.value.forEach((insured) => {
      (insured?.dependantResponses || []).forEach((d) => {
        if (d?.dependantUuid && !mappedDependantUuidSet.value.has(d.dependantUuid)) {
          allDepIdsOnPage.push(d.dependantUuid);
        }
      });
    });

    allDependantsSelectedOnPage.value =
      allDepIdsOnPage.length > 0 && allDepIdsOnPage.every((id) => selectedDependants.value.includes(id));
  }
}

async function handleAddMembersToGroup() {
  if (!hasPendingChanges.value) {
    toasted(false, "", "Please select at least one insured/dependant or remove existing mapped ones");
    return;
  }

  try {
    const existingInsuredUuids = (mappedBenefit.value?.insureds || [])
      .map((i) => i?.insuredUuid)
      .filter(Boolean)
      .filter((id) => !removedInsuredUuids.value.includes(id));

    const existingDependantUuids = (mappedBenefit.value?.dependants || [])
      .map((d) => d?.dependantUuid)
      .filter(Boolean)
      .filter((id) => !removedDependantUuids.value.includes(id));

    const finalInsuredUuids = Array.from(new Set([...existingInsuredUuids, ...selected.value]));
    const finalDependantUuids = Array.from(
      new Set([...existingDependantUuids, ...selectedDependants.value])
    );

    const res = await api.send(
      () =>
        addInsuredsToServiceQuotedBenefit(props.data.serviceQuotedUuid, {
          insuredUuids: finalInsuredUuids,
          dependantUuids: finalDependantUuids,
        })
    );

    const isSuccess = res?.success === true || res?.status === 200;
    if (!isSuccess) throw new Error(res?.error || "Failed to add members");

    toasted(true, "Success", "Members added to group successfully");
    closeModal({ success: true });
  } catch (error) {
    console.error("Error adding members:", error);
    toasted(false, "Error", error.message || "Failed to add members");
  }
}

function handlePageChange(page) {
  currentPage.value = page;
  allSelectedOnPage.value = false;
  allDependantsSelectedOnPage.value = false;
}

function handleSearch() {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1;
  }, 500);
}

function handleItemsPerPageChange(newSize) {
  itemsPerPage.value = newSize;
  currentPage.value = 1;
}

async function fetchAllInsureds() {
  isLoading.value = true;
  try {
    const institutionUuid =
      props.data?.institutionUuid ||
      route.params.institutionUuid ||
      route.params.id ||
      institutionId.value;

    const response = await searchInsuredByInstitution(institutionUuid, {
      page: 0,
      limit: 1000,
      sortBy: "id",
      sortDirection: "desc",
    });
    const paginated = response?.data || response;
    allMembers.value = Array.isArray(paginated?.content)
      ? paginated.content
      : Array.isArray(paginated)
        ? paginated
        : [];
  } catch (e) {
    console.error("Error fetching insureds:", e);
    allMembers.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function fetchMappedInsureds() {
  if (!props.data?.serviceQuotedUuid) return;
  try {
    const response = await getMappedInsuredsForServiceQuotedBenefit(
      props.data.serviceQuotedUuid,
      {
        page: 0,
        limit: 1000,
        sortBy: "id",
        sortDirection: "desc",
      }
    );
    const paginated = response?.data || response;
    mappedBenefit.value = paginated || null;
    removedInsuredUuids.value = [];
    removedDependantUuids.value = [];
  } catch (e) {
    console.error("Error fetching mapped insureds:", e);
    mappedBenefit.value = null;
    removedInsuredUuids.value = [];
    removedDependantUuids.value = [];
  }
}

function removeExistingInsured(insuredUuid) {
  if (!insuredUuid) return;
  if (!mappedInsuredUuidSet.value.has(insuredUuid)) return;
  const idx = removedInsuredUuids.value.indexOf(insuredUuid);
  if (idx > -1) {
    removedInsuredUuids.value.splice(idx, 1);
  } else {
    removedInsuredUuids.value.push(insuredUuid);
    // If user marks it for removal, also remove it from the "to add" selection
    selected.value = selected.value.filter((id) => id !== insuredUuid);
  }
}

function removeExistingDependant(dependantUuid) {
  if (!dependantUuid) return;
  if (!mappedDependantUuidSet.value.has(dependantUuid)) return;
  const idx = removedDependantUuids.value.indexOf(dependantUuid);
  if (idx > -1) {
    removedDependantUuids.value.splice(idx, 1);
  } else {
    removedDependantUuids.value.push(dependantUuid);
    selectedDependants.value = selectedDependants.value.filter((id) => id !== dependantUuid);
  }
}

function removeAllExisting() {
  const allIns = (mappedBenefit.value?.insureds || [])
    .map((i) => i?.insuredUuid)
    .filter(Boolean);
  const allDeps = (mappedBenefit.value?.dependants || [])
    .map((d) => d?.dependantUuid)
    .filter(Boolean);

  const alreadyAllRemoved =
    (allIns.length + allDeps.length > 0) &&
    allIns.every((id) => removedInsuredUuids.value.includes(id)) &&
    allDeps.every((id) => removedDependantUuids.value.includes(id));

  if (alreadyAllRemoved) {
    removedInsuredUuids.value = [];
    removedDependantUuids.value = [];
    return;
  }

  removedInsuredUuids.value = allIns;
  removedDependantUuids.value = allDeps;
}

onMounted(async () => {
  await fetchMappedInsureds();
  await fetchAllInsureds();
});

</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Add Members To Group"
      subtitle="Select members to add to your group"
    >
      <div
        class="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm"
      >
        <!-- Search and Selection Header -->
        <div class="flex flex-col gap-4 justify-between items-start md:flex-row md:items-center">
          <div class="flex gap-2 items-center">
            <span class="text-sm font-medium text-gray-700">
              Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, totalItems) }}-
              {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }}
            </span>
            <span
              v-if="selected.length + selectedDependants.length > 0"
              class="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
            >
              {{ selected.length + selectedDependants.length }} selected
            </span>
          </div>

          <div class="flex gap-4 items-center">
            <div class="relative w-full md:w-96">
              <input
                v-model="search"
                @input="handleSearch"
                placeholder="Search members by name, ID or phone..."
                class="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 transition focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                type="text"
              />
              <div class="absolute top-2.5 left-3 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <select
              v-model="itemsPerPage"
              @change="handleItemsPerPageChange(Number($event.target.value))"
              class="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                {{ option }} per page
              </option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-8">
          <Spinner size="lg" />
        </div>

        <!-- Members Table -->
        <div v-else class="overflow-hidden rounded-lg border border-gray-200">
          <div class="flex flex-wrap gap-4 items-center p-3 bg-gray-50 border-b border-gray-200">
            <label class="flex gap-2 items-center text-sm text-gray-700">
              <input
                type="checkbox"
                :checked="allInsuredSelected"
                @change="handleSelectAllInsuredsGlobal($event.target.checked)"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              Select all insureds
            </label>

            <label class="flex gap-2 items-center text-sm text-gray-700">
              <input
                type="checkbox"
                :checked="allDependantsSelected"
                @change="handleSelectAllDependantsGlobal($event.target.checked)"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              Select all dependants
            </label>

            <span class="text-xs text-gray-500">(Already mapped items are disabled)</span>
          </div>

          <div v-if="mappedBenefit" class="p-3 bg-white border-b border-gray-200">
            <div class="flex flex-wrap gap-3 justify-between items-center">
              <div class="flex flex-wrap gap-2 items-center">
                <span class="text-sm font-medium text-gray-800">Already mapped</span>
                <span class="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                  Insured: {{ mappedInsuredCount }}
                </span>
                <span class="px-2 py-0.5 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">
                  Dependants: {{ mappedDependantCount }}
                </span>
                <span
                  v-if="removedInsuredCount + removedDependantCount > 0"
                  class="px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-full"
                >
                  Removed: {{ removedInsuredCount + removedDependantCount }}
                </span>
              </div>

              <Button
                type="danger"
                class="text-white bg-red-500 hover:bg-red-600"
                :disabled="mappedInsuredCount + mappedDependantCount === 0"
                @click="removeAllExisting"
              >
                {{ (mappedInsuredCount + mappedDependantCount > 0) && (removedInsuredCount + removedDependantCount === mappedInsuredCount + mappedDependantCount) ? 'Undo Remove All' : 'Remove All' }}
              </Button>
            </div>
          </div>

          <Table
            :firstCol="true"
            :rows="paginatedMembers"
            :show-pagination="false"
            :headers="{
              head: ['Full Name', 'ID Number', 'Phone', 'Dependants', 'Status', 'Actions'],
              row: ['fullName', 'idNumber', 'phone', 'dependants', 'status'],
            }"
            :cells="{}"
            class="min-w-full divide-y divide-gray-200"
          >
            <template #headerFirst>
              <input
                :checked="allSelectedOnPage"
                @change="handleSelectAll($event.target.checked)"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                type="checkbox"
              />
            </template>

            <template #select="{ row }">
              <input
                type="checkbox"
                :disabled="mappedInsuredUuidSet.has(row?.insuredUuid)"
                :checked="mappedInsuredUuidSet.has(row?.insuredUuid)
                  ? !removedInsuredUuids.includes(row?.insuredUuid)
                  : selected.includes(row?.insuredUuid)"
                @change="selectService(row?.insuredUuid)"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </template>

            <template #fullName="{ row }">
              <span
                :class="removedInsuredUuids.includes(row?.insuredUuid) ? 'opacity-50 line-through' : ''"
              >
                {{ `${row?.firstName} ${row?.fatherName}` }}
              </span>
            </template>

            <template #idNumber="{ row }">
              <span
                :class="removedInsuredUuids.includes(row?.insuredUuid) ? 'opacity-50 line-through' : ''"
              >
                {{ row?.idNumber }}
              </span>
            </template>

            <template #phone="{ row }">
              <span
                :class="removedInsuredUuids.includes(row?.insuredUuid) ? 'opacity-50 line-through' : ''"
              >
                {{ row?.phone }}
              </span>
            </template>

            <template #dependants="{ row }">
              <div class="space-y-1">
                <div v-if="(row?.dependantResponses || []).length === 0" class="text-xs text-gray-500">No dependants</div>
                <div
                  v-for="dep in (row?.dependantResponses || [])"
                  :key="dep.dependantUuid"
                  class="flex gap-2 items-center"
                  :class="removedDependantUuids.includes(dep.dependantUuid) ? 'opacity-50 line-through' : ''"
                >
                  <input
                    type="checkbox"
                    :disabled="mappedDependantUuidSet.has(dep.dependantUuid)"
                    :checked="mappedDependantUuidSet.has(dep.dependantUuid)
                      ? !removedDependantUuids.includes(dep.dependantUuid)
                      : selectedDependants.includes(dep.dependantUuid)"
                    @change="toggleDependant(dep.dependantUuid)"
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />

                  <span class="text-xs text-gray-700">
                    {{ dep?.firstName }} {{ dep?.fatherName }}
                    <span class="text-gray-500">({{ dep?.relationship }})</span>
                  </span>

                  <button
                    v-if="mappedDependantUuidSet.has(dep.dependantUuid)"
                    type="button"
                    class="p-1.5 ml-auto text-red-600 rounded-md hover:bg-red-50"
                    @click="removeExistingDependant(dep.dependantUuid)"
                    :title="removedDependantUuids.includes(dep.dependantUuid) ? 'Undo remove dependant' : 'Remove dependant'"
                  >
                    <svg v-if="!removedDependantUuids.includes(dep.dependantUuid)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 1018 0 9 9 0 10-18 0zm6.5-2.5H7v-2.5m0 2.5l2.5 2.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>

            <template #actions="{ row }">
              <div class="flex gap-2 justify-end items-center">
                <button
                  v-if="mappedInsuredUuidSet.has(row?.insuredUuid)"
                  type="button"
                  class="p-1.5 text-red-600 rounded-md hover:bg-red-50"
                  @click="removeExistingInsured(row?.insuredUuid)"
                  :title="removedInsuredUuids.includes(row?.insuredUuid) ? 'Undo remove insured' : 'Remove insured'"
                >
                  <svg v-if="!removedInsuredUuids.includes(row?.insuredUuid)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 1018 0 9 9 0 10-18 0zm6.5-2.5H7v-2.5m0 2.5l2.5 2.5" />
                  </svg>
                </button>
              </div>
            </template>

            <template #status="{ row }">
              <span
                :class="removedInsuredUuids.includes(row?.insuredUuid) ? 'opacity-50 line-through' : ''"
              >
                {{ row?.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
              </span>
            </template>
          </Table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="totalItems > itemsPerPage"
          :current-page="currentPage"
          :total-items="totalItems"
          :items-per-page="itemsPerPage"
          @page-change="handlePageChange"
          class="mt-4"
        />

        <!-- Action Buttons -->
        <div class="flex gap-4 justify-end pt-4 border-t border-gray-200">
          <Button
            @click="closeModal()"
            variant="outline"
            class="px-6 py-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>

          <Button
            :pending="api.pending.value"
            :disabled="!hasPendingChanges"
            @click="handleAddMembersToGroup"
            class="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
            <span v-if="selected.length + selectedDependants.length > 0" class="px-2 py-0.5 text-xs font-semibold bg-blue-800 rounded-full">
              +{{ selected.length + selectedDependants.length }}
            </span>
            <span v-if="removedInsuredCount + removedDependantCount > 0" class="px-2 py-0.5 text-xs font-semibold bg-red-600 rounded-full">
              -{{ removedInsuredCount + removedDependantCount }}
            </span>
          </Button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
input[type="checkbox"] {
  transition: all 0.2s ease;
}
.table-container::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

tbody tr:hover {
  background-color: #f8fafc;
}
</style>