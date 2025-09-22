<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import { useToast } from '@/toast/store/toast';
import { mapContracts } from '@/features/providers/api/providerApi'; // Adjust import path as needed
import icons from "@/utils/icons";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const { addToast } = useToast();
const api = useApiRequest();

const providerName = props.data?.providerName || 'this provider';
const payerProviderContractUuid = props.data?.payerProviderContractUuid;
const payerInstitutionContractUuid = props.data?.payerInstitutionContractUuid;

function confirmAdd() {
  if (!payerProviderContractUuid || !payerInstitutionContractUuid) return;

  const payload = [{
    payerProviderContractUuid,
    payerInstitutionContractUuid
  }];

  api.send(
    () => mapContracts(payload),
    (res) => {
      if (res.success) {
        props.data?.onConfirm?.(res);
        closeModal();
      } else {
        // Handle failure if needed
        console.error(res.message || 'Failed to add provider');
      }
    }
  );
}

</script>

<template>
   <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <ModalParent id="confirm-add-provider-modal">
    <NewFormParent
      class="m-2 p-2"
      size="md"
      title="Confirm Add Provider"
      subtitle="Are you sure you want to add this provider?"
    >
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i v-html="icons.hospital_building || '🏥'" class="w-6 h-6 text-white"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ providerName }}</h3>
              <p class="text-sm text-gray-600">This provider will be added to the current contract</p>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 text-yellow-600 mt-0.5">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-medium text-yellow-800">Please confirm</h4>
              <p class="text-sm text-yellow-700 mt-1">
                This action will map the provider contract to the institution contract. Make sure this is the correct provider you want to add.
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #bottom>
        <div class="flex gap-4 m-2 p-2 justify-end items-center w-full">
          <Button
            @click="closeModal"
            variant="outline"
            class="border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          
          <Button
            @click="confirmAdd"
            :pending="api.pending.value"
            class="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <i v-html="icons.plus || '+'" class="w-4 h-4 mr-2"></i>
            Add Provider
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
  </div>
</template>