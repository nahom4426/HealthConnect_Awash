<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import ProviderForm from "./ProviderForm.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import { ref, onMounted, watch } from "vue";
import { updateProvider, createProvider } from "../api/providerApi";
import { useAddProviders } from "../store/AddprovidersStore";

// In modal-x, props are passed via the 'data' prop
const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

// Initialize the providers store
const providersStore = useAddProviders();
const isEdit = ref(true);

const error = ref('');
const pending = ref(false);
const providerData = ref({});
const providerUuid = ref('');

// Log props for debugging
onMounted(() => {
  
  // Extract the actual props from the data object
  if (props.data) {
    providerUuid.value = props.data.providerUuid || '';
    providerData.value = props.data.provider || {};
    
  }
});

// Watch for changes in props.data
watch(() => props.data, (newData) => {
  if (newData) {
    providerUuid.value = newData.providerUuid || '';
    providerData.value = newData.provider || {};
  }
}, { deep: true });

// Handle form submission
// Handle form submission
// Handle form submission
async function handleSubmit(formData) {
  try {
    pending.value = true;
    error.value = '';


    // If formData is already a FormData object, use it directly
    let payload = formData;

    // If it's a regular object, convert to FormData
    if (!(formData instanceof FormData)) {
      
      payload = new FormData();
      
      // Log all form data properties
      for (const key in formData) {
      }
      
      // Create providerRequest object
      const providerRequest = {
        providerUuid:formData.providerUuid,
        providerName: formData.providerName,
        description: formData.description || "",
        email: formData.email,
        telephone: formData.telephone,
        to_company: formData.to_company || "",
        category: formData.category,
        format: formData.format || "",
        address: formData.address || "",
        address1: formData.address1 || "",
        address2: formData.address2 || "",
        address3: formData.address3 || "",
        address4: formData.address4 || "",
        address5: formData.address5 || "",
        address6: formData.address6 || "",
        address7: formData.address7 || "",
        state: formData.state || "Ethiopia",
        country: formData.country || "Ethiopia",
        tinNumber: formData.tinNumber,
        status: formData.status || "ACTIVE",
        threeDigitAcronym: formData.threeDigitAcronym || ""
      };

      // Include providerUuid for updates
      if (props.isEdit && providerUuid.value) {
        providerRequest.providerUuid = providerUuid.value;
      }

      payload.append('providerRequest', JSON.stringify(providerRequest));

      // Handle logo - check all possible logo properties
      
      if (formData.providerLogo) {
        payload.append('logo', formData.providerLogo);
      } else if (formData.logo) {
        payload.append('logo', formData.logo);
      } else if (formData.logoBase64) {
        // Convert base64 to blob if needed
        const blob = base64ToBlob(formData.logoBase64);
        payload.append('logo', blob, 'logo.png');
      } else {
      }
    } else {
      for (let [key, value] of payload.entries()) {
      }
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
      
      // Refresh providers list
      await providersStore.fetchProviders();
      
      const callback = props.isEdit 
        ? props.data.onUpdated 
        : props.data.onCreated;
      
      if (callback && typeof callback === 'function') {
        callback(result.data);
      }
    } else {
      throw new Error(result?.error || result?.message || `Failed to ${props.isEdit ? 'update' : 'create'} provider`);
    }
  } catch (err) {
    error.value = err.message || `An error occurred while ${props.isEdit ? 'updating' : 'creating'} provider`;
    // toasted(false, error.value);
  } finally {
    pending.value = false;
  }
}

// Helper function to convert base64 to blob
function base64ToBlob(base64) {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: 'image/png' });
}
</script>
<template>
  <ModalParent>
    <NewFormParent 
      :isEdit="true"
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
