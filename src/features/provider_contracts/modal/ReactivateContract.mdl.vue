<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="🔄 Reactivate Contract"
      subtitle="Update contract information and restore to active status"
    >
      <div class="space-y-6">
        <!-- Form Component -->
        <ReactivateContractForm 
          :data="props.data" 
          formId="reactivateContractForm"
        />

        <!-- Validation Error -->
        <div v-if="validationError" class="flex items-start gap-3 p-4 text-sm text-red-800 bg-red-50 rounded-lg border-l-4 border-red-500 shadow-sm">
          <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <span class="font-medium">{{ validationError }}</span>
        </div>
      </div>

      <!-- Footer -->
      <template #bottom>
        <div class="flex gap-3 justify-end w-full p-4 border-t border-gray-200">
          <Button 
            @click="closeModal" 
            type="secondary"
            size="lg"
            class="border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            :pending="pending || api.pending.value" 
            @click.prevent="submit(handleUpdate)"
            type="primary"
            size="lg"
            class="bg-gradient-to-r from-[#02676B] to-[#01585B] hover:from-[#01585B] hover:to-[#014850] text-white shadow-lg hover:shadow-xl"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Reactivate Contract
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>

<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import ReactivateContractForm from "../components/form/ReactivateContractForm.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import { ref, computed } from "vue";
import { closeModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { updatePayerContract } from "../api/contractApi";
import { usecontracts } from "../store/cotractStore";

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

const api = useApiRequest();
const contractStore = usecontracts();
const { submit } = useForm("reactivateContractForm");

// Extract contract data
const contractData = computed(() => props.data?.data || props.data);
const contractUuid = computed(() => contractData.value.payerProviderContractUuid);
const providerUuid = computed(() => contractData.value.providerUuid);

// State
const pending = ref(false);
const validationError = ref("");

// Format date from YYYY-MM-DD to ISO for API
function formatDateForAPI(dateString) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
}

// Validate dates
function validateDates(beginDate, endDate) {
  const begin = new Date(beginDate);
  const end = new Date(endDate);

  if (end <= begin) {
    validationError.value = "End date must be after begin date";
    return false;
  }

  validationError.value = "";
  return true;
}

// Submit form
function handleUpdate({ values }) {
  // Validate dates
  if (!validateDates(values.beginDate, values.endDate)) {
    return;
  }

  pending.value = true;
  validationError.value = "";

  // Prepare payload
  const payload = {
    providerUuid: providerUuid.value,
    contractName: values.contractName,
    contractCode: values.contractCode,
    description: values.description,
    status: "ACTIVE",
    beginDate: formatDateForAPI(values.beginDate),
    endDate: formatDateForAPI(values.endDate)
  };

  // Make API call
  api.send(
    () => updatePayerContract(contractUuid.value, payload),
    (response) => {
      pending.value = false;
      if (response?.success) {
        // Update store with full contract data
        contractStore.update(contractUuid.value, { 
          ...contractData.value,
          ...payload,
          status: 'ACTIVE'
        });
        
        toasted(true, "Success", "Contract has been reactivated successfully");
        
        // Close modal and trigger parent refresh
        closeModal({ success: true, updatedContract: { ...contractData.value, ...payload, status: 'ACTIVE' } });
      } else {
        validationError.value = response?.error || "Failed to reactivate contract";
        toasted(false, "Error", response?.error || "Failed to reactivate contract");
      }
    }
  );
}
</script>

<style scoped>
/* Custom styles if needed */
</style>
