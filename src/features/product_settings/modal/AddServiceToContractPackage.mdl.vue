<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, computed, onMounted, watch } from "vue";
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useToast } from '@/toast/store/toast';
import { toasted } from '@/utils/utils';
import { getActiveContract } from '@/features/provider_contracts/api/contractApi';
import { getAllServices } from '@/features/provider_contracts/service/api/serviceApi';
import { addEligibleServices, getEligiblePackage } from '@/features/product_settings/api/coverageApi';
import Spinner from "@/components/Spinner.vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const selectedpayerProviderContractUuid = ref('');
const packageUuid = computed(() => props.data?.packageUuid);
const { addToast } = useToast();
const api = useApiRequest();

// Step management
const currentStep = ref(1);
const steps = [
  { number: 1, title: 'Select Provider', description: 'Choose a provider to view their services' },
  { number: 2, title: 'Select Services', description: 'Choose services to add to the package' }
];

// Provider selection
const providers = ref([]);
const selectedProvider = ref(null);
const loadingProviders = ref(false);

// Services data
const allServices = ref([]);
const existingServices = ref([]);
const selectedServices = ref([]);
const searchTerm = ref('');
const loadingServices = ref(false);
const selectAll = ref(false);
const selectedCategories = ref([]);
const selectedCategoryFilter = ref([]);
const showCategoryFilter = ref(false);

// Fetch providers
async function fetchProviders() {
  try {
    loadingProviders.value = true;
    const response = await getActiveContract();
    
    if (response?.data.content) {
      providers.value = Array.isArray(response.data.content) ? response.data.content : [response.data.content];
    }
  } catch (error) {
    console.error('Error fetching providers:', error);
    toasted(false, 'Failed to load providers');
  } finally {
    loadingProviders.value = false;
  }
}

// Fetch services for selected provider
async function fetchServices() {
  if (!selectedProvider.value || !packageUuid.value) return;
  
  try {
    loadingServices.value = true;
    
    // 1. Get all services for the provider
    const [servicesResponse, existingResponse] = await Promise.all([
      getAllServices(selectedProvider.value.payerProviderContractUuid),
      getEligiblePackage(packageUuid.value, selectedProvider.value.payerProviderContractUuid)
    ]);

    const allServicesData = servicesResponse?.data?.content || [];
    const existingServiceIds = new Set(
      (existingResponse?.data?.packageEligibleServices || []).map(service => service.serviceId)
    );
    
    // Process services
    allServices.value = allServicesData.map(service => ({
      ...service,
      isExisting: existingServiceIds.has(service.serviceId)
    }));
    
    // Set existing services
    existingServices.value = allServices.value.filter(service => service.isExisting);
    
    // Pre-select existing services
    selectedServices.value = [...existingServices.value];
    selectedCategories.value = [];
    selectAll.value = false;
    
  } catch (error) {
    console.error('Error fetching services:', error);
    toasted(false, 'Failed to load services');
  } finally {
    loadingServices.value = false;
  }
}

// Watch for provider selection changes
watch(selectedProvider, (newProvider) => {
  if (newProvider) {
    fetchServices();
  }
});

// Provider options for select
const providerOptions = computed(() => 
  providers.value.map(provider => ({
    value: provider.payerProviderContractUuid,
    label: provider.providerName,
    data: provider
  }))
);

// Filtered services based on search and category
const filteredServices = computed(() => {
  let filtered = allServices.value;
  
  // Filter by categories if selected
  if (selectedCategoryFilter.value.length > 0) {
    filtered = filtered.filter(service => 
      selectedCategoryFilter.value.includes(service.category || 'Uncategorized')
    );
  }
  
  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(service =>
      (service.item || '').toLowerCase().includes(term) ||
      (service.itemCode || '').toLowerCase().includes(term) ||
      (service.category || '').toLowerCase().includes(term)
    );
  }
  
  return filtered;
});

// Toggle select all
function toggleSelectAll() {
  if (selectAll.value) {
    // Select all available services (not existing ones)
    const servicesToAdd = allServices.value.filter(
      service => !service.isExisting && 
      (selectedCategories.value.length === 0 || 
       selectedCategories.value.includes(service.category || 'Uncategorized'))
    );
    selectedServices.value = [
      ...existingServices.value,
      ...servicesToAdd
    ];
  } else {
    // Deselect all except existing services
    selectedServices.value = [...existingServices.value];
  }
}

// Toggle service selection
function toggleServiceSelection(service) {
  const index = selectedServices.value.findIndex(s => s.serviceId === service.serviceId);
  
  if (index > -1) {
    // Only allow deselecting if it's not an existing service, or use the remove button
    if (!service.isExisting) {
      selectedServices.value.splice(index, 1);
    }
  } else {
    selectedServices.value.push(service);
  }
  updateSelectAllState();
}
// Get unique categories
const uniqueCategories = computed(() => {
  const categories = new Set();
  allServices.value.forEach(service => {
    categories.add(service.category || 'Uncategorized');
  });
  return Array.from(categories).sort();
});

// Toggle category selection
function toggleCategorySelection(category) {
  const index = selectedCategories.value.indexOf(category);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(category);
  }
  
  // Select/deselect services in this category
  const servicesInCategory = allServices.value.filter(
    service => (service.category || 'Uncategorized') === category && !service.isExisting
  );
  
  if (index === -1) {
    // Category was selected - add services
    servicesInCategory.forEach(service => {
      if (!selectedServices.value.some(s => s.eligibleServiceUuid === service.eligibleServiceUuid)) {
        selectedServices.value.push(service);
      }
    });
  } else {
    // Category was deselected - remove services
    selectedServices.value = selectedServices.value.filter(
      service => service.isExisting || (service.category || 'Uncategorized') !== category
    );
  }
  
  updateSelectAllState();
}

// Update selectAll state based on current selections
function updateSelectAllState() {
  if (selectedCategories.value.length === 0) {
    const availableServices = allServices.value.filter(service => !service.isExisting);
    selectAll.value = availableServices.length > 0 && 
      availableServices.every(service => 
        selectedServices.value.some(s => s.eligibleServiceUuid === service.eligibleServiceUuid)
      );
    return;
  }
  
  const servicesInSelectedCategories = allServices.value.filter(
    service => selectedCategories.value.includes(service.category || 'Uncategorized') && !service.isExisting
  );
  
  selectAll.value = servicesInSelectedCategories.length > 0 && 
    servicesInSelectedCategories.every(service => 
      selectedServices.value.some(s => s.eligibleServiceUuid === service.eligibleServiceUuid)
    );
}

// Check if service is selected
function isServiceSelected(service) {
  return selectedServices.value.some(s => s.serviceId === service.serviceId);
}

// Check if category is selected
function isCategorySelected(category) {
  return selectedCategories.value.includes(category);
}

// Handle category filter change
function handleCategoryFilterChange() {
  // Reset search when category filter changes
  // searchTerm.value = '';
}

// Computed properties for tracking changes
const newServicesCount = computed(() => {
  // Count services that are selected but were NOT originally existing
  return selectedServices.value.filter(service => {
    // Check if this service was in the original existingServices
    const wasOriginallyExisting = existingServices.value.some(
      existing => existing.serviceId === service.serviceId
    );
    return !wasOriginallyExisting;
  }).length;
});

const removedServicesCount = computed(() => {
  // Count services that were originally existing but are no longer selected
  return existingServices.value.filter(
    existingService => !selectedServices.value.some(s => s.serviceId === existingService.serviceId)
  ).length;
});

// Remove existing service from package
async function removeExistingService(service) {
  try {
    // Remove from selectedServices
    const index = selectedServices.value.findIndex(s => s.serviceId === service.serviceId);
    if (index > -1) {
      selectedServices.value.splice(index, 1);
    }

    // DON'T change isExisting - keep the original state
    // DON'T remove from existingServices - we need it to track what was removed
    // The existingServices array should remain as the original snapshot

    addToast({
      type: 'success',
      title: 'Service Removed',
      message: `"${service.item}" has been marked for removal from the package`
    });

    updateSelectAllState();
  } catch (error) {
    console.error('Error removing service:', error);
    addToast({
      type: 'error',
      title: 'Error',
      message: 'Failed to remove service'
    });
  }
}

// Watch for changes in selectedServices to update selectAll state
watch(selectedServices, () => {
  updateSelectAllState();
}, { deep: true });

// Go to next step
function nextStep() {
  if (currentStep.value === 1 && selectedProvider.value) {
    currentStep.value = 2;
  }
}

// Go to previous step
function previousStep() {
  if (currentStep.value === 2) {
    currentStep.value = 1;
  }
}

// Submit selected services
async function submitServices() {
  try {
    if (!packageUuid.value) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Package UUID is missing'
      });
      return;
    }

    // Get all selected services (both new and existing)
    const allSelectedUuids = selectedServices.value
      .map(service => service.eligibleServiceUuid);

    if (allSelectedUuids.length === 0) {
      addToast({
        type: 'info',
        title: 'No Services',
        message: 'No services selected'
      });
      closeModal();
      return;
    }

    const payload = {
      eligibleServiceUuids: allSelectedUuids
    };

    const response = await addEligibleServices(packageUuid.value, payload);

    if (response?.success !== false) {
      const newServicesCount = selectedServices.value.filter(s => !s.isExisting).length;
      addToast({
        type: 'success',
        title: 'Success',
        message: `${allSelectedUuids.length} service(s) updated for package (${newServicesCount} new services added)`
      });
      closeModal(true);
    } else {
      throw new Error(response?.message || 'Failed to update services');
    }
  } catch (error) {
    console.error('Error updating services:', error);
    addToast({
      type: 'error',
      title: 'Error',
      message: error.message || 'Failed to update services for package'
    });
  }
}

// Handle provider selection change
function onProviderChange(payerProviderContractUuid) {
  selectedpayerProviderContractUuid.value = payerProviderContractUuid;
  selectedProvider.value = providers.value.find(p => p.payerProviderContractUuid === payerProviderContractUuid);
}

onMounted(() => {
  fetchProviders();
});
</script>
<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Add Services to Package"
      subtitle="Select a provider and choose services to add to this package"
    >
      <div class="space-y-6">
        <!-- Step Indicator -->
        <div class="flex justify-center items-center mb-8 space-x-8">
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex items-center"
          >
            <div
              :class="[
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                currentStep >= step.number
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 text-gray-500'
              ]"
            >
              <span class="text-sm font-medium">{{ step.number }}</span>
            </div>
            <div class="ml-3">
              <p
                :class="[
                  'text-sm font-medium',
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                ]"
              >
                {{ step.title }}
              </p>
              <p class="text-xs text-gray-400">{{ step.description }}</p>
            </div>
            <div
              v-if="step.number < steps.length"
              :class="[
                'w-16 h-0.5 ml-8 transition-all duration-200',
                currentStep > step.number ? 'bg-blue-500' : 'bg-gray-300'
              ]"
            ></div>
          </div>
        </div>

        <!-- Step 1: Provider Selection -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div class="flex gap-3 items-center mb-4">
              <div class="flex justify-center items-center w-10 h-10 bg-blue-500 rounded-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800">Select Provider</h3>
                <p class="text-sm text-gray-600">Choose a provider to view their available services</p>
              </div>
            </div>

            <div v-if="loadingProviders" class="flex justify-center py-8">
              <Spinner size="lg" />
            </div>

            <div v-else>
              <select
                v-model="selectedpayerProviderContractUuid"
                @change="onProviderChange($event.target.value)"
                class="px-4 py-2 w-full bg-white rounded-lg border border-blue-200 transition duration-200 focus:border-blue-400 focus:ring focus:ring-blue-100"
              >
                <option value="" disabled selected>Select a provider...</option>
                <option 
                  v-for="provider in providers" 
                  :key="provider.payerProviderContractUuid" 
                  :value="provider.payerProviderContractUuid"
                >
                  {{ provider.providerName }}
                </option>
              </select>

              <div v-if="selectedProvider" class="p-4 mt-4 bg-white rounded-lg border border-blue-200">
                <h4 class="mb-2 font-medium text-gray-800">Selected Provider Details:</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Name:</span>
                    <span class="ml-2 font-medium">{{ selectedProvider.providerName }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Category:</span>
                    <span class="ml-2 font-medium">{{ selectedProvider.category }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Phone:</span>
                    <span class="ml-2 font-medium">{{ selectedProvider.telephone }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Location:</span>
                    <span class="ml-2 font-medium">{{ selectedProvider.address1 }}, {{ selectedProvider.state }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Service Selection -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div class="flex gap-3 items-center mb-4">
              <div class="flex w-10 h-10 bg-green-500 rounded-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800">Select Services</h3>
                <p class="flex text-sm text-gray-600">Choose services from <p class="px-2 font-bold">{{ selectedProvider?.providerName }}</p> to add to the package</p>
              </div>
            </div>

            <!-- Search and Category Selection -->
            <div class="flex flex-col gap-4 mb-4 md:flex-row md:items-start">
              <!-- Search -->
              <div class="relative flex-1">
                <Input
                  v-model="searchTerm"
                  placeholder="Search services by name, code, or category..."
                  :attributes="{
                    class: 'pl-10 h-9 w-full bg-white border-green-200 focus:border-green-400'
                  }"
                />
                <div class="absolute top-2.5 left-3 text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
              
              <!-- Category Selection -->
              <div class="flex-1">
                <div class="flex flex-col gap-2">
                  <button
                    @click="showCategoryFilter = !showCategoryFilter"
                    class="flex justify-between items-center px-4 h-10 text-sm font-medium text-gray-700 bg-white rounded-lg border border-green-200 transition-colors duration-200 hover:bg-green-50"
                  >
                    <span class="flex gap-2 items-center">
                      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                      </svg>
                      Filter by Categories
                      <span v-if="selectedCategoryFilter.length > 0" class="px-2 py-0.5 text-xs font-semibold text-white bg-green-600 rounded-full">
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
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <!-- Dropdown Content with Animation -->
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 transform scale-95"
                    enter-to-class="opacity-100 transform scale-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 transform scale-100"
                    leave-to-class="opacity-0 transform scale-95"
                  >
                    <div v-if="showCategoryFilter" class="flex flex-wrap gap-3 p-3 bg-white border border-green-200 rounded-lg shadow-lg max-h-[120px] overflow-y-auto">
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
                        />
                        <span class="text-sm text-gray-700">
                          {{ category || 'Uncategorized' }}
                        </span>
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
                {{ selectedServices.filter(s => !s.isExisting).length }} new services selected
              </div>
            </div>

            <!-- Services Table -->
            <div v-if="loadingServices" class="flex justify-center py-8">
              <Spinner size="lg" />
            </div>

            <div v-else class="overflow-y-auto max-h-96 rounded-lg border border-green-200">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="sticky top-0 bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Select
                    </th>
                    <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Service Code
                    </th>
                    <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Service Name
                    </th>
                    <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Category
                    </th>
                    <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Price (ETB)
                    </th>
                    <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="service in filteredServices"
                    :key="service.eligibleServiceUuid"
                    :class="{
                      'bg-green-50': isServiceSelected(service) && service.isExisting,
                      'hover:bg-gray-50': true
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
                        <span
                          v-else
                          class="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full"
                        >
                          Available
                        </span>
                        
                        <!-- Remove button for existing services that are selected -->
                        <button
                          v-if="isServiceSelected(service) && service.isExisting"
                          @click="removeExistingService(service)"
                          class="p-1.5 text-red-600 rounded-lg transition-colors duration-200 hover:text-red-800 hover:bg-red-50"
                          title="Remove from package"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between pt-6 border-t border-gray-200">
          <div>
            <Button
              v-if="currentStep === 2"
              @click="previousStep"
              variant="outline"
              class="flex gap-2 items-center"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back to Provider Selection
            </Button>
          </div>

          <div class="flex gap-4">
            <Button @click="closeModal" variant="outline">
              Cancel
            </Button>

            <Button
              v-if="currentStep === 1"
              @click="nextStep"
              :disabled="!selectedProvider"
              class="flex gap-2 items-center text-white bg-blue-500 hover:bg-blue-600"
            >
              Continue to Services
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Button>

            <Button
              v-if="currentStep === 2"
              @click="submitServices"
              :pending="api.pending.value"
              :disabled="selectedServices.length === 0"
              class="text-white bg-green-500 hover:bg-green-600"
            >
              <span class="flex gap-2 items-center">
                Save Changes
                <span v-if="newServicesCount > 0" class="px-2 py-0.5 text-xs font-semibold bg-blue-600 rounded-full">
                  +{{ newServicesCount }}
                </span>
                <span v-if="removedServicesCount > 0" class="px-2 py-0.5 text-xs font-semibold bg-red-600 rounded-full">
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

/* Custom scrollbar */
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

/* Smooth transitions */
* {
  transition: all 0.2s ease-in-out;
}
</style>
