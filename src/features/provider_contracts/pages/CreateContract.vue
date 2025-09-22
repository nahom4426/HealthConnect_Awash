<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from "@/toast/store/toast";
import { getActiveProviders } from "@/features/providers/api/providerApi";
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
    const response = await getActiveProviders({
      page: 1,
      limit: 25,
      status: "ACTIVE",
      search: ""
    });
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
    router.push('/create_contract');
  } catch (error) {
    toasted(false, "", error.message || "Failed to create contract");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>

    <div class="bg-white rounded-xl p-8 space-y-8 shadow-lg">
      <!-- Contract Information Section -->
      <div class="grid md:grid-cols-2 gap-8">
        <div class="space-y-6">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-[#e6f7f8] flex items-center justify-center mr-3">
              <span v-html="icons.document" class="w-5 h-5 text-[#02676B]"></span>
            </div>
            <h3 class="text-lg font-semibold text-[#02676B]">Contract Information</h3>
          </div>
          
          <div class="space-y-5 pl-12">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                Contract Name
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                v-model="formData.contractName"
                placeholder="e.g. Annual Service Contract"
                class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
                :class="{ 'border-red-500': submitAttempted && !formData.contractName }"
                required
              />
              <p v-if="submitAttempted && !formData.contractName" class="text-red-500 text-xs mt-1 ml-1">
                Contract name is required
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                Contract Code
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                v-model="formData.contractCode"
                placeholder="e.g. CONT-2023-001"
                class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
                :class="{ 'border-red-500': submitAttempted && !formData.contractCode }"
                required
              />
              <p v-if="submitAttempted && !formData.contractCode" class="text-red-500 text-xs mt-1 ml-1">
                Contract code is required
              </p>
            </div>
          </div>
        </div>

        <!-- Dates Section -->
        <div class="space-y-6">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-[#e6f7f8] flex items-center justify-center mr-3">
              <span v-html="icons.calendar" class="w-5 h-5 text-[#02676B]"></span>
            </div>
            <h3 class="text-lg font-semibold text-[#02676B]">Contract Period</h3>
          </div>
          
          <div class="grid md:grid-cols-2 gap-5 pl-12">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                Effective Date
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                v-model="formData.beginDate"
                class="w-full py-3 px-1 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
                :class="{ 'border-red-500': submitAttempted && !formData.beginDate }"
                required
              />
              <p v-if="submitAttempted && !formData.beginDate" class="text-red-500 text-xs mt-1 ml-1">
                Effective date is required
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                End Date
                <span class="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                v-model="formData.endDate"
                class="w-full py-3 px-1 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
                :class="{
                  'border-red-500': submitAttempted && (!formData.endDate || !isEndDateValid)
                }"
                required
              />
              <p v-if="submitAttempted && !formData.endDate" class="text-red-500 text-xs mt-1 ml-1">
                End date is required
              </p>
              <p v-if="submitAttempted && formData.endDate && !isEndDateValid" class="text-red-500 text-xs mt-1 ml-1">
                Must be after effective date
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Information Section -->
      <div class="space-y-6">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full bg-[#e6f7f8] flex items-center justify-center mr-3">
            <span v-html="icons.provider" class="w-5 h-5 text-[#02676B]"></span>
          </div>
          <h3 class="text-lg font-semibold text-[#02676B]">Provider Information</h3>
        </div>
        
        <div class="grid md:grid-cols-2 gap-6 pl-12">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              Provider
              <span class="text-red-500 ml-1">*</span>
            </label>
            <select
              v-model="formData.providerUuid"
              class="w-full py-3 px-1 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[center_right_1rem] bg-[length:16px_16px] pr-10"
              :class="{ 'border-red-500': submitAttempted && !formData.providerUuid }"
              required
            >
              <option value="" disabled selected>Select a provider</option>
              <option 
                v-for="provider in providers" 
                :key="provider.providerUuid"
                :value="provider.providerUuid"
              >
                {{ provider.providerName }}
              </option>
            </select>
            <p v-if="submitAttempted && !formData.providerUuid" class="text-red-500 text-xs mt-1 ml-1">
              Provider is required
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mx-8 mb-2">
              Status
            </label>
            <div class="relative">
              <select
                v-model="formData.status"
                class=" py-3 px-8 mx-8 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[center_right_1rem] bg-[length:16px_16px] pr-10"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="space-y-6">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full bg-[#e6f7f8] flex items-center justify-center mr-3">
            <span v-html="icons.description" class="w-5 h-5 text-[#02676B]"></span>
          </div>
          <h3 class="text-lg font-semibold text-[#02676B]">Description</h3>
        </div>
        <div class="pl-12">
          <textarea
            v-model="formData.description"
            rows="4"
            class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
            placeholder="Describe the contract terms and conditions..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-4 pt-8 border-t">
        <button
          @click="router.push('/create_contract')"
          class="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
          :disabled="isLoading"
        >
          <span v-html="icons.cancel" class="w-4 h-4 mr-2"></span>
          Cancel
        </button>
        
        <button
          @click="submitForm"
          class="px-6 py-3 bg-gradient-to-r from-[#02676B] to-[#02494D] text-white rounded-lg text-sm font-medium hover:from-[#02494D] hover:to-[#013436] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          :disabled="isLoading"
        >
          <ButtonSpinner v-if="isLoading" class="h-4 w-4 text-white" />
          <span v-else v-html="icons.contracts" class="w-4 h-4"></span>
          {{ isLoading ? 'Creating...' : 'Create Contract' }}
        </button>
      </div>
    </div>
 
</template>

<style scoped>
/* Enhanced form styling */
input, select, textarea {
  @apply border-gray-300;
}

input:focus, select:focus, textarea:focus {
  @apply border-[#02676B] ring-2 ring-[#02676B] ring-opacity-20 outline-none;
}

.required-field {
  @apply border-l-2 border-[#02676B];
}

.error-field {
  @apply border-red-500 ring-2 ring-red-500 ring-opacity-20;
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

/* Custom select arrow */
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>