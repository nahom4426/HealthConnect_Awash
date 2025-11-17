<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, computed, onMounted } from "vue";
import Button from "@/components/Button.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useToast } from '@/toast/store/toast';
import { getEligiblePackage, addEligibleServices } from '@/features/product_settings/api/coverageApi';
import Spinner from "@/components/Spinner.vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const packageUuid = computed(() => props.data?.packageUuid);
const packageName = computed(() => props.data?.packageName || 'Package');
const payerProviderContractUuid = computed(() => props.data?.payerProviderContractUuid);

const { addToast } = useToast();
const api = useApiRequest();

// Services data
const existingServices = ref([]);
const selectedServicesToRemove = ref([]);
const searchTerm = ref('');
const loadingServices = ref(false);
const selectAll = ref(false);

// Fetch existing services for the package
async function fetchExistingServices() {
  if (!packageUuid.value || !payerProviderContractUuid.value) return;
  
  try {
    loadingServices.value = true;
    
    const response = await getEligiblePackage(packageUuid.value, payerProviderContractUuid.value);
    const services = response?.data?.packageEligibleServices || [];
    
    existingServices.value = services.map(service => ({
      ...service,
      isSelected: false
    }));
    
  } catch (error) {
    console.error('Error fetching services:', error);
    addToast({
      type: 'error',
      title: 'Error',
      message: 'Failed to load existing services'
    });
  } finally {
    loadingServices.value = false;
  }
}

// Filtered services based on search
const filteredServices = computed(() => {
  if (!searchTerm.value) return existingServices.value;
  
  const term = searchTerm.value.toLowerCase();
  return existingServices.value.filter(service =>
    (service.item || '').toLowerCase().includes(term) ||
    (service.itemCode || '').toLowerCase().includes(term) ||
    (service.category || '').toLowerCase().includes(term)
  );
});

// Toggle select all
function toggleSelectAll() {
  if (selectAll.value) {
    selectedServicesToRemove.value = [...filteredServices.value];
  } else {
    selectedServicesToRemove.value = [];
  }
  updateSelectAllState();
}

// Toggle service selection
function toggleServiceSelection(service) {
  const index = selectedServicesToRemove.value.findIndex(s => s.serviceId === service.serviceId);
  
  if (index > -1) {
    selectedServicesToRemove.value.splice(index, 1);
  } else {
    selectedServicesToRemove.value.push(service);
  }
  updateSelectAllState();
}

// Update selectAll state
function updateSelectAllState() {
  selectAll.value = filteredServices.value.length > 0 && 
    filteredServices.value.every(service => 
      selectedServicesToRemove.value.some(s => s.serviceId === service.serviceId)
    );
}

// Check if service is selected for removal
function isServiceSelected(service) {
  return selectedServicesToRemove.value.some(s => s.serviceId === service.serviceId);
}

// Submit removal
async function removeServices() {
  try {
    if (!packageUuid.value) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Package UUID is missing'
      });
      return;
    }

    if (selectedServicesToRemove.value.length === 0) {
      addToast({
        type: 'info',
        title: 'No Selection',
        message: 'Please select services to remove'
      });
      return;
    }

    // Get remaining services (all existing minus selected for removal)
    const remainingServices = existingServices.value.filter(
      service => !selectedServicesToRemove.value.some(s => s.serviceId === service.serviceId)
    );

    const payload = {
      eligibleServiceUuids: remainingServices.map(service => service.eligibleServiceUuid)
    };

    const response = await addEligibleServices(packageUuid.value, payload);

    if (response?.success !== false) {
      addToast({
        type: 'success',
        title: 'Success',
        message: `${selectedServicesToRemove.value.length} service(s) removed from package successfully`
      });
      closeModal(true);
    } else {
      throw new Error(response?.message || 'Failed to remove services');
    }
  } catch (error) {
    console.error('Error removing services:', error);
    addToast({
      type: 'error',
      title: 'Error',
      message: error.message || 'Failed to remove services from package'
    });
  }
}

onMounted(() => {
  fetchExistingServices();
});
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Remove Services from Package"
      :subtitle="`Remove services from ${packageName}`"
    >
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-800">Remove Services</h3>
              <p class="text-sm text-gray-600">Select services to remove from this package</p>
            </div>
          </div>

          <!-- Search -->
          <div class="mb-4">
            <div class="relative">
              <Input
                v-model="searchTerm"
                placeholder="Search services by name, code, or category..."
                :attributes="{
                  class: 'pl-10 w-full bg-white border-red-200 focus:border-red-400'
                }"
              />
              <div class="absolute left-3 top-3 text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
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
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label for="selectAll" class="ml-2 text-sm text-gray-700 font-medium">
                Select All Services
              </label>
            </div>
            <div class="text-sm text-gray-500">
              {{ selectedServicesToRemove.length }} service(s) selected for removal
            </div>
          </div>

          <!-- Services Table -->
          <div v-if="loadingServices" class="flex justify-center py-8">
            <Spinner size="lg" />
          </div>

          <div v-else class="overflow-y-auto max-h-96 border border-red-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remove
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Code
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price (ETB)
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="service in filteredServices"
                  :key="service.serviceId"
                  :class="{
                    'bg-red-50': isServiceSelected(service),
                    'hover:bg-gray-50': !isServiceSelected(service)
                  }"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      :checked="isServiceSelected(service)"
                      @change="toggleServiceSelection(service)"
                      class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ service.itemCode || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ service.item || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ service.category || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ service.price?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}
                  </td>
                </tr>
                <tr v-if="filteredServices.length === 0">
                  <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
                    {{ existingServices.length === 0 ? 'No services in this package' : 'No services found matching your search' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Button @click="closeModal" variant="outline">
            Cancel
          </Button>

          <Button
            @click="removeServices"
            :pending="api.pending.value"
            :disabled="selectedServicesToRemove.length === 0"
            class="bg-red-500 hover:bg-red-600 text-white"
          >
            Remove {{ selectedServicesToRemove.length }} Service(s)
          </Button>
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
</style>