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
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      :title="`Assign ${providerName} Services to ${packageName}`"
      subtitle="Select provider services to be eligible under this package"
    >
      <div class="space-y-4">
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

          <div class="flex flex-col gap-3 justify-between items-start mb-4 sm:flex-row sm:items-center">
            <div class="text-sm text-gray-600">
              Page {{ page }} of {{ totalPages }}
              <span v-if="totalElements" class="ml-2 text-gray-400">({{ totalElements }} total)</span>
            </div>
            <div class="flex gap-2 items-center">
              <button
                class="px-3 py-1 text-sm bg-white rounded border border-green-200 disabled:opacity-50"
                :disabled="page === 1 || loadingServices"
                type="button"
                @click="goToPage(page - 1)"
              >
                Prev
              </button>
              <button
                class="px-3 py-1 text-sm bg-white rounded border border-green-200 disabled:opacity-50"
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

          <div v-if="loadingServices" class="flex justify-center py-8">
            <Spinner size="lg" />
          </div>

          <div v-else class="overflow-y-auto max-h-96 rounded-lg border border-green-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="sticky top-0 bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Select</th>
                  <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Service Code</th>
                  <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Service Name</th>
                  <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                  <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Price (ETB)</th>
                  <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="service in filteredServices"
                  :key="service.eligibleServiceUuid"
                  :class="{
                    'bg-green-50': isServiceSelected(service) && service.isExisting,
                    'hover:bg-gray-50': true,
                  }"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      :checked="isServiceSelected(service)"
                      @change="toggleServiceSelection(service)"
                      :disabled="isServiceSelected(service) && service.isExisting"
                      class="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {{ service.itemCode || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {{ service.item || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ service.category || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ service.price?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}
                  </td>
                  <td class="px-6 py-4 text-sm whitespace-nowrap">
                    <div class="flex gap-2 justify-between items-center">
                      <span
                        v-if="isServiceSelected(service) && service.isExisting"
                        class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full"
                      >
                        Already in package
                      </span>
                      <span v-else class="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                        Available
                      </span>

                      <button
                        v-if="isServiceSelected(service) && service.isExisting"
                        @click="removeExistingService(service)"
                        class="p-1.5 text-red-600 rounded-lg transition-colors duration-200 hover:text-red-800 hover:bg-red-50"
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
                  <td colspan="6" class="px-6 py-8 text-sm text-center text-gray-500">
                    No services found matching your search
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-between pt-6 border-t border-gray-200">
          <div></div>

          <div class="flex gap-4">
            <Button @click="closeModal" variant="outline"> Cancel </Button>

            <Button
              @click="submitServices"
              :pending="api.pending.value"
              :disabled="(existingEligibleServiceUuids.length - removedServicesCount) + newServicesCount === 0"
              class="text-white bg-green-500 hover:bg-green-600"
            >
              <span class="flex gap-2 items-center">
                Save Changes
                <span
                  v-if="newServicesCount > 0"
                  class="px-2 py-0.5 text-xs font-semibold bg-blue-600 rounded-full"
                >
                  +{{ newServicesCount }}
                </span>
                <span
                  v-if="removedServicesCount > 0"
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
table {
  border-collapse: separate;
  border-spacing: 0;
}

th {
  position: sticky;
  top: 0;
  z-index: 10;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

* {
  transition: all 0.2s ease-in-out;
}
</style>
