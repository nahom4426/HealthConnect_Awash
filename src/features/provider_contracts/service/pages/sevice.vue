<script setup>
import { ref, computed, watch, onMounted } from "vue";
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
const providerId = computed(() => route.params.providerUuid || route.params.id);
const providerName = ref('Provider Services');
const exportModal = ref(false);
const categories = ref([]);
const selectedCategories = ref([]);
const loadingCategories = ref(false);
const search = ref("");

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
      providerName.value
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
      <div class="flex border border-base-clr rounded w-fit">
        <div
          v-for="(item, index) in components"
          :key="index"
          @click="setActive(index)"
          :class="[
            'px-4 py-3 transition-colors cursor-pointer duration-300',
            active === index
              ? index === 0
                ? 'bg-base-clr w-fit text-white rounded-l font-medium'
                : 'bg-base-clr text-white rounded-r  font-medium'
              : '',
          ]"
        >
          {{ item.name }}
        </div>
      </div>
      <div class="flex gap-3">
        <div
          tabindex="0"
          class="w-full md:m bg-gray-100 focus-within:border-primary flex items-center rounded-lg overflow-hidden"
        >
          <span
            class="w-10 h-full text-base-clr grid place-items-center"
            v-html="icons.search"
          />
          <input
            v-model="search"
            :placeholder="active === 0 ? 'Search Services' : 'Search Drugs'"
            class="flex-1 bg-transparent px- py-2 h-full outline-none"
          />
        </div>
        <div v-if="active === 0" class="flex gap-2 ">
           <button
            @click="openExportModal"
            class="flex gap-2 bg-secondary hover-bg-primary  px-1 py-4 rounded-md whitespace-nowrap text-white "
            :disabled="!providerId"
          >
            <span v-html="icons.download" class="w-4 h-4 mx-2"></span>
           <p class="flex flex-col">Export Services From Payer</p>
          </button>
          <button
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('Import')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Import Service
          </button>
        </div>
        <div v-else class="flex gap-2">
          <button
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('AddDrug')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Add Drug
          </button>
          <button
            class="flex gap-2 bg-primary items-center px-6 py-4 rounded-md whitespace-nowrap text-white"
            @click="openModal('Import', 'drug')"
          >
            <i v-html="icons.plus_circle" class=""></i>
            Import Drug
          </button>
        </div>
      </div>
    </div>
    <component :search="search" :is="components[active].component"></component>

    <!-- Export Modal -->
    <div v-if="exportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md p-6">
        <h2 class="text-xl font-semibold mb-4">Export Services by Category</h2>

        <!-- Loading Spinner -->
        <div v-if="loadingCategories" class="text-center py-4">
          <div class="flex items-center justify-center">
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

          <div class="max-h-60 overflow-y-auto border rounded p-3 space-y-2 bg-gray-50">
            <div
              v-for="category in categories"
              :key="category.id"
              class="flex items-center hover:bg-white p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                :value="category.id"
                v-model="selectedCategories"
                class="mr-3 h-4 w-4 text-[#02676B] focus:ring-[#02676B] border-gray-300 rounded"
              />
              <label class="text-sm">{{ category.name }}</label>
            </div>
            <div v-if="categories.length === 0" class="text-center text-gray-500 py-4">
              No categories found
            </div>
          </div>

          <div class="mt-3 text-sm text-gray-600">
            {{ selectedCategories.length }} of {{ categories.length }} categories selected
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-end space-x-3">
          <button
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            @click="exportModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-[#02676B] text-white rounded hover:bg-[#02494D] transition-colors flex items-center gap-2"
            @click="exportServices"
            :disabled="loadingCategories || selectedCategories.length === 0"
          >
            <span v-if="loadingCategories" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            <span v-html="icons.download" class="w-4 h-4"></span>
            Export ({{ selectedCategories.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
