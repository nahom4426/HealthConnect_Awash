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
import { useRoute } from "vue-router";

const route = useRoute();

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

    // Validate required fields (same as add component)
    const requiredFields = [
      "firstName",
      "fatherName",
      "idNumber",
    ];

    const missingFields = requiredFields.filter((field) => !formValues[field]);
    if (missingFields.length > 0) {
      toasted(false, "Validation Error", `Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Prepare the insured data according to backend expectations (same as add component)
    const insuredPayload = {
      email: formValues.email || "",
      institutionUuid: formValues.institutionUuid || route.params.institutionUuid || "",
      payerInstitutionContractUuid: formValues.payerUuid || route.params.id || "",
      premium: 0,
      title: "string",
      firstName: formValues.firstName,
      fatherName: formValues.fatherName,
      grandFatherName: formValues.grandFatherName || "",
      birthDate: formValues.birthDate ? new Date(formValues.birthDate).toISOString() : "",
      phone: formValues.phone || null,
      branchOffice: "string",
      position: formValues.position || "",
      idNumber: formValues.idNumber,
      insuranceId: formValues.insuranceId || insuredUuid.value,
      address1: formValues.woreda || "",
      address2: formValues.city || "",
      address3: formValues.subcity || "",
      state: formValues.state || "Addis Ababa",
      country: formValues.country || "Ethiopia",
      status: formValues.status || "ACTIVE",
      gender: formValues.gender || ""
    };

    // Use FormData with multipart like the add component
    const formData = new FormData();
    formData.append('insuredRequest', JSON.stringify(insuredPayload));
    if (formValues.employeePhoto) {
      formData.append('profile', formValues.employeePhoto);
    }

    // Debug: log what we are sending
    console.log('EditInsured submit -> insuredUuid:', insuredUuid.value);
    console.log('EditInsured submit -> insuredPayload:', insuredPayload);
    console.log('EditInsured submit -> FormData entries:');
    for (const [k, v] of formData.entries()) {
      if (v instanceof File || v instanceof Blob) {
        console.log(`  - ${k}:`, `${v.constructor.name} type=${v.type || 'n/a'} size=${v.size}`);
      } else {
        console.log(`  - ${k}:`, v);
      }
    }

    // Call update API with insuredUuid as param and FormData
    const result = await updateInsured(insuredUuid.value, formData);

    // Handle response (adjust based on your API response structure)
    const isSuccess = result && (result.success || result.status === 200 || result.status === 'success' || result.data);

    if (isSuccess) {
      const responseData = result.data || result;
      
      // Process the updated insured data to include photo information
      const updatedInsured = {
        ...responseData,
        insuredUuid: insuredUuid.value,
        photoUrl: responseData.photoUrl || (responseData.photoPath 
          ? `${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/insured/photo/${responseData.photoPath}`
          : null),
      };

      // Update store
      insuredStore.update(insuredUuid.value, updatedInsured);

      // Show success message
      toasted(true, "Success", "Employee updated successfully");

      // Call callback if exists
      if (props.data.onUpdated && typeof props.data.onUpdated === "function") {
        props.data.onUpdated(updatedInsured);
      }

      closeModal();
    } else {
      throw new Error(result.error || "Update failed");
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
      title="Edit Employee" 
      subtitle="To update employee information, please modify the fields below."
    >
      <div class="bg-white rounded-lg">
        <div v-if="error" class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {{ error }}
        </div>

        <div v-if="!insuredUuid || Object.keys(insuredData).length === 0" class="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
          Loading employee data...
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