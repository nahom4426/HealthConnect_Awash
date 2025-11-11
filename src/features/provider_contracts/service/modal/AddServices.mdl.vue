<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Add Services to Contract"
      subtitle="Search and select services to add. Only price is editable."
    >
      <div class="space-y-5">
        <!-- Search and select all -->
        <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div class="flex-1 relative">
            <Input
              v-model="searchTerm"
              placeholder="Search by name, code, or category..."
              :attributes="{ class: 'pl-10 w-full bg-white border-gray-200 focus:border-[#02676B]' }"
            />
            <div class="absolute left-3 top-3 text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input id="selectAll" type="checkbox" v-model="selectAll" @change="onToggleSelectAll" class="h-4 w-4 text-[#02676B] focus:ring-[#02676B] border-gray-300 rounded" />
            <label for="selectAll" class="text-sm">Select all</label>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">Discount %</label>
            <input type="number" min="0" max="100" step="0.01" v-model.number="discountPercent" @input="onDiscountChanged" class="w-24 px-2 py-1 border rounded" />
          </div>
        </div>

        <!-- Info banner -->
        <div class="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-100">
          {{ filteredServices.length }} service(s) available to add. Existing contract services are hidden.
        </div>

        <!-- Table -->
        <div v-if="loading" class="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
        <div v-else class="overflow-y-auto max-h-[60vh] border rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price (ETB)</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negotiated Price (ETB)</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="svc in filteredServices" :key="svcKey(svc)" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <input type="checkbox" :checked="isSelected(svc)" @change="toggleOne(svc)" class="h-4 w-4 text-[#02676B] focus:ring-[#02676B] border-gray-300 rounded" />
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ svc.itemCode || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ svc.item || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ svc.category || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ svc.subCategory || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ Number(svc.price ?? 0).toFixed(2) }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  <input
                    type="number"
                    :value="editedPrices.get(svcKey(svc)) ?? svc.price ?? 0"
                    :disabled="!isSelected(svc)"
                    min="0"
                    step="0.01"
                    @input="onEditPrice(svc, $event.target.value)"
                    class="w-28 px-2 py-1 border rounded disabled:bg-gray-100"
                  />
                </td>
              </tr>
              <tr v-if="filteredServices.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-500">No services to add</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center pt-4 border-t">
          <div class="text-sm text-gray-600">Selected: {{ selected.size }}</div>
          <div class="flex gap-3">
            <Button @click="closeModal" variant="outline">Cancel</Button>
            <Button :pending="api.pending.value" :disabled="selected.size === 0" class="bg-[#02676B] hover:bg-[#01585B] text-white" @click="submit">
              Add {{ selected.size }} Service(s)
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
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal, openModal } from "@customizer/modal-x";
import { searchAllService, getAllServices, addEligibleService } from "../api/serviceApi";
import { useServiceListStore } from "../store/serviceListStore";

const authStore = useAuthStore();
const route = useRoute();
const api = useApiRequest();
const serviceListStore = useServiceListStore();

// state
const loading = ref(true);
const searchTerm = ref("");
const selectAll = ref(false);
const allSearchServices = ref([]); // from searchAllService
const existingContractServices = ref([]); // from getAllServices
const selected = ref(new Set()); // of keys
const editedPrices = ref(new Map()); // key -> price
const basePrices = ref(new Map()); // key -> original/base price from source
const discountPercent = ref(0); // global discount applied to selected

const providerUuid = computed(() => route.params.providerUuid || authStore.auth?.user?.providerUuid);
const contractId = computed(() => route.params.id || "");
function svcKey(svc) {
  // Prefer a stable key for comparison; fall back to code then name
  return svc.eligibleServiceUuid || svc.serviceUuid || svc.generatedServiceId || svc.serviceId || svc.itemCode || `${svc.item}|${svc.category}`;
}

const existingCodes = computed(() => {
  // Exclude existing by code primarily; fallback to names
  const codes = new Set();
  (existingContractServices.value || []).forEach(s => {
    if (s.itemCode) codes.add(String(s.itemCode).toLowerCase());
    else if (s.item) codes.add(String(s.item).toLowerCase());
  });
  return codes;
});

const filteredServices = computed(() => {
  const term = (searchTerm.value || "").toLowerCase();
  return (allSearchServices.value || [])
    .filter(s => {
      const code = String(s.itemCode || s.serviceCode || "").toLowerCase();
      const name = String(s.item || s.serviceName || "").toLowerCase();
      // hide if already exists in contract
      if (existingCodes.value.has(code) || (!code && existingCodes.value.has(name))) return false;
      if (!term) return true;
      return (
        code.includes(term) ||
        name.includes(term) ||
        String(s.category || s.serviceCategory || "").toLowerCase().includes(term) ||
        String(s.subCategory || s.serviceSubCategory || "").toLowerCase().includes(term)
      );
    });
});

function isSelected(svc) {
  return selected.value.has(svcKey(svc));
}

function toggleOne(svc) {
  const key = svcKey(svc);
  if (selected.value.has(key)) {
    selected.value.delete(key);
  } else {
    selected.value.add(key);
    // seed editable price when selected
    if (!editedPrices.value.has(key)) {
      const base = Number((svc.price ?? svc.negotiatedPrice ?? 0));
      basePrices.value.set(key, base);
      const discounted = applyDiscount(base, discountPercent.value);
      editedPrices.value.set(key, discounted);
    }
  }
  // reflect select-all state
  selectAll.value = filteredServices.value.length > 0 && filteredServices.value.every(x => selected.value.has(svcKey(x)));
}

function onEditPrice(svc, val) {
  const key = svcKey(svc);
  const num = Number(val ?? 0);
  editedPrices.value.set(key, isFinite(num) && num >= 0 ? num : 0);
}

function onToggleSelectAll() {
  if (selectAll.value) {
    // select all
    filteredServices.value.forEach(s => {
      const key = svcKey(s);
      selected.value.add(key);
      if (!basePrices.value.has(key)) basePrices.value.set(key, Number(s.price ?? 0));
      if (!editedPrices.value.has(key)) editedPrices.value.set(key, applyDiscount(basePrices.value.get(key) ?? 0, discountPercent.value));
    });
  } else {
    // deselect all
    filteredServices.value.forEach(s => selected.value.delete(svcKey(s)));
  }
}

function applyDiscount(amount, percent) {
  const p = Number(percent) || 0;
  const a = Number(amount) || 0;
  return Math.max(0, +(a * (1 - p / 100)).toFixed(2));
}

function onDiscountChanged() {
  // update negotiated prices for all selected rows
  selected.value.forEach(key => {
    const base = basePrices.value.get(key) ?? 0;
    editedPrices.value.set(key, applyDiscount(base, discountPercent.value));
  });
}

async function fetchData() {
  if (!providerUuid.value) {
    toasted(false, "", "Provider ID not found");
    loading.value = false;
    return;
  }
  try {
    loading.value = true;
    const [searchRes, existingRes] = await Promise.all([
      searchAllService(providerUuid.value),
      getAllServices(contractId.value),
    ]);

    // normalize arrays
    // searchAllService returns pagination with content array
    const searchData = Array.isArray(searchRes?.content) ? searchRes.content : (Array.isArray(searchRes) ? searchRes : []);
    // getAllServices returns AsyncResponse with data.content
    const existingData = Array.isArray(existingRes?.data?.content) ? existingRes.data.content : (existingRes?.data || []);

    // map search data to unified shape for display and payload
    allSearchServices.value = (searchData || []).map(s => ({
      ...s,
      itemCode: s.itemCode || s.serviceCode,
      item: s.item || s.serviceName,
      category: s.category || s.serviceCategory,
      subCategory: s.subCategory || s.serviceSubCategory,
      description: s.description,
      itemID: s.itemID || s.generatedServiceId,
    }));
    existingContractServices.value = existingData || [];
  } catch (e) {
    console.error("Error loading services", e);
    toasted(false, "", "Failed to load services");
  } finally {
    loading.value = false;
  }
}

async function submit() {
  const keys = Array.from(selected.value);
  if (keys.length === 0) return;
  try {
    const toCreate = filteredServices.value.filter(s => keys.includes(svcKey(s)));

    // Build preview content
    const previewLines = toCreate.map(s => `• ${s.item || s.serviceName} — ${Number(editedPrices.value.get(svcKey(s)) ?? s.price ?? 0).toFixed(2)} ETB`).join('\n');
    const message = `Are you sure you want to add the following ${toCreate.length} service(s)?\n\n${previewLines}`;

    // confirm
    await new Promise((resolve) => {
      openModal("Confirmation", { title: "Confirm Add Services", message }, (ok) => resolve(ok));
    }).then(async (ok) => {
      if (!ok) throw new Error("cancelled");

      // sequential create
      for (const svc of toCreate) {
        const key = svcKey(svc);
        const payload = {
          itemCode: svc.itemCode,
          item: svc.item,
          subCategory: svc.subCategory,
          category: svc.category,
          price: Number(editedPrices.value.get(key) ?? svc.price ?? 0),
          payerProviderContractUuid: contractId.value,
          status: "ACTIVE",
          description: svc.description,
          itemID: svc.itemID,
        };
        // eslint-disable-next-line no-await-in-loop
        const res = await new Promise((resolve2) => {
          api.send(() => addEligibleService(contractId.value, payload), (r) => resolve2(r));
        });
        if (res?.success) {
          serviceListStore.add(res.data);
        } else {
          toasted(false, "", res?.error || `Failed to add ${svc.itemCode || svc.item}`);
        }
      }
      toasted(true, "Services added", "Selected services have been added to the contract");
      closeModal(true);
    });
  } catch (e) {
    if (e?.message !== "cancelled") {
      console.error(e);
      toasted(false, "", "Failed to add services");
    }
  }
}

onMounted(fetchData);
</script>

<style scoped>
th { position: sticky; top: 0; z-index: 1; }
</style>