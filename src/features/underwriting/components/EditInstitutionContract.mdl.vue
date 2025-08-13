<script setup>
import { useApiRequest } from '@/composables/useApiRequest';
import { ref } from 'vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import ContractForm from '../form/ContractForm.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import { toasted } from '@/utils/utils';
import ModalParent from '@/components/ModalParent.vue';
import { closeModal } from "@customizer/modal-x";
import { useInstitutionContract } from '../store/institutionContractsStore';
import { updateInstitutionContract } from '../api/underwritingApi';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

console.log(props.data);
const showLocationSection = ref(false);
const showAdditionalSection = ref(false);
const data = ref({
  ...props.data.contract, // Spread the institution properties
  payerInstitutionContractUuid: props.data.payerInstitutionContractUuid || props.data.contract.payerInstitutionContractUuid
});
const institution = useInstitutionContract();
const updateReq = useApiRequest();
const { submit } = useForm('create-contract-form');

function update({ values }) {
  console.log('🔹 update() called with values:', values);
  
  const payload = { ...values };
  console.log('🔹 Final payload to send:', payload);

  updateReq.send(
    () => {
      console.log('🔹 Sending request with UUID:', data.value.payerInstitutionContractUuid);
      return updateInstitutionContract(data.value.payerInstitutionContractUuid , payload);
    },
    (res) => {
      console.log('🔹 API response:', res);
      if (res.success) {
        institution.updateInstitution(res.data.payerInstitutionContractUuid, res.data);
        toasted(res.success, 'Institution updated successfully', res.error);
        closeModal();
      }
    }
  );
}


</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="Update Contract" subtitle="Edit the contract details below">
      <ContractForm :showLocationSection="showLocationSection" :showAdditionalSection="showAdditionalSection"
        @toggle-location="showLocationSection = !showLocationSection"
        @toggle-additional="showAdditionalSection = !showAdditionalSection" :data="data" :is-edit="true" />

      <template #bottom>
        <div class="flex gap-4 justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button type="button" @click="closeModal"
            class="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium">
            Cancel
          </Button>
          <Button type="button" :pending="updateReq.pending.value" @click.prevent="submit(update)"
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2">
            <svg v-if="!updateReq.pending.value" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ updateReq.pending.value ? 'Updating...' : 'Update Contract' }}
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>