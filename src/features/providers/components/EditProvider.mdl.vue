<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import ProviderForm from "./ProviderForm.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import { ref, onMounted, watch } from "vue";
import { updateProvider, createProvider } from "../api/providerApi";
import { useProviders } from "../store/providersStore";

// In modal-x, props are passed via the 'data' prop
const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

// Initialize the providers store
const providersStore = useProviders();

const error = ref('');
const pending = ref(false);
const providerData = ref({});
const providerUuid = ref('');

// Log props for debugging
onMounted(() => {
  console.log('EditProvider modal mounted with data prop:', props.data);
  
  // Extract the actual props from the data object
  if (props.data) {
    providerUuid.value = props.data.providerUuid || '';
    providerData.value = props.data.provider || {};
    
    console.log('Extracted provider UUID:', providerUuid.value);
    console.log('Extracted provider data:', providerData.value);
  }
});

// Watch for changes in props.data
watch(() => props.data, (newData) => {
  if (newData) {
    console.log('Data prop updated:', newData);
    providerUuid.value = newData.providerUuid || '';
    providerData.value = newData.provider || {};
  }
}, { deep: true });

// Handle form submission
async function handleSubmit(formValues) {
  try {
    pending.value = true;
    error.value = '';

    // Prepare the complete payload
    const payload = {
      providerUuid: formValues.providerUuid,
      providerName: formValues.providerName,
      description: formValues.description || "",
      email: formValues.email,
      telephone: formValues.telephone,
      category: formValues.category,
      level: formValues.level || "PRIMARY",
      address1: formValues.address1 || "",
      address2: formValues.address2 || "",
      address3: formValues.address3 || "",
      state: formValues.state || "Ethiopia",
      country: formValues.country || "Ethiopia",
      tinNumber: formValues.tinNumber,
      latitude: formValues.latitude || 0,
      longitude: formValues.longitude || 0,
      status: formValues.status || "ACTIVE",
      threeDigitAcronym: formValues.threeDigitAcronym || ""
    };

    // Include logo if available
    if (formValues.logoBase64) {
      payload.logoBase64 = formValues.logoBase64;
    }

    // Determine if we're creating or updating
    const apiCall = props.isEdit ? updateProvider : createProvider;
    const result = await apiCall(payload);

    if (result && (result.success || result.status === 200 || result.status === 'success')) {
      const successMessage = props.isEdit 
        ? 'Provider updated successfully' 
        : 'Provider created successfully';
      
      toasted(true, successMessage);
      closeModal();
      
      const callback = props.isEdit 
        ? props.data.onUpdated 
        : props.data.onCreated;
      
      if (callback && typeof callback === 'function') {
        callback(result.data);
      }
    } else {
      throw new Error(result?.error || `Failed to ${props.isEdit ? 'update' : 'create'} provider`);
    }
  } catch (err) {
    console.error('Submission error:', err);
    error.value = err.message || `An error occurred while ${props.isEdit ? 'updating' : 'creating'} provider`;
    toasted(false, error.value);
  } finally {
    pending.value = false;
  }
}
</script>
<template>
  <ModalParent>
    <NewFormParent 
      class="" 
      size="lg" 
      title="Add Provider" 
      subtitle="Add this provider to the system"
    >
      <div class="bg-white rounded-lg">
        <div v-if="error" class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {{ error }}
        </div>
        
        <div v-if="!providerUuid || Object.keys(providerData).length === 0" class="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
          Loading provider data...
        </div>
        
        <ProviderForm
          v-else
          :initial-data="providerData"
          :is-edit="true"
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
