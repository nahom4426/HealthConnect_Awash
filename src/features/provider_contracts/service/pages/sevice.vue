<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import icons from "@/utils/icons";
import { toasted } from "@/utils/utils";
import Drugs from "../components/Drugs.vue";
import ServiceList from "../components/ServiceList.vue";
import Button from "@/components/Button.vue";
import { openModal } from "@customizer/modal-x";
import { getServiceCategories, exportServicesByCategories } from "../api/serviceApi";

const route = useRoute();
const items = ["Services", "Drugs"];
const active = ref(0);

const setActive = (item) => {
  active.value = item;
};

const components = [
  {
    name: "Services",
    component: ServiceList,
  },
  // {
  //   name: "Drugs",
  //   component: Drugs,
  // },
];

// Get provider ID from route
const providerId = computed(() =>  route.params.providerUuid);
const payerProviderContractUuid = computed(() =>  route.params.id);
const providerName = computed(() => {
  const raw = route.params.providerName;
  return raw ? decodeURIComponent(raw) : 'Provider Services';
});
const exportModal = ref(false);
const categories = ref([]);
const selectedCategories = ref([]);
const loadingCategories = ref(false);
const search = ref("");
const refetchServices = ref(0);

const openImportServices = () => {
  openModal('Import', {
    type: 'service',
    onRefetch: () => {
      refetchServices.value += 1;
    },
  });
};

const handleServiceImported = (e) => {
  refetchServices.value += 1;
};

onMounted(() => {
  window.addEventListener('service-imported', handleServiceImported);
});

onUnmounted(() => {
  window.removeEventListener('service-imported', handleServiceImported);
});

const openAssignToPackages = () => {
  if (!payerProviderContractUuid.value) {
    toasted(false, "", "Provider ID not found in route");
    return;
  }

  openModal('SelectCoverageForServiceAssignment', {
    payerProviderContractUuid: payerProviderContractUuid.value,
    providerName: providerName.value,
  });
};

// Fetch categories for export modal
const openExportModal = async () => {
  if (!providerId.value) {
    toasted(false, "", "Provider ID not found in route");
    return;
  }

  try {
    loadingCategories.value = true;
    
    const response = await getServiceCategories(providerId.value);
    
    if (Array.isArray(response)) {
      categories.value = response.map((category) => ({
        id: category,         // keep original value
        name: category,       // keep original name
        original: category    // keep original reference
      }));
      
      // Remove duplicates
      categories.value = categories.value.filter(
        (category, index, self) =>
          index === self.findIndex((c) => c.name === category.name)
      );
      
      // Select all by default
      selectedCategories.value = categories.value.map(c => c.id);
      
      exportModal.value = true;
    } else {
      throw new Error('Invalid categories response format');
    }
  } catch (err) {
    console.error('Error loading categories:', err);
    toasted(false, "", "Failed to load service categories");
  } finally {
    loadingCategories.value = false;
  }
};

// Toggle all categories
const toggleAllCategories = () => {
  if (selectedCategories.value.length === categories.value.length) {
    selectedCategories.value = [];
  } else {
    selectedCategories.value = categories.value.map(c => c.id);
  }
};

// Export services based on selected categories
const exportServices = async () => {
  if (selectedCategories.value.length === 0) {
    toasted(false, "", "Please select at least one category");
    return;
  }

  try {
    loadingCategories.value = true;
    const success = await exportServicesByCategories(
      providerId.value,
      selectedCategories.value,
      providerName.value,
      console.log('aa',
      providerName.value)
    );
    
    if (success) {
      exportModal.value = false;
      // Animation effect
      const exportBtn = document.querySelector('.export-btn');
      if (exportBtn) {
        exportBtn.classList.add('animate-ping');
        setTimeout(() => exportBtn.classList.remove('animate-ping'), 500);
      }
    }
  } catch (err) {
    console.error('Export failed:', err);
  } finally {
    loadingCategories.value = false;
  }
};
</script>
<template>
  <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
    <div class="flex justify-between items-center">
      <div class="flex justify-between items-center mb-4">
  <!-- Tabs -->
  <div class="flex gap-2">
    <div
      v-for="(item, index) in components"
      :key="index"
      @click="setActive(index)"
      :class="[
        'px-4 py-3 transition-all cursor-pointer duration-300',
        active === index
          ? index === 0
            ? 'bg-base-clr text-white rounded-l-lg font-medium shadow-sm'
            : 'bg-base-clr text-white rounded-r-lg font-medium shadow-sm'
          : 'text-gray-500 hover:text-base-clr',
      ]"
    >
      {{ item.name }}
    </div>
  </div>

  <!-- Provider Header -->
  <div
    v-if="providerName"
    class="flex gap-3 items-center px-4 py-2 mx-2 bg-gradient-to-r rounded-xl border shadow-sm from-base-clr/10 to-base-clr/5 border-base-clr/20"
  >
    <!-- Accent -->
    <span
      class="w-3 h-3 rounded-full shadow bg-primary"
    ></span>

    <!-- Text -->
    <h2
      class="text-lg font-semibold tracking-tight text-primary"
    >
      {{ providerName }}
    </h2>
  </div>
</div>


      <div class="flex gap-3">
        <div
          tabindex="0"
          class="flex overflow-hidden items-center w-full bg-gray-100 rounded-lg md:m focus-within:border-primary"
        >
          <span
            class="grid place-items-center w-10 h-full text-base-clr"
            v-html="icons.search"
          />
          <input
            v-model="search"
            :placeholder="active === 0 ? 'Search Services' : 'Search Drugs'"
            class="flex-1 py-2 h-full bg-transparent outline-none px-"
          />
        </div>
       
        <div v-if="active === 0" class="flex gap-2 justify-end items-center">
          <button
            @click="openExportModal"
            :disabled="!providerId"
            title="Export Services From Providers"
            aria-label="Export Services From Providers"
            class="flex overflow-hidden justify-center items-center px-0 w-12 h-12 text-white whitespace-nowrap bg-indigo-600 rounded-xl shadow-sm transition-all duration-200 group hover:w-auto hover:px-4 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="order-1 text-sm font-bold group-hover:mr-2">E</span>
            <span class="order-2 max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[220px] transition-all duration-200 overflow-hidden mr-0 group-hover:mr-3 text-sm font-semibold">
              Export Services
            </span>
            <span v-html="icons.export || icons.download" class="order-3 w-5 h-5 flex-shrink-0"></span>
          </button>

          <button
            @click="openAssignToPackages"
            :disabled="!payerProviderContractUuid"
            title="Assign to Packages"
            aria-label="Assign to Packages"
            class="flex overflow-hidden justify-center items-center px-0 w-12 h-12 text-white whitespace-nowrap bg-emerald-600 rounded-xl shadow-sm transition-all duration-200 group hover:w-auto hover:px-4 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="order-1 text-sm font-bold group-hover:mr-2">A</span>
            <span class="order-2 max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[220px] transition-all duration-200 overflow-hidden mr-0 group-hover:mr-3 text-sm font-semibold">
              Assign to Packages
            </span>
            <span v-html="icons.coverage || icons.briefcase" class="order-3 w-5 h-5 flex-shrink-0"></span>
          </button>

          <button
            @click="openImportServices"
            title="Import Service"
            aria-label="Import Service"
            class="flex overflow-hidden justify-center items-center px-0 w-12 h-12 text-white whitespace-nowrap bg-amber-500 rounded-xl shadow-sm transition-all duration-200 group hover:w-auto hover:px-4 hover:bg-amber-600"
          >
            <span class="order-1 text-sm font-bold group-hover:mr-2">I</span>
            <span class="order-2 max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[220px] transition-all duration-200 overflow-hidden mr-0 group-hover:mr-3 text-sm font-semibold">
              Import Service
            </span>
            <span v-html="icons.import" class="order-3 w-5 h-5 flex-shrink-0"></span>
          </button>

          <button
            @click="openModal('AddServices')"
            title="Add Service"
            aria-label="Add Service"
            class="flex overflow-hidden justify-center items-center px-0 w-12 h-12 text-white whitespace-nowrap bg-blue-600 rounded-xl shadow-sm transition-all duration-200 group hover:w-auto hover:px-4 hover:bg-blue-700"
          >
            <span class="order-1 text-sm font-bold group-hover:mr-2">A</span>
            <span class="order-2 max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[220px] transition-all duration-200 overflow-hidden mr-0 group-hover:mr-3 text-sm font-semibold">
              Add Service
            </span>
            <span v-html="icons.plus_circle" class="order-3 w-5 h-5 flex-shrink-0"></span>
          </button>
        </div>
        <div v-else class="flex gap-2">
          <button
            class="flex gap-2 items-center px-6 py-4 text-white whitespace-nowrap rounded-md bg-primary"
            @click="openModal('AddDrug')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Add Drug
          </button>
          <button
            class="flex gap-2 items-center px-6 py-4 text-white whitespace-nowrap rounded-md bg-primary"
            @click="openModal('Import', 'drug')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Import Drug
          </button>
        </div>
      </div>
    </div>
    <component
      :search="search"
      :refetch="active === 0 ? refetchServices : 0"
      :is="components[active].component"
    ></component>

    <!-- Export Modal -->
    <div v-if="exportModal" class="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div class="p-6 w-full max-w-md bg-white rounded-lg">
        <h2 class="mb-4 text-xl font-semibold">Export Services by Category</h2>

        <!-- Loading Spinner -->
        <div v-if="loadingCategories" class="py-4 text-center">
          <div class="flex justify-center items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02676B]"></div>
            <span class="ml-2">Loading categories...</span>
          </div>
        </div>

        <!-- Category List -->
        <div v-else>
          <div class="flex items-center mb-3">
            <input
              type="checkbox"
              :checked="selectedCategories.length === categories.length"
              @change="toggleAllCategories"
              class="mr-2 h-4 w-4 text-[#02676B] focus:ring-[#02676B] border-gray-300 rounded"
            />
            <label class="font-medium">Select All Categories</label>
          </div>

          <div class="overflow-y-auto p-3 space-y-2 max-h-60 bg-gray-50 rounded border">
            <div
              v-for="category in categories"
              :key="category.id"
              class="flex items-center p-2 rounded transition-colors hover:bg-white"
            >
              <input
                type="checkbox"
                :value="category.id"
                v-model="selectedCategories"
                class="mr-3 h-4 w-4 text-[#02676B] focus:ring-[#02676B] border-gray-300 rounded"
              />
              <label class="text-sm">{{ category.name }}</label>
            </div>
            <div v-if="categories.length === 0" class="py-4 text-center text-gray-500">
              No categories found
            </div>
          </div>

          <div class="mt-3 text-sm text-gray-600">
            {{ selectedCategories.length }} of {{ categories.length }} categories selected
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end mt-6 space-x-3">
          <button
            class="px-4 py-2 text-gray-700 bg-gray-300 rounded transition-colors hover:bg-gray-400"
            @click="exportModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-[#02676B] text-white rounded hover:bg-[#02494D] transition-colors flex items-center gap-2"
            @click="exportServices"
            :disabled="loadingCategories || selectedCategories.length === 0"
          >
            <span v-if="loadingCategories" class="w-4 h-4 rounded-full border-b-2 border-white animate-spin"></span>
            <span v-html="icons.download" class="w-4 h-4"></span>
            Export ({{ selectedCategories.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
