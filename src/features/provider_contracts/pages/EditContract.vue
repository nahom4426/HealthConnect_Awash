<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from "@/toast/store/toast";
import { getProviders } from "@/features/providers/api/providerApi";
import icons from "@/utils/icons";
import { toasted } from '@/utils/utils';
import ButtonSpinner from '@/components/buttonSpinner.vue';
import { getPayerContractById, updatePayerContract } from '../api/contractApi';
import { useApiRequest } from '@/composables/useApiRequest';
import Input from '@/components/new_form_elements/Input.vue';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const { send } = useApiRequest();

const contractId = route.params.id;

// Form data
const formData = ref({
  providerUuid: '',
  contractName: '',
  contractCode: '',
  description: '',
  beginDate: '',
  endDate: '',
});

const providers = ref([]);
const isLoading = ref(false);
const isFetchingProviders = ref(false);
const isFetchingContract = ref(false);
const submitAttempted = ref(false);
const fetchError = ref(null);

// Fetch providers
const fetchProviders = async () => {
  try {
    isFetchingProviders.value = true;
    fetchError.value = null;
    const response = await getProviders({
      page: 1,
      limit: 25,
      status: "ACTIVE",
      search: ""
    });

    let list = [];
    if (Array.isArray(response)) {
      list = response;
    } else if (Array.isArray(response?.data)) {
      list = response.data;
    } else if (Array.isArray(response?.data?.data)) {
      list = response.data.data;
    } else if (Array.isArray(response?.data?.content)) {
      list = response.data.content;
    } else if (Array.isArray(response?.content)) {
      list = response.content;
    }

    providers.value = list;
  } catch (error) {
    fetchError.value = error.message || 'Failed to load providers';
    toast.error(fetchError.value);
  } finally {
    isFetchingProviders.value = false;
  }
};

// Fetch contract by id and prefill
const fetchContract = async () => {
  try {
    isFetchingContract.value = true;
    const response = await getPayerContractById(contractId);
    const data = response?.data || response; // in case service returns data directly
    if (!data) throw new Error('Failed to load contract');
    formData.value = {
      providerUuid: data.providerUuid || '',
      contractName: data.contractName || '',
      contractCode: data.contractCode || '',
      description: data.description || '',
      beginDate: data.beginDate ? data.beginDate.substring(0,10) : '',
      endDate: data.endDate ? data.endDate.substring(0,10) : '',
    };
  } catch (error) {
    toasted(false, '', error.message || 'Failed to load contract');
  } finally {
    isFetchingContract.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchProviders(), fetchContract()]);
});

// Date validation
const isEndDateValid = computed(() => {
  if (!formData.value.beginDate || !formData.value.endDate) return true;
  return new Date(formData.value.endDate) > new Date(formData.value.beginDate);
});

const hasProviders = computed(() => providers.value && providers.value.length > 0);

// Generate contract code based on provider name and random alphanumeric
const generateContractCode = (providerName) => {
  const providerPrefix = providerName.substring(0, 5).toUpperCase();
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${providerPrefix}-${randomString}`;
};

// Generate contract name based on provider name
const generateContractName = (providerName) => {
  const providerPrefix = providerName.substring(0, 5).toUpperCase();
  const randomNumber = Math.floor(10 + Math.random() * 90);
  return `${providerPrefix}-Awash-${randomNumber}`;
};

// Function to regenerate contract code
const regenerateContractCode = () => {
  const selectedProvider = providers.value.find(provider => provider.providerUuid === formData.value.providerUuid);
  if (selectedProvider) {
    formData.value.contractCode = generateContractCode(selectedProvider.providerName);
  } else {
    formData.value.contractCode = `CNTR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
};

// Function to regenerate contract name
const regenerateContractName = () => {
  const selectedProvider = providers.value.find(provider => provider.providerUuid === formData.value.providerUuid);
  if (selectedProvider) {
    formData.value.contractName = generateContractName(selectedProvider.providerName);
  } else {
    formData.value.contractName = `CONTRACT-${Math.floor(100 + Math.random() * 900)}`;
  }
};

// Submit form
const handleUpdateContract = () => {
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
  send(
    () => updatePayerContract(contractId, { ...formData.value, status: 'ACTIVE' }),
    (res) => {
      if (res.success) {
        toasted(true, "Contract Updated", "Contract updated successfully");
        router.push('/create_contract');
      } else {
        toasted(false, "Failed to Update Contract", res.error || "");
      }
      isLoading.value = false;
    }
  );
};
</script>

<template>
  <div class="p-8 space-y-8 bg-white rounded-xl shadow-lg">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold text-[#02676B]">Edit Contract</h2>
    </div>

    <!-- Provider Information Section -->
    <div class="space-y-6">
      <div class="flex items-center">
        <div class="w-10 h-10 rounded-full bg-[#e6f7f8] flex items-center justify-center mr-3">
          <span v-html="icons.provider" class="w-5 h-5 text-[#02676B]"></span>
        </div>
        <h3 class="text-lg font-semibold text-[#02676B]">Provider Information</h3>
      </div>

      <div class="grid gap-6 pl-12 md:grid-cols-2">
        <div>
          <label class="block flex items-center mb-2 text-sm font-medium text-gray-700">
            Provider
            <span class="ml-1 text-red-500">*</span>
          </label>

          <div v-if="isFetchingProviders" class="flex items-center p-3 space-x-2 rounded-lg border border-gray-300">
            <ButtonSpinner class="h-4 w-4 text-[#02676B]" />
            <span class="text-sm text-gray-500">Loading providers...</span>
          </div>

          <div v-else-if="fetchError" class="space-y-3">
            <div class="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-200">
              <strong>Error loading providers:</strong> {{ fetchError }}
            </div>
          </div>

          <div v-else-if="hasProviders">
            <select
              v-model="formData.providerUuid"
              class="w-full py-3 px-1 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[center_right_1rem] bg-[length:16px_16px] pr-10"
              :class="{ 'border-red-500': submitAttempted && !formData.providerUuid }"
              disabled
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
            <p v-if="submitAttempted && !formData.providerUuid" class="mt-1 ml-1 text-xs text-red-500">
              Provider is required
            </p>
          </div>

          <div v-else class="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            No providers available
          </div>
        </div>
      </div>
    </div>

    <!-- Contract Information Section -->
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full bg-[#e6f7f8] flex items-center justify-center mr-3">
            <span v-html="icons.document" class="w-5 h-5 text-[#02676B]"></span>
          </div>
          <h3 class="text-lg font-semibold text-[#02676B]">Contract Information</h3>
        </div>

        <div class="pl-12 space-y-5">
          <div>
            <label class="block flex items-center mb-2 text-sm font-medium text-gray-700">
              Contract Code
              <span class="ml-1 text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="formData.contractCode"
                placeholder="e.g. PVD-ABC123"
                class="w-full p-3  border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
                :class="{ 'border-red-500': submitAttempted && !formData.contractCode }"
                required
              />
              <button
                @click="regenerateContractCode"
                type="button"
                class="absolute right-1 top-1 px-3 py-2 text-xs font-medium text-[#02676B] bg-[#e6f7f8] rounded-md transition-all duration-200 hover:bg-[#02676B] hover:text-white flex items-center gap-1"
                :disabled="!formData.providerUuid"
              >
                <span v-html="icons.refresh" class="w-3 h-3"></span>
                Generate
              </button>
            </div>
            <p v-if="submitAttempted && !formData.contractCode" class="mt-1 ml-1 text-xs text-red-500">
              Contract code is required
            </p>
          </div>

          <div>
            <label class="block flex items-center mb-2 text-sm font-medium text-gray-700">
              Contract Name
              <span class="ml-1 text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="formData.contractName"
                placeholder="e.g. Annual Service Contract"
                class="w-full p-3  border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
                :class="{ 'border-red-500': submitAttempted && !formData.contractName }"
                required
              />
              <button
                @click="regenerateContractName"
                type="button"
                class="absolute right-1 top-1 px-3 py-2 text-xs font-medium text-[#02676B] bg-[#e6f7f8] rounded-md transition-all duration-200 hover:bg-[#02676B] hover:text-white flex items-center gap-1"
                :disabled="!formData.providerUuid"
              >
                <span v-html="icons.refresh" class="w-3 h-3"></span>
                Generate
              </button>
            </div>
            <p v-if="submitAttempted && !formData.contractName" class="mt-1 ml-1 text-xs text-red-500">
              Contract name is required
            </p>
          </div>

          <div>
            <label class="block flex items-center mb-2 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              v-model="formData.description"
              rows="4"
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#02676B] focus:border-[#02676B] transition-all shadow-sm"
              placeholder="Describe the contract terms and conditions..."
            ></textarea>
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

        <div class="grid gap-5 pl-12 md:grid-cols-2">
          <div>
            <Input
              name="beginDate"
              label="Effective Date"
              validation="required"
              v-model="formData.beginDate"
              :attributes="{
                type: 'date',
                min: ''
              }"
              :error="!formData.beginDate && submitAttempted"
              :error-message="!formData.beginDate && submitAttempted ? 'Effective date is required' : ''"
            />
          </div>

          <div>
            <Input
              name="endDate"
              label="End Date"
              validation="required"
              v-model="formData.endDate"
              :attributes="{
                type: 'date',
                min: formData.beginDate || new Date().toISOString().split('T')[0]
              }"
              :error="(!formData.endDate || !isEndDateValid) && submitAttempted"
              :error-message="
                !formData.endDate && submitAttempted ? 'End date is required' :
                (!isEndDateValid && submitAttempted ? 'End date must be after effective date' : '')
              "
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end pt-8 space-x-4 border-t">
      <button
        @click="router.push('/create_contract')"
        class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
        :disabled="isLoading"
      >
        <span v-html="icons.cancel" class="mr-2 w-4 h-4"></span>
        Cancel
      </button>

      <button
        @click="handleUpdateContract"
        class="px-6 py-3 bg-gradient-to-r from-[#02676B] to-[#02494D] text-white rounded-lg text-sm font-medium hover:from-[#02494D] hover:to-[#013436] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
        :disabled="isLoading || isFetchingProviders || isFetchingContract || fetchError"
      >
        <ButtonSpinner v-if="isLoading" class="w-4 h-4 text-white" />
        <span v-else v-html="icons.contracts" class="w-4 h-4"></span>
        {{ isLoading ? 'Updating...' : 'Update Contract' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
input, select, textarea {
  border-color: rgb(209 213 219); /* gray-300 */
}

input:focus, select:focus, textarea:focus {
  border-color: #02676B;
  outline: none;
  box-shadow: 0 0 0 2px rgba(2, 103, 107, 0.2);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>
