<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Button from "@/components/Button.vue";
import Spinner from "@/components/Spinner.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, computed, watch } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useToast } from "@/toast/store/toast";
import { toasted } from "@/utils/utils";
import { getAllServices } from "@/features/provider_contracts/service/api/serviceApi";
import { addEligibleServices, getEligiblePackage } from "@/features/product_settings/api/coverageApi";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const api = useApiRequest();
const { addToast } = useToast();

const packageUuid = computed(() => props.data?.packageUuid);
const packageName = computed(() => props.data?.packageName || "Package");
const payerProviderContractUuid = computed(() => props.data?.payerProviderContractUuid);
const providerName = computed(() => props.data?.providerName || "Provider");

const pageServices = ref([]);
const existingEligibleServiceUuids = ref([]);
const removedExistingEligibleServiceUuids = ref([]);
const selectedEligibleServiceUuids = ref([]);
const selectAllEligibleServiceUuids = ref([]);
const searchTerm = ref("");
const loadingServices = ref(false);
const selectAll = ref(false);
const selectedCategoryFilter = ref([]);
const showCategoryFilter = ref(false);
const isSubmitting = ref(false);

const page = ref(1);
const limit = ref(50);
const totalElements = ref(0);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((totalElements.value || 0) / (limit.value || 1)))
);

const loadingSelectAll = ref(false);
let searchDebounceTimer = null;

const existingEligibleUuidSet = computed(() => new Set(existingEligibleServiceUuids.value));
const removedExistingEligibleUuidSet = computed(() => new Set(removedExistingEligibleServiceUuids.value));
const selectedEligibleUuidSet = computed(() => new Set(selectedEligibleServiceUuids.value));
const selectAllEligibleUuidSet = computed(() => new Set(selectAllEligibleServiceUuids.value));

async function fetchExistingEligible() {
  if (!payerProviderContractUuid.value || !packageUuid.value) return;
  const existingResponse = await getEligiblePackage(packageUuid.value, payerProviderContractUuid.value);
  const existingUuids = (existingResponse?.data?.packageEligibleServices || [])
    .map((s) => s?.eligibleServiceUuid)
    .filter(Boolean);

  existingEligibleServiceUuids.value = existingUuids;
  removedExistingEligibleServiceUuids.value = [];
  selectedEligibleServiceUuids.value = [];
  selectAllEligibleServiceUuids.value = [];
  selectAll.value = false;
}

async function fetchServicesPage() {
  if (!payerProviderContractUuid.value) return;

  loadingServices.value = true;
  try {
    const servicesResponse = await getAllServices(payerProviderContractUuid.value, {
      search: searchTerm.value || "",
      page: page.value,
      limit: limit.value,
    });

    const content = servicesResponse?.data?.content || [];
    totalElements.value = servicesResponse?.data?.totalElements ?? content.length;

    const existingSet = existingEligibleUuidSet.value;
    pageServices.value = content.map((service) => ({
      ...service,
      isExisting: existingSet.has(service.eligibleServiceUuid),
    }));
  } catch (error) {
    console.error("Error fetching services page:", error);
    toasted(false, "Failed to load services");
  } finally {
    loadingServices.value = false;
  }
}

async function fetchServices() {
  if (!payerProviderContractUuid.value || !packageUuid.value) return;

  try {
    loadingServices.value = true;
    await fetchExistingEligible();
    page.value = 1;
    await fetchServicesPage();
  } catch (error) {
    console.error("Error fetching services:", error);
    toasted(false, "Failed to load services");
  } finally {
    loadingServices.value = false;
  }
}

fetchServices();

const uniqueCategories = computed(() => {
  const categories = new Set();
  pageServices.value.forEach((service) => {
    categories.add(service.category || "Uncategorized");
  });
  return Array.from(categories).sort();
});

const filteredServices = computed(() => {
  let filtered = pageServices.value;

  if (selectedCategoryFilter.value.length > 0) {
    filtered = filtered.filter((service) =>
      selectedCategoryFilter.value.includes(service.category || "Uncategorized")
    );
  }

  return filtered;
});

function isServiceSelected(service) {
  const uuid = service?.eligibleServiceUuid;
  if (!uuid) return false;

  if (service.isExisting) {
    return !removedExistingEligibleUuidSet.value.has(uuid);
  }

  if (selectAll.value) {
    return selectAllEligibleUuidSet.value.has(uuid);
  }

  return selectedEligibleUuidSet.value.has(uuid);
}

function updateSelectAllState() {
  return;
}

function toggleServiceSelection(service) {
  const uuid = service?.eligibleServiceUuid;
  if (!uuid) return;
  if (service.isExisting) return;

  if (selectAll.value) {
    const idx = selectAllEligibleServiceUuids.value.indexOf(uuid);
    if (idx > -1) {
      selectAllEligibleServiceUuids.value.splice(idx, 1);
    } else {
      selectAllEligibleServiceUuids.value.push(uuid);
    }
  } else {
    const idx = selectedEligibleServiceUuids.value.indexOf(uuid);
    if (idx > -1) {
      selectedEligibleServiceUuids.value.splice(idx, 1);
    } else {
      selectedEligibleServiceUuids.value.push(uuid);
    }
  }
}

async function toggleSelectAll() {
  if (!payerProviderContractUuid.value) return;

  if (!selectAll.value) {
    selectAllEligibleServiceUuids.value = [];
    selectedEligibleServiceUuids.value = [];
    return;
  }

  loadingSelectAll.value = true;
  try {
    const existingSet = existingEligibleUuidSet.value;
    const selectedCats = new Set(selectedCategoryFilter.value);
    const useCats = selectedCats.size > 0;

    const uuids = [];
    let currentPage = 1;
    const fetchLimit = 1000;

    while (true) {
      const res = await getAllServices(payerProviderContractUuid.value, {
        search: searchTerm.value || "",
        page: currentPage,
        limit: fetchLimit,
      });

      const content = res?.data?.content || [];
      if (!content.length) break;

      for (const s of content) {
        const uuid = s?.eligibleServiceUuid;
        if (!uuid) continue;
        if (existingSet.has(uuid)) continue;
        if (useCats && !selectedCats.has(s?.category || "Uncategorized")) continue;
        uuids.push(uuid);
      }

      const isLastPage = (res?.data?.last === true) || (res?.data?.totalPages != null && currentPage >= res.data.totalPages);
      if (isLastPage) break;
      currentPage += 1;
    }

    selectAllEligibleServiceUuids.value = uuids;
    selectedEligibleServiceUuids.value = [];
  } catch (error) {
    console.error("Error selecting all services:", error);
    toasted(false, "Failed to select all services");
    selectAll.value = false;
  } finally {
    loadingSelectAll.value = false;
  }
}

async function removeExistingService(service) {
  try {
    const uuid = service?.eligibleServiceUuid;
    if (!uuid) return;

    const idx = removedExistingEligibleServiceUuids.value.indexOf(uuid);
    if (idx > -1) {
      removedExistingEligibleServiceUuids.value.splice(idx, 1);
    } else {
      removedExistingEligibleServiceUuids.value.push(uuid);
    }

    addToast({
      type: "success",
      title: "Service Removed",
      message: idx > -1
        ? `"${service.item}" removal has been undone`
        : `"${service.item}" has been marked for removal from the package`,
    });
  } catch (error) {
    console.error("Error removing service:", error);
    addToast({
      type: "error",
      title: "Error",
      message: "Failed to remove service",
    });
  }
}

const newServicesCount = computed(() => {
  const s = new Set();
  for (const uuid of selectedEligibleServiceUuids.value) {
    s.add(uuid);
  }
  for (const uuid of selectAllEligibleServiceUuids.value) {
    s.add(uuid);
  }
  return s.size;
});

const removedServicesCount = computed(() => {
  return removedExistingEligibleServiceUuids.value.length;
});

watch([selectedCategoryFilter], () => {
  if (selectAll.value) {
    selectAll.value = false;
    selectAllEligibleServiceUuids.value = [];
  }
});

watch(searchTerm, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    page.value = 1;
    if (selectAll.value) {
      selectAll.value = false;
      selectAllEligibleServiceUuids.value = [];
    }
    await fetchServicesPage();
  }, 400);
});

async function goToPage(newPage) {
  const maxPage = Math.max(1, totalPages.value);
  const next = Math.min(Math.max(1, newPage), maxPage);
  if (next === page.value) return;
  page.value = next;
  await fetchServicesPage();
}

async function changeLimit(newLimit) {
  limit.value = Number(newLimit) || 50;
  page.value = 1;
  await fetchServicesPage();
}

async function submitServices() {
  isSubmitting.value = true;
  
  try {
    if (!packageUuid.value) {
      addToast({
        type: "error",
        title: "Error",
        message: "Package UUID is missing",
      });
      return;
    }

    const allSelectedUuids = new Set();

    for (const uuid of existingEligibleServiceUuids.value) {
      if (!removedExistingEligibleUuidSet.value.has(uuid)) {
        allSelectedUuids.add(uuid);
      }
    }

    for (const uuid of selectedEligibleServiceUuids.value) {
      allSelectedUuids.add(uuid);
    }

    for (const uuid of selectAllEligibleServiceUuids.value) {
      allSelectedUuids.add(uuid);
    }

    const allSelectedUuidsArray = Array.from(allSelectedUuids);

    if (allSelectedUuidsArray.length === 0) {
      addToast({
        type: "info",
        title: "No Services",
        message: "No services selected",
      });
      closeModal();
      return;
    }

    const payload = {
      eligibleServiceUuids: allSelectedUuidsArray,
    };

    const response = await addEligibleServices(packageUuid.value, payload);
    
    const backendMessage = response?.data?.message || response?.message;

    if (response?.success !== false) {
      toasted(
        true,
        backendMessage ||
          `${allSelectedUuidsArray.length} service(s) updated for package (${newServicesCount.value} new services added)`
      );
      closeModal(true);
    } else {
      throw new Error(backendMessage || "Failed to update services");
    }
  } catch (error) {
    console.error("Error updating services:", error);
    toasted(false, error?.message || "Failed to update services for package");
  } finally {
    isSubmitting.value = false;
  }
}

const isSaveDisabled = computed(() => {
  return (existingEligibleServiceUuids.value.length - removedServicesCount.value) + newServicesCount.value === 0;
});
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xmd"
      :title="`Assign ${providerName} Services to ${packageName}`"
      subtitle="Select provider services to be eligible under this package"
    >
      <div class="modal-content-wrapper">
        <!-- Scrollable Content Area -->
        <div class="scrollable-content">
          <div class="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div class="flex gap-3 items-center mb-4">
              <div class="flex w-10 h-10 bg-green-500 rounded-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800">Select Services</h3>
                <p class="text-sm text-gray-600">Choose services to add/remove from this package</p>
              </div>
            </div>

            <!-- Search and Category Selection -->
            <div class="flex flex-col gap-4 mb-4 md:flex-row md:items-start">
              <div class="relative flex-1">
                <Input
                  v-model="searchTerm"
                  placeholder="Search services by name, code, or category..."
                  :attributes="{ class: 'pl-10 h-9 w-full bg-white border-green-200 focus:border-green-400' }"
                />
                <div class="absolute top-2.5 left-3 text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div class="flex-1">
                <div class="flex flex-col gap-2">
                  <button
                    @click="showCategoryFilter = !showCategoryFilter"
                    class="flex justify-between items-center px-4 h-10 text-sm font-medium text-gray-700 bg-white rounded-lg border border-green-200 transition-colors duration-200 hover:bg-green-50"
                    type="button"
                  >
                    <span class="flex gap-2 items-center">
                      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter by Categories
                      <span
                        v-if="selectedCategoryFilter.length > 0"
                        class="px-2 py-0.5 text-xs font-semibold text-white bg-green-600 rounded-full"
                      >
                        {{ selectedCategoryFilter.length }}
                      </span>
                    </span>
                    <svg
                      class="w-5 h-5 text-gray-400 transition-transform duration-200"
                      :class="{ 'rotate-180': showCategoryFilter }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 transform scale-95"
                    enter-to-class="opacity-100 transform scale-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 transform scale-100"
                    leave-to-class="opacity-0 transform scale-95"
                  >
                    <div
                      v-if="showCategoryFilter"
                      class="flex flex-wrap gap-3 p-3 bg-white border border-green-200 rounded-lg shadow-lg max-h-[120px] overflow-y-auto"
                    >
                      <label
                        v-for="category in uniqueCategories"
                        :key="category"
                        class="flex gap-2 items-center px-3 py-1.5 bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer hover:bg-green-50"
                      >
                        <input
                          type="checkbox"
                          :value="category"
                          v-model="selectedCategoryFilter"
                          class="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                          @change="updateSelectAllState"
                        />
                        <span class="text-sm text-gray-700">{{ category || 'Uncategorized' }}</span>
                      </label>
                    </div>
                  </transition>
                </div>
              </div>
            </div>

            <!-- Select All -->
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="selectAll"
                  v-model="selectAll"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <label for="selectAll" class="ml-2 text-sm font-medium text-gray-700">
                  Select All Available Services
                </label>
              </div>
              <div class="text-sm text-gray-500">
                <span v-if="loadingSelectAll">Loading...</span>
                <span v-else>{{ newServicesCount }} new services selected</span>
              </div>
            </div>

            <!-- Pagination -->
            <div class="flex flex-col gap-3 justify-between items-start mb-4 sm:flex-row sm:items-center">
              <div class="text-sm text-gray-600">
                Page {{ page }} of {{ totalPages }}
                <span v-if="totalElements" class="ml-2 text-gray-400">({{ totalElements }} total)</span>
              </div>
              <div class="flex gap-2 items-center">
                <button
                  class="px-3 py-1 text-sm bg-white rounded border border-green-200 disabled:opacity-50 hover:bg-gray-50"
                  :disabled="page === 1 || loadingServices"
                  type="button"
                  @click="goToPage(page - 1)"
                >
                  Prev
                </button>
                <button
                  class="px-3 py-1 text-sm bg-white rounded border border-green-200 disabled:opacity-50 hover:bg-gray-50"
                  :disabled="page >= totalPages || loadingServices"
                  type="button"
                  @click="goToPage(page + 1)"
                >
                  Next
                </button>
                <select
                  class="px-2 py-1 text-sm bg-white rounded border border-green-200"
                  :value="limit"
                  @change="changeLimit($event.target.value)"
                >
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
            </div>

            <!-- Services Table -->
            <div v-if="loadingServices" class="flex justify-center py-8">
              <Spinner size="lg" />
            </div>

            <div v-else class="table-container">
              <table class="services-table">
                <thead>
                  <tr>
                    <th class="col-select">Select</th>
                    <th class="col-code">Service Code</th>
                    <th class="col-name">Service Name</th>
                    <th class="col-category">Category</th>
                    <th class="col-price">Price (ETB)</th>
                    <th class="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="service in filteredServices"
                    :key="service.eligibleServiceUuid"
                    :class="{
                      'bg-green-50': isServiceSelected(service) && service.isExisting,
                      'hover:bg-gray-50': true,
                    }"
                  >
                    <td class="col-select">
                      <input
                        type="checkbox"
                        :checked="isServiceSelected(service)"
                        @change="toggleServiceSelection(service)"
                        :disabled="isServiceSelected(service) && service.isExisting"
                        class="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                    </td>
                    <td class="col-code">
                      <span class="text-sm font-medium text-gray-900">
                        {{ service.itemCode || 'N/A' }}
                      </span>
                    </td>
                    <td class="col-name">
                      <div class="service-name">
                        {{ service.item || 'N/A' }}
                      </div>
                    </td>
                    <td class="col-category">
                      <span class="text-sm text-gray-500">
                        {{ service.category || 'N/A' }}
                      </span>
                    </td>
                    <td class="col-price">
                      <span class="text-sm text-gray-500">
                        {{ service.price?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}
                      </span>
                    </td>
                    <td class="col-status">
                      <div class="status-wrapper">
                        <span
                          v-if="isServiceSelected(service) && service.isExisting"
                          class="status-badge status-existing"
                        >
                          Already in package
                        </span>
                        <span v-else class="status-badge status-available">
                          Available
                        </span>

                        <button
                          v-if="isServiceSelected(service) && service.isExisting"
                          @click="removeExistingService(service)"
                          class="remove-btn"
                          title="Remove from package"
                          type="button"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredServices.length === 0">
                    <td colspan="6" class="empty-state">
                      No services found matching your search
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Fixed Action Buttons -->
        <div class="action-buttons">
          <div class="flex justify-end gap-4">
            <Button 
              @click="closeModal" 
              variant="outline"
              :disabled="isSubmitting"
            >
              Cancel
            </Button>

            <Button
              @click="submitServices"
              :pending="isSubmitting"
              :disabled="isSaveDisabled || isSubmitting"
              class="text-white bg-green-500 hover:bg-green-600"
            >
              <span class="flex gap-2 items-center">
                <svg
                  v-if="isSubmitting"
                  class="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span v-if="isSubmitting">Saving...</span>
                <span v-else>Save Changes</span>
                <span
                  v-if="!isSubmitting && newServicesCount > 0"
                  class="px-2 py-0.5 text-xs font-semibold bg-blue-600 rounded-full"
                >
                  +{{ newServicesCount }}
                </span>
                <span
                  v-if="!isSubmitting && removedServicesCount > 0"
                  class="px-2 py-0.5 text-xs font-semibold bg-red-600 rounded-full"
                >
                  -{{ removedServicesCount }}
                </span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
/* ============================================
   MODAL OVERRIDES
   ============================================ */
   
:deep(.modal-content) {
  max-width: 75rem !important;
  width: 100%;
}

:deep(.modal-overlay) {
  overflow: hidden;
}

:deep(.modal-container) {
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ============================================
   CONTENT WRAPPER
   ============================================ */
   
.modal-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(90vh - 100px);
}

/* ============================================
   SCROLLABLE CONTENT
   ============================================ */
   
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-bottom: 1rem;
}

/* Scrollbar styles for scrollable-content */
.scrollable-content::-webkit-scrollbar {
  width: 8px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Firefox scrollbar for scrollable-content */
.scrollable-content {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* ============================================
   FIXED ACTION BUTTONS
   ============================================ */
   
.action-buttons {
  flex-shrink: 0;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  position: sticky;
  bottom: 0;
  z-index: 20;
}

/* ============================================
   TABLE CONTAINER - WITH BOTH SCROLLBARS
   ============================================ */
   
.table-container {
  overflow: auto;
  max-height: 450px;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  position: relative;
}

/* Scrollbar styles for table container */
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Firefox scrollbar for table container */
.table-container {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* ============================================
   TABLE STYLES
   ============================================ */
   
.services-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 850px;
}

/* ============================================
   COLUMN WIDTHS
   ============================================ */
   
.col-select {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  padding: 1rem 0.5rem;
  text-align: center;
  vertical-align: middle;
}

.col-code {
  width: 130px;
  min-width: 130px;
  max-width: 130px;
  padding: 1rem 0.75rem;
  vertical-align: middle;
}

.col-name {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  padding: 1rem 0.75rem;
  vertical-align: middle;
}

.col-category {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
  padding: 1rem 0.75rem;
  vertical-align: middle;
}

.col-price {
  width: 110px;
  min-width: 110px;
  max-width: 110px;
  padding: 1rem 0.75rem;
  vertical-align: middle;
}

.col-status {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  padding: 1rem 0.75rem;
  vertical-align: middle;
}

/* ============================================
   TABLE HEADER
   ============================================ */
   
.services-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f9fafb;
}

.services-table thead th {
  padding: 0.75rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  border-bottom: 2px solid #e5e7eb;
  text-align: left;
  background: #f9fafb;
}

/* ============================================
   TABLE BODY
   ============================================ */
   
.services-table tbody tr {
  transition: background-color 0.15s ease;
}

.services-table tbody tr:hover {
  background-color: #f9fafb;
}

.services-table tbody tr.bg-green-50:hover {
  background-color: #d1fae5;
}

.services-table tbody tr:last-child td {
  border-bottom: none;
}

/* ============================================
   SERVICE NAME
   ============================================ */
   
.service-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  word-break: break-word;
  line-height: 1.25;
}

/* ============================================
   STATUS BADGES
   ============================================ */
   
.status-wrapper {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-existing {
  background-color: #d1fae5;
  color: #065f46;
}

.status-available {
  background-color: #dbeafe;
  color: #1e40af;
}

/* ============================================
   REMOVE BUTTON
   ============================================ */
   
.remove-btn {
  padding: 0.375rem;
  color: #dc2626;
  border-radius: 0.5rem;
  transition: all 0.2s;
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  color: #991b1b;
  background-color: #fee2e2;
}

.remove-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px #dc2626;
}

.remove-btn:active {
  transform: scale(0.95);
}

/* ============================================
   CHECKBOX STYLES
   ============================================ */
   
.col-select input[type="checkbox"] {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.col-select input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* ============================================
   EMPTY STATE
   ============================================ */
   
.empty-state {
  padding: 2rem 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

/* ============================================
   ANIMATIONS
   ============================================ */
   
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* ============================================
   RESPONSIVE STYLES
   ============================================ */
   
@media (max-width: 1024px) {
  .col-name {
    width: 150px;
    min-width: 150px;
    max-width: 150px;
  }
  
  .col-category {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
  }
  
  .col-status {
    width: 170px;
    min-width: 170px;
    max-width: 170px;
  }
  
  .services-table {
    min-width: 750px;
  }
}

@media (max-width: 768px) {
  .col-select {
    width: 50px;
    min-width: 50px;
    max-width: 50px;
    padding: 0.5rem 0.25rem;
  }
  
  .col-code {
    width: 90px;
    min-width: 90px;
    max-width: 90px;
    padding: 0.5rem 0.25rem;
  }
  
  .col-name {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
    padding: 0.5rem 0.25rem;
  }
  
  .col-category {
    width: 100px;
    min-width: 100px;
    max-width: 100px;
    padding: 0.5rem 0.25rem;
  }
  
  .col-price {
    width: 80px;
    min-width: 80px;
    max-width: 80px;
    padding: 0.5rem 0.25rem;
  }
  
  .col-status {
    width: 150px;
    min-width: 150px;
    max-width: 150px;
    padding: 0.5rem 0.25rem;
  }
  
  .services-table {
    min-width: 590px;
  }
  
  .table-container {
    max-height: 300px;
  }
  
  .service-name {
    font-size: 0.75rem;
  }
  
  .status-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
  }
}

@media (max-width: 480px) {
  .col-select {
    width: 40px;
    min-width: 40px;
    max-width: 40px;
    padding: 0.375rem 0.125rem;
  }
  
  .col-code {
    width: 70px;
    min-width: 70px;
    max-width: 70px;
    padding: 0.375rem 0.125rem;
  }
  
  .col-name {
    width: 100px;
    min-width: 100px;
    max-width: 100px;
    padding: 0.375rem 0.125rem;
  }
  
  .col-category {
    width: 80px;
    min-width: 80px;
    max-width: 80px;
    padding: 0.375rem 0.125rem;
  }
  
  .col-price {
    width: 65px;
    min-width: 65px;
    max-width: 65px;
    padding: 0.375rem 0.125rem;
  }
  
  .col-status {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
    padding: 0.375rem 0.125rem;
  }
  
  .services-table {
    min-width: 475px;
  }
  
  .table-container {
    max-height: 250px;
  }
  
  .services-table thead th {
    font-size: 0.5rem;
    padding: 0.5rem 0.25rem;
  }
}

/* ============================================
   TRANSITIONS
   ============================================ */
   
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* ============================================
   Z-INDEX LAYERS
   ============================================ */
   
.z-10 {
  z-index: 10;
}

.z-20 {
  z-index: 20;
}
</style>