<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from "@/toast/store/toast";
import { getProviders } from "@/features/providers/api/providerApi";
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";
import { toasted } from '@/utils/utils';
import ButtonSpinner from '@/components/buttonSpinner.vue';
import { createNewContract } from '../api/contractApi';

const router = useRouter();
const toast = useToast();

// Form data
const formData = ref({
  providerUuid: '',
  contractName: '',
  contractCode: '',
  description: '',
  beginDate: '',
  endDate: '',
  status: 'ACTIVE'
});

const providers = ref([]);
const isLoading = ref(false);
const submitAttempted = ref(false);

// Fetch providers
onMounted(async () => {
  try {
    isLoading.value = true;
    const response = await getProviders();
    providers.value = response.data;
  } catch (error) {
    toast.error(error.message || "Failed to load providers");
  } finally {
    isLoading.value = false;
  }
});

// Date validation
const isEndDateValid = computed(() => {
  if (!formData.value.beginDate || !formData.value.endDate) return true;
  return new Date(formData.value.endDate) >= new Date(formData.value.beginDate);
});

// Submit form
const submitForm = async () => {
  submitAttempted.value = true;
  
  if (!formData.value.providerUuid) {
    toasted(false, "", "Please select a provider");
    return;
  }

  if (!formData.value.contractName) {
    toasted(false, "", "Contract name is required");
    return;
  }

  if (!formData.value.contractCode) {
    toasted(false, "", "Contract code is required");
    return;
  }

  if (!formData.value.beginDate) {
    toasted(false, "", "Effective date is required");
    return;
  }

  if (!formData.value.endDate) {
    toasted(false, "", "End date is required");
    return;
  }

  if (!isEndDateValid.value) {
    toasted(false, "", "End date must be after effective date");
    return;
  }

  isLoading.value = true;
  try {
    await createNewContract(formData.value);
    toasted(true, "Contract created successfully");
    router.push('/active_contracts');
  } catch (error) {
    toasted(false, "", error.message || "Failed to create contract");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <DefaultPage title="Create Provider Contract">
    <div class="bg-white rounded-md p-6 space-y-6">
      <!-- Contract Information Section -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="text-md text-[#02676B] font-medium border-b pb-2">Contract Information</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contract Name</label>
              <input
                v-model="formData.contractName"
                placeholder="e.g. Annual Service Contract"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-[#02676B] transition-all"
                :class="{ 'border-red-500': submitAttempted && !formData.contractName }"
                required
              />
              <p v-if="submitAttempted && !formData.contractName" class="text-red-500 text-xs mt-1">
                Contract name is required
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contract Code</label>
              <input
                v-model="formData.contractCode"
                placeholder="e.g. CONT-2023-001"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-[#02676B] transition-all"
                :class="{ 'border-red-500': submitAttempted && !formData.contractCode }"
                required
              />
              <p v-if="submitAttempted && !formData.contractCode" class="text-red-500 text-xs mt-1">
                Contract code is required
              </p>
            </div>
          </div>
        </div>

        <!-- Dates Section -->
        <div class="space-y-4">
          <h3 class="text-md text-[#02676B] font-medium border-b pb-2">Contract Period</h3>
          
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
              <input
                type="date"
                v-model="formData.beginDate"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-[#02676B] transition-all"
                :class="{ 'border-red-500': submitAttempted && !formData.beginDate }"
                required
              />
              <p v-if="submitAttempted && !formData.beginDate" class="text-red-500 text-xs mt-1">
                Effective date is required
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                v-model="formData.endDate"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-[#02676B] transition-all"
                :class="{
                  'border-red-500': submitAttempted && (!formData.endDate || !isEndDateValid)
                }"
                required
              />
              <p v-if="submitAttempted && !formData.endDate" class="text-red-500 text-xs mt-1">
                End date is required
              </p>
              <p v-if="submitAttempted && formData.endDate && !isEndDateValid" class="text-red-500 text-xs mt-1">
                Must be after effective date
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Information Section -->
      <div class="space-y-4">
        <h3 class="text-md text-[#02676B] font-medium border-b pb-2">Provider Information</h3>
        
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              v-model="formData.providerUuid"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-[#02676B] transition-all"
              :class="{ 'border-red-500': submitAttempted && !formData.providerUuid }"
              required
            >
              <option value="" disabled>Select a provider</option>
              <option 
                v-for="provider in providers" 
                :key="provider.providerUuid"
                :value="provider.providerUuid"
              >
                {{ provider.providerName }}
              </option>
            </select>
            <p v-if="submitAttempted && !formData.providerUuid" class="text-red-500 text-xs mt-1">
              Provider is required
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="formData.status"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-[#02676B] transition-all"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="space-y-4">
        <h3 class="text-md text-[#02676B] font-medium border-b pb-2">Description</h3>
        <textarea
          v-model="formData.description"
          rows="4"
          class="w-full p-2 border rounded focus:ring-2 focus:ring-[#02676B] transition-all"
          placeholder="Describe the contract terms and conditions..."
        ></textarea>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-4 pt-6 border-t">
        <button
          @click="router.push('/ProviderContracts/Active-Contracts')"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          :disabled="isLoading"
        >
          Cancel
        </button>
        
        <button
          @click="submitForm"
          class="px-4 py-2 bg-[#02676B] text-white rounded-md text-sm font-medium hover:bg-[#02494D] transition-colors flex items-center gap-2"
          :disabled="isLoading"
        >
          <ButtonSpinner v-if="isLoading" class="h-4 w-4 text-white" />
          <span v-else v-html="icons.contracts" class="w-4 h-4"></span>
          {{ isLoading ? 'Creating...' : 'Create Contract' }}
        </button>
      </div>
    </div>
  </DefaultPage>
</template>

<style scoped>
/* Enhanced form styling */
input, select, textarea {
  @apply border-gray-300 rounded shadow-sm;
}

input:focus, select:focus, textarea:focus {
  @apply border-[#02676B] ring-2 ring-[#02676B] outline-none;
}

.required-field {
  @apply border-l-2 border-[#02676B];
}

.error-field {
  @apply border-red-500;
}

.error-message {
  @apply text-red-500 text-xs mt-1;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Make date inputs required visually */
input[type="date"]:required {
  border-left: 2px solid #02676B;
}

/* Animation classes */
.highlight-change {
  animation: highlight 1s ease;
}

@keyframes highlight {
  0% { background-color: transparent; }
  50% { background-color: rgba(251, 191, 36, 0.3); }
  100% { background-color: transparent; }
}
</style>