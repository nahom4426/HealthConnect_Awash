<template>
  <ModalParent>
    <NewFormParent
      size="xl"
      title="Add & Update Contract Services"
      subtitle="Search master services, add new available services, or update negotiated prices for existing contract services."
    >
      <div class="space-y-4">
        <!-- Top Toolbar: Search, Filter, Discount -->
        <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <!-- Search input -->
            <div class="relative flex-1">
              <Input
                v-model="searchTerm"
                placeholder="Search master services by name, code, or category..."
                :attributes="{ class: 'pl-10 w-full bg-white border-gray-200 focus:border-[#02676B] focus:ring-1 focus:ring-[#02676B] rounded-lg text-sm' }"
              />
              <div class="absolute top-2.5 left-3 text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>

            <!-- Filter Tabs -->
            <div class="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 text-xs font-medium">
              <button
                type="button"
                @click="filterMode = 'all'"
                class="px-3 py-1.5 rounded-md transition-colors"
                :class="filterMode === 'all' ? 'bg-[#02676B] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'"
              >
                All ({{ totalMasterCount }})
              </button>
              <button
                type="button"
                @click="filterMode = 'available'"
                class="px-3 py-1.5 rounded-md transition-colors"
                :class="filterMode === 'available' ? 'bg-[#02676B] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'"
              >
                Available ({{ totalAvailableCount }})
              </button>
              <button
                type="button"
                @click="filterMode = 'mapped'"
                class="px-3 py-1.5 rounded-md transition-colors"
                :class="filterMode === 'mapped' ? 'bg-[#02676B] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'"
              >
                Already Mapped ({{ totalMappedCount }})
              </button>
            </div>

            <!-- Global Discount % -->
            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              <span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Bulk Discount</span>
              <div class="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  v-model.number="discountPercent"
                  @input="onDiscountChanged"
                  placeholder="0"
                  class="w-16 px-2 py-1 text-sm font-semibold text-right rounded border border-gray-300 focus:border-[#02676B] focus:outline-none"
                />
                <span class="ml-1 text-xs text-gray-500">%</span>
              </div>
            </div>
          </div>

          <!-- Selection status bar & page select all -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-200/60 text-xs">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  :checked="isCurrentPageAvailableSelected"
                  @change="toggleSelectAvailableCurrentPage"
                  class="h-4 w-4 text-[#02676B] focus:ring-[#02676B] border-gray-300 rounded cursor-pointer"
                />
                <span>Select all available on this page ({{ currentPageAvailableCount }})</span>
              </label>

              <button
                v-if="selectedMap.size > 0"
                @click="clearAllSelections"
                class="text-red-600 hover:text-red-800 font-medium hover:underline"
              >
                Clear all {{ selectedMap.size }} selected
              </button>
            </div>

            <div class="text-gray-500 font-medium">
              Showing {{ displayPageServices.length }} items on page {{ page }} of {{ totalPages }} ({{ filteredMasterServices.length.toLocaleString() }} total matching)
            </div>
          </div>
        </div>

        <!-- Info Banner -->
        <div class="px-3.5 py-2 text-xs text-teal-900 bg-teal-50 rounded-lg border border-teal-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Loaded <strong>{{ totalMasterCount.toLocaleString() }}</strong> master services (<strong>{{ totalAvailableCount.toLocaleString() }}</strong> available to add).
              <strong>Available</strong> services appear first on Page 1.
            </span>
          </div>
        </div>

        <!-- Table Container -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 bg-white rounded-xl border">
          <Spinner size="lg" />
          <span class="mt-3 text-sm font-medium text-gray-500">Loading master catalog...</span>
        </div>
        <div v-else class="overflow-x-auto max-h-[50vh] border rounded-xl shadow-sm bg-white">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th class="w-12 px-4 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase border-b">Select</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase border-b">Status</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase border-b">Code</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase border-b">Name</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase border-b">Category</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase border-b">Sub Category</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase border-b">Base Price (ETB)</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase border-b">Negotiated Price (ETB)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr
                v-for="svc in displayPageServices"
                :key="svcKey(svc)"
                class="transition-colors duration-150"
                :class="{
                  'bg-teal-50/50 hover:bg-teal-50/80': isSelected(svc),
                  'bg-gray-50/60': svc.isExisting && !isSelected(svc),
                  'hover:bg-gray-50': !svc.isExisting && !isSelected(svc)
                }"
              >
                <!-- Select Checkbox -->
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="isSelected(svc)"
                    @change="toggleOne(svc)"
                    class="h-4 w-4 text-[#02676B] focus:ring-[#02676B] border-gray-300 rounded cursor-pointer"
                  />
                </td>

                <!-- Status Badge -->
                <td class="px-4 py-3 text-xs whitespace-nowrap">
                  <span
                    v-if="svc.isExisting"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200/60"
                  >
                    <svg class="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Already in Contract
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/60"
                  >
                    <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                    </svg>
                    Available
                  </span>
                </td>

                <!-- Code -->
                <td class="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {{ svc.itemCode || 'N/A' }}
                </td>

                <!-- Name -->
                <td class="px-4 py-3 text-sm text-gray-900 font-medium">
                  {{ svc.item || 'N/A' }}
                </td>

                <!-- Category -->
                <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {{ svc.category || 'N/A' }}
                  </span>
                </td>

                <!-- Sub Category -->
                <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {{ svc.subCategory || 'N/A' }}
                </td>

                <!-- Base Price -->
                <td class="px-4 py-3 text-sm font-mono text-right text-gray-600 whitespace-nowrap">
                  {{ Number(svc.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </td>

                <!-- Negotiated Price Input -->
                <td class="px-4 py-3 text-sm text-right whitespace-nowrap">
                  <div class="flex justify-end items-center">
                    <input
                      type="number"
                      :value="getEditedPrice(svc)"
                      :disabled="!isSelected(svc)"
                      min="0"
                      step="0.01"
                      @input="onEditPrice(svc, $event.target.value)"
                      class="px-2 py-1 w-28 text-right font-mono text-sm rounded border border-gray-300 focus:border-[#02676B] focus:ring-1 focus:ring-[#02676B] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 transition-colors"
                    />
                  </div>
                </td>
              </tr>

              <tr v-if="displayPageServices.length === 0">
                <td colspan="8" class="px-4 py-12 text-sm text-center text-gray-500">
                  <div class="flex flex-col items-center justify-center space-y-2">
                    <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span>No services found matching your criteria</span>
                    <span v-if="searchTerm" class="text-xs text-gray-400">Try adjusting your search query</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div class="text-xs text-gray-600">
            Page <span class="font-semibold text-gray-900">{{ page }}</span> of <span class="font-semibold text-gray-900">{{ totalPages }}</span>
            <span class="ml-2 text-gray-400">({{ filteredMasterServices.length.toLocaleString() }} total matching master services)</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              :disabled="page <= 1 || loading"
              @click="goToPage(page - 1)"
            >
              Previous
            </button>

            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              :disabled="page >= totalPages || loading"
              @click="goToPage(page + 1)"
            >
              Next
            </button>

            <select
              class="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 focus:border-[#02676B] focus:outline-none"
              :value="limit"
              @change="changeLimit($event.target.value)"
              :disabled="loading"
            >
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
            </select>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
          <div class="text-sm font-medium text-gray-700 flex items-center gap-3">
            <span>Selected: <span class="px-2 py-0.5 rounded-full bg-teal-100 text-[#02676B] font-bold text-xs">{{ selectedMap.size }}</span></span>
            <span v-if="newServicesCount > 0" class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">+{{ newServicesCount }} New</span>
            <span v-if="updateServicesCount > 0" class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">{{ updateServicesCount }} Update</span>
          </div>

          <div class="flex gap-3">
            <Button @click="closeModal" variant="outline">Cancel</Button>
            <Button
              :pending="api.pending.value || isSubmitting"
              :disabled="selectedMap.size === 0 || isSubmitting"
              class="bg-[#02676B] hover:bg-[#01585B] text-white transition-colors"
              @click="submit"
            >
              Save {{ selectedMap.size }} Service(s)
            </Button>
          </div>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>

<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Button from "@/components/Button.vue";
import Spinner from "@/components/Spinner.vue";
import { ref, computed, watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal, openModal } from "@customizer/modal-x";
import { searchAllService, getAllServices, addEligibleService, updateService } from "../api/serviceApi";
import { useServiceListStore } from "../store/serviceListStore";

const authStore = useAuthStore();
const route = useRoute();
const api = useApiRequest();
const serviceListStore = useServiceListStore();

// State
const loading = ref(true);
const isSubmitting = ref(false);
const searchTerm = ref("");
const filterMode = ref("all"); // 'all', 'available', 'mapped'
const page = ref(1);
const limit = ref(25);

const allRawMasterServices = ref([]);
const existingServicesMap = ref(new Map());

// Selection state across pages: key -> service object
const selectedMap = ref(new Map());
// Edited prices across pages: key -> edited price
const editedPricesMap = ref(new Map());
// Base prices across pages: key -> base price
const basePricesMap = ref(new Map());

const discountPercent = ref(0);

const providerUuid = computed(() => route.params.providerUuid || authStore.auth?.user?.providerUuid);
const contractId = computed(() => route.params.id || "");

function getLookupKeys(svc) {
  const keys = [];
  if (svc.eligibleServiceUuid) keys.push(String(svc.eligibleServiceUuid).trim());
  if (svc.serviceUuid) keys.push(String(svc.serviceUuid).trim());
  if (svc.itemCode || svc.serviceCode) keys.push(String(svc.itemCode || svc.serviceCode).trim().toLowerCase());
  if (svc.item || svc.serviceName) keys.push(String(svc.item || svc.serviceName).trim().toLowerCase());
  return keys;
}

function svcKey(svc) {
  if (!svc) return "";
  return (
    svc.eligibleServiceUuid ||
    svc.serviceUuid ||
    svc.generatedServiceId ||
    svc.serviceId ||
    svc.itemCode ||
    `${svc.item || ""}|${svc.category || ""}`
  );
}

// 1. Decorate all master services with isExisting status
const allDecoratedMasterServices = computed(() => {
  const map = existingServicesMap.value;
  return allRawMasterServices.value.map(s => {
    const keys = getLookupKeys(s);
    let matchedExisting = null;
    for (const k of keys) {
      if (map.has(k)) {
        matchedExisting = map.get(k);
        break;
      }
    }
    return {
      ...s,
      isExisting: !!matchedExisting,
      existingContractService: matchedExisting,
    };
  });
});

// 2. Partition and sort globally: AVAILABLE first, ALREADY MAPPED second
const allSortedMasterServices = computed(() => {
  const list = [...allDecoratedMasterServices.value];
  const availableList = list.filter(s => !s.isExisting);
  const mappedList = list.filter(s => s.isExisting);
  return [...availableList, ...mappedList];
});

// 3. Filter by search term and filter tab
const filteredMasterServices = computed(() => {
  let list = allSortedMasterServices.value;

  // Filter mode
  if (filterMode.value === "available") {
    list = list.filter(s => !s.isExisting);
  } else if (filterMode.value === "mapped") {
    list = list.filter(s => s.isExisting);
  }

  // Search term
  const term = (searchTerm.value || "").trim().toLowerCase();
  if (term) {
    list = list.filter(s => {
      const code = String(s.itemCode || s.serviceCode || "").toLowerCase();
      const name = String(s.item || s.serviceName || "").toLowerCase();
      const cat = String(s.category || s.serviceCategory || "").toLowerCase();
      const subCat = String(s.subCategory || s.serviceSubCategory || "").toLowerCase();
      return code.includes(term) || name.includes(term) || cat.includes(term) || subCat.includes(term);
    });
  }

  return list;
});

// Pagination calculations
const totalPages = computed(() => Math.max(1, Math.ceil((filteredMasterServices.value.length || 0) / limit.value)));

const displayPageServices = computed(() => {
  const start = (page.value - 1) * limit.value;
  return filteredMasterServices.value.slice(start, start + limit.value);
});

// Summary Counts
const totalMasterCount = computed(() => allDecoratedMasterServices.value.length);
const totalAvailableCount = computed(() => allDecoratedMasterServices.value.filter(s => !s.isExisting).length);
const totalMappedCount = computed(() => allDecoratedMasterServices.value.filter(s => s.isExisting).length);
const currentPageAvailableCount = computed(() => displayPageServices.value.filter(s => !s.isExisting).length);

const isCurrentPageAvailableSelected = computed(() => {
  const availables = displayPageServices.value.filter(s => !s.isExisting);
  if (!availables.length) return false;
  return availables.every(s => selectedMap.value.has(svcKey(s)));
});

const newServicesCount = computed(() => {
  let count = 0;
  selectedMap.value.forEach((svc) => {
    if (!svc.isExisting) count++;
  });
  return count;
});

const updateServicesCount = computed(() => {
  let count = 0;
  selectedMap.value.forEach((svc) => {
    if (svc.isExisting) count++;
  });
  return count;
});

function isSelected(svc) {
  return selectedMap.value.has(svcKey(svc));
}

function getEditedPrice(svc) {
  const key = svcKey(svc);
  if (editedPricesMap.value.has(key)) {
    return editedPricesMap.value.get(key);
  }
  if (svc.isExisting && svc.existingContractService?.price != null) {
    return Number(svc.existingContractService.price);
  }
  return Number(svc.price ?? 0);
}

function toggleOne(svc) {
  const key = svcKey(svc);
  if (selectedMap.value.has(key)) {
    selectedMap.value.delete(key);
    editedPricesMap.value.delete(key);
    basePricesMap.value.delete(key);
  } else {
    const base = svc.isExisting && svc.existingContractService?.price != null
      ? Number(svc.existingContractService.price)
      : Number(svc.price ?? svc.negotiatedPrice ?? 0);

    selectedMap.value.set(key, svc);
    basePricesMap.value.set(key, base);

    const priceToSet = discountPercent.value > 0 ? applyDiscount(base, discountPercent.value) : base;
    editedPricesMap.value.set(key, priceToSet);
  }
}

function toggleSelectAvailableCurrentPage() {
  const availables = displayPageServices.value.filter(s => !s.isExisting);
  if (isCurrentPageAvailableSelected.value) {
    availables.forEach(s => {
      const key = svcKey(s);
      selectedMap.value.delete(key);
      editedPricesMap.value.delete(key);
      basePricesMap.value.delete(key);
    });
  } else {
    availables.forEach(s => {
      const key = svcKey(s);
      if (!selectedMap.value.has(key)) {
        const base = Number(s.price ?? s.negotiatedPrice ?? 0);
        selectedMap.value.set(key, s);
        basePricesMap.value.set(key, base);
        const priceToSet = discountPercent.value > 0 ? applyDiscount(base, discountPercent.value) : base;
        editedPricesMap.value.set(key, priceToSet);
      }
    });
  }
}

function clearAllSelections() {
  selectedMap.value.clear();
  editedPricesMap.value.clear();
  basePricesMap.value.clear();
}

function onEditPrice(svc, val) {
  const key = svcKey(svc);
  const num = Number(val ?? 0);
  const price = isFinite(num) && num >= 0 ? num : 0;
  editedPricesMap.value.set(key, price);
  if (!selectedMap.value.has(key)) {
    selectedMap.value.set(key, svc);
  }
}

function applyDiscount(amount, percent) {
  const p = Number(percent) || 0;
  const a = Number(amount) || 0;
  return Math.max(0, +(a * (1 - p / 100)).toFixed(2));
}

function onDiscountChanged() {
  selectedMap.value.forEach((svc, key) => {
    const base = basePricesMap.value.get(key) ?? Number(svc.price ?? 0);
    editedPricesMap.value.set(key, applyDiscount(base, discountPercent.value));
  });
}

// Watchers for instant reset
watch([searchTerm, filterMode], () => {
  page.value = 1;
});

// Fetch all existing contract services into lookup map
async function loadExistingContractServices() {
  if (!contractId.value) return;
  const map = new Map();
  try {
    let currentPage = 1;
    const fetchLimit = 1000;
    while (true) {
      const res = await getAllServices(contractId.value, { page: currentPage, limit: fetchLimit });
      const data = res?.data || res;
      const content = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
      if (!content.length) break;

      for (const s of content) {
        if (s.itemCode) map.set(String(s.itemCode).trim().toLowerCase(), s);
        if (s.item) map.set(String(s.item).trim().toLowerCase(), s);
        if (s.eligibleServiceUuid) map.set(String(s.eligibleServiceUuid).trim(), s);
        if (s.serviceUuid) map.set(String(s.serviceUuid).trim(), s);
      }

      const isLast = data?.last === true || (data?.totalPages != null && currentPage >= data.totalPages) || content.length < fetchLimit;
      if (isLast) break;
      currentPage += 1;
    }
  } catch (e) {
    console.error("Error fetching existing contract services:", e);
  }
  existingServicesMap.value = map;
}

// Batch fetch ALL master services for complete sorting & instant searching
async function fetchAllMasterServices() {
  if (!providerUuid.value) {
    toasted(false, "", "Provider ID not found");
    loading.value = false;
    return;
  }
  try {
    loading.value = true;
    const allItems = [];
    let currentPage = 1;
    const batchLimit = 1000;

    while (true) {
      const res = await searchAllService(providerUuid.value, {
        page: currentPage,
        limit: batchLimit,
      });

      const dataContainer = res?.data || res;
      const rawContent = Array.isArray(dataContainer?.content)
        ? dataContainer.content
        : Array.isArray(dataContainer)
        ? dataContainer
        : [];

      if (!rawContent.length) break;

      const normalized = rawContent.map(s => ({
        ...s,
        itemCode: s.itemCode || s.serviceCode,
        item: s.item || s.serviceName,
        category: s.category || s.serviceCategory,
        subCategory: s.subCategory || s.serviceSubCategory,
        description: s.description,
        itemID: s.itemID || s.generatedServiceId,
      }));

      allItems.push(...normalized);

      const isLast = dataContainer?.last === true || (dataContainer?.totalPages != null && currentPage >= dataContainer.totalPages) || rawContent.length < batchLimit;
      if (isLast) break;
      currentPage += 1;
    }

    allRawMasterServices.value = allItems;
  } catch (e) {
    console.error("Error loading master services", e);
    toasted(false, "", "Failed to load master services");
  } finally {
    loading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  await loadExistingContractServices();
  await fetchAllMasterServices();
}

function goToPage(newPage) {
  const maxPage = Math.max(1, totalPages.value);
  const next = Math.min(Math.max(1, newPage), maxPage);
  if (next === page.value) return;
  page.value = next;
}

function changeLimit(newLimit) {
  limit.value = Number(newLimit) || 25;
  page.value = 1;
}

async function submit() {
  const selectedEntries = Array.from(selectedMap.value.entries());
  if (selectedEntries.length === 0) return;

  try {
    isSubmitting.value = true;
    const itemsToProcess = selectedEntries.map(([key, svc]) => {
      const isExisting = svc.isExisting || false;
      const existingObj = svc.existingContractService;
      const editedPrice = Number(editedPricesMap.value.get(key) ?? (existingObj?.price ?? svc.price ?? 0));
      return {
        key,
        svc,
        isExisting,
        existingObj,
        price: editedPrice,
      };
    });

    let hasAnyError = false;

    // Confirm dialog preview
    const previewLines = itemsToProcess.slice(0, 5).map(item => {
      const typeLabel = item.isExisting ? '[Update]' : '[Add]';
      return `• ${typeLabel} ${item.svc.item || item.svc.serviceName} — ${item.price.toFixed(2)} ETB`;
    }).join('\n');

    const extraCount = itemsToProcess.length > 5 ? `\n...and ${itemsToProcess.length - 5} more service(s)` : '';
    const message = `Are you sure you want to save changes for ${itemsToProcess.length} service(s)?\n\n${previewLines}${extraCount}`;

    const ok = await new Promise((resolve) => {
      openModal("Confirmation", { title: "Confirm Save Services", message }, (res) => resolve(res));
    });

    if (!ok) {
      isSubmitting.value = false;
      return;
    }

    // Process each item
    for (const item of itemsToProcess) {
      const svc = item.svc;
      if (item.isExisting && item.existingObj?.eligibleServiceUuid) {
        // UPDATE existing contract service price
        const payload = {
          itemCode: svc.itemCode || item.existingObj.itemCode || '',
          item: svc.item || item.existingObj.item || '',
          subCategory: svc.subCategory || item.existingObj.subCategory || '',
          category: svc.category || item.existingObj.category || '',
          price: item.price,
          payerProviderContractUuid: contractId.value,
          status: item.existingObj.status || 'ACTIVE',
          description: svc.description || item.existingObj.description || '',
          itemID: svc.itemID || item.existingObj.itemID || '',
        };

        const res = await new Promise((resolve2) => {
          api.send(() => updateService(item.existingObj.eligibleServiceUuid, payload), (r) => resolve2(r));
        });

        if (res?.success) {
          serviceListStore.update(item.existingObj.eligibleServiceUuid, {
            ...item.existingObj,
            price: item.price,
          });
        } else {
          hasAnyError = true;
        }
      } else {
        // ADD new eligible service
        const payload = {
          itemCode: svc.itemCode,
          item: svc.item,
          subCategory: svc.subCategory,
          category: svc.category,
          price: item.price,
          payerProviderContractUuid: contractId.value,
          status: "ACTIVE",
          description: svc.description,
          itemID: svc.itemID,
        };

        const res = await new Promise((resolve2) => {
          api.send(() => addEligibleService(contractId.value, payload), (r) => resolve2(r));
        });

        if (res?.success) {
          serviceListStore.add(res.data);
        } else {
          hasAnyError = true;
        }
      }
    }

    if (!hasAnyError) {
      toasted(true, "Services saved", `${itemsToProcess.length} service(s) updated/added successfully`);
      closeModal(true);
    } else {
      toasted(true, "Services saved with warnings", "Completed with warnings on some items");
      closeModal(true);
    }
  } catch (e) {
    if (e?.message !== "cancelled") {
      console.error(e);
      toasted(false, "", "Failed to save service changes");
    }
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
th { position: sticky; top: 0; z-index: 10; }
</style>