<script setup>
import { useApiRequest } from '@/composables/useApiRequest';
import { updateInstitutionById } from '@/features/institutions/api/institutionApi';
// import { useInstitution } from '../store/institutionStore';
import { ref } from 'vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import InstitutionForm from '../form/InstitutionForm.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import { toasted } from '@/utils/utils';
import ModalParent from '@/components/ModalParent.vue';
import { closeModal } from "@customizer/modal-x";
import { useInstitution } from '@/features/institutions/store/institutionStore';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});
console.log(props.data);
const showLocationSection = ref(false);
const showAdditionalSection = ref(false);
// Extract the institution data from the Proxy object
const data = ref({
  ...props.data.institution, // Spread the institution properties
  institutionUuid: props.data.institutionUuid || props.data.institution.institutionUuid
});
const institutionStore = useInstitution();
const updateReq = useApiRequest();
const { submit } = useForm('institution-form');

function update({ values }) {
  // Prepare the payload with proper field mapping
  const payload = {
    ...values,
    tinNumber: Number(values.tinNumber) || 0,
    address1: values.address1 || '', // woreda
    address2: values.address2 || '', // subCity
    address3: values.address3 || '', // city
    state: values.state || 'Addis Ababa',
    latitude: values.latitude || 9.145,
    longitude: values.longitude || 40.4897,
    status: 'ACTIVE',
    institutionUuid: data.value.institutionUuid
  };

  updateReq.send(
    () => updateInstitutionById(data.value.institutionUuid, payload),
    (res) => {
      if (res.success) {
        institutionStore.updateInstitution(data.value.institutionUuid, payload);
        toasted(res.success, 'Institution updated successfully', res.error);
        closeModal();
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Update Institution"
      subtitle="Edit the institution details below"
    >
      <InstitutionForm 
        :showLocationSection="showLocationSection"
        :showAdditionalSection="showAdditionalSection"
        @toggle-location="showLocationSection = !showLocationSection"
        @toggle-additional="showAdditionalSection = !showAdditionalSection"
        :data="data"
        :is-edit="true"
      />

      <template #bottom>
        <div class="flex gap-4 justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button 
            type="button"
            @click="closeModal" 
            class="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            :pending="updateReq.pending.value" 
            @click.prevent="submit(update)" 
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg v-if="!updateReq.pending.value" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ updateReq.pending.value ? 'Updating...' : 'Update Institution' }}
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>