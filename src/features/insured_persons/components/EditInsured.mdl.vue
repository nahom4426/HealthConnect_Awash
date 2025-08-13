<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import InsuredMemberForm from "../form/InsuredMemberForm.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import { ref, onMounted, watch } from "vue";
import { updateInsured } from "../api/insuredPersonsApi";
import { insuredMembers } from "../store/insuredPersonsStore";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const insuredStore = insuredMembers();
const error = ref('');
const pending = ref(false);
const insuredData = ref({});
const insuredUuid = ref('');

onMounted(() => {
  console.log('EditInsured modal mounted with data prop:', props.data);
  
  if (props.data) {
    insuredUuid.value = props.data.insuredUuid || '';
    insuredData.value = props.data.insured || {};
    
    console.log('Extracted insured UUID:', insuredUuid.value);
    console.log('Extracted insured data:', insuredData.value);
  }
});

watch(() => props.data, (newData) => {
  if (newData) {
    console.log('Data prop updated:', newData);
    insuredUuid.value = newData.insuredUuid || '';
    insuredData.value = newData.insured || {};
  }
}, { deep: true });

async function handleSubmit(formValues) {
  try {
    pending.value = true;
    error.value = '';

    if (!insuredUuid.value) {
      throw new Error('Insured UUID is missing');
    }

    const formData = new FormData();

    if (formValues.employeePhoto) {
      formData.append('photo', formValues.employeePhoto);
    }

    const insuredPayload = {
      firstName: formValues.firstName,
      payerUuid: formValues.payerUuid,
      fatherName: formValues.fatherName,
      grandFatherName: formValues.grandFatherName || formValues.grandfatherName,
      birthDate: formValues.birthDate ? `${formValues.birthDate}T00:00:00.000Z` : '',
      inactiveDate: formValues.inactiveDate ? `${formValues.inactiveDate}T00:00:00.000Z` : '',
      phone: formValues.phone || null,
      woreda: formValues.woreda || "",
      subcity: formValues.subcity || "",
      city: formValues.city || "",
      state: formValues.state || "Addis Ababa",
      country: formValues.country || "Ethiopia",
      idNumber: formValues.idNumber,
      position: formValues.position,
      gender: formValues.gender,
      status: formValues.status || "ACTIVE",
      email: formValues.email || "",
      insuredUuid: insuredUuid.value
    };

    if (!formValues.employeePhoto) {
      if (insuredData.value.photoBase64) {
        insuredPayload.photoBase64 = insuredData.value.photoBase64;
      } else if (insuredData.value.photoPath) {
        insuredPayload.photoPath = insuredData.value.photoPath;
      }
    }

    formData.append('insured', JSON.stringify(insuredPayload));

    const result = await updateInsured(insuredUuid.value, formData);
    const isSuccess = result && (result.success || result.status === 200 || result.status === 'success');

    if (isSuccess) {
      const updatedInsured = {
        ...insuredData.value,
        ...formValues,
        insuredUuid: insuredUuid.value
      };

      if (!formValues.employeePhoto) {
        if (insuredData.value.photoBase64) {
          updatedInsured.photoBase64 = insuredData.value.photoBase64;
        }
        if (insuredData.value.photoPath) {
          updatedInsured.photoPath = insuredData.value.photoPath;
        }
        if (insuredData.value.photoUrl) {
          updatedInsured.photoUrl = insuredData.value.photoUrl;
        }
      }

      insuredStore.update(insuredUuid.value, updatedInsured);
      toasted(true, 'Insured member updated successfully');

      if (props.data.onUpdated && typeof props.data.onUpdated === 'function') {
        props.data.onUpdated(updatedInsured);
      }

      closeModal();
    }
  } catch (err) {
    console.error('Update error:', err);
    error.value = err.message || 'An error occurred while updating insured member';
    toasted(false, 'Failed to update insured member', error.value);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent 
      size="lg" 
      title="Edit Insured Member" 
      subtitle="Update the insured member information in the fields below."
    >
      <div class="bg-white rounded-lg">
        <div v-if="error" class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {{ error }}
        </div>

        <div v-if="!insuredUuid || Object.keys(insuredData).length === 0" class="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
          Loading insured member data...
        </div>

        <InsuredMemberForm
          v-else
          :initial-data="insuredData"
          :is-edit="true"
          :institutionId="insuredData.payerUuid"
          :pending="pending"
          :onSubmit="handleSubmit"
          :onCancel="() => closeModal()"
        />
      </div>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
/* Additional styling if needed */
</style>
