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
// Handle form submission
// Handle form submission
async function handleSubmit(formData) {
  try {
    pending.value = true;
    error.value = '';

    console.log('=== FORM SUBMISSION DEBUGGING ===');
    console.log('1. Raw formData received:', formData);
    console.log('2. FormData type:', typeof formData);
    console.log('3. Is FormData instance?', formData instanceof FormData);
    console.log('4. props.isEdit:', props.isEdit);
    console.log('5. providerUuid:', providerUuid.value);

    // If formData is already a FormData object, use it directly
    let payload = formData;

    // If it's a regular object, convert to FormData
    if (!(formData instanceof FormData)) {
      console.log('6. Converting regular object to FormData');
      console.log('7. FormData object keys:', Object.keys(formData));
      
      payload = new FormData();
      
      // Log all form data properties
      for (const key in formData) {
        console.log(`   - ${key}:`, formData[key], '(type:', typeof formData[key] + ')');
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

      console.log('8. providerRequest object:', providerRequest);
      payload.append('providerRequest', JSON.stringify(providerRequest));

      // Handle logo - check all possible logo properties
      console.log('9. Logo debugging:');
      console.log('   - providerLogo:', formData.providerLogo);
      console.log('   - logoBase64:', formData.logoBase64 ? 'Exists (base64 string)' : 'No base64');
      console.log('   - logo:', formData.logo);
      
      if (formData.providerLogo) {
        console.log('10. Adding providerLogo to FormData');
        payload.append('logo', formData.providerLogo);
      } else if (formData.logo) {
        console.log('10. Adding logo to FormData');
        payload.append('logo', formData.logo);
      } else if (formData.logoBase64) {
        console.log('10. Converting base64 to blob and adding to FormData');
        // Convert base64 to blob if needed
        const blob = base64ToBlob(formData.logoBase64);
        payload.append('logo', blob, 'logo.png');
      } else {
        console.log('10. No logo found in form data');
      }

      // Log FormData contents
      console.log('11. FormData contents:');
      for (let [key, value] of payload.entries()) {
        console.log(`   - ${key}:`, value);
      }
    } else {
      console.log('6. Using existing FormData object');
      console.log('7. FormData contents:');
      for (let [key, value] of payload.entries()) {
        console.log(`   - ${key}:`, value);
      }
    }

    console.log('=== END FORM DEBUGGING ===');

    // Determine if we're creating or updating
    const apiCall = props.isEdit ? updateProvider : createProvider;
    console.log('Making API call with:', payload);
    
    const result = await apiCall(payload);

    console.log('API response:', result);

    if (result && (result.success || result.status === 200 || result.status === 'success')) {
      const successMessage = props.isEdit 
        ? 'Provider updated successfully' 
        : 'Provider created successfully';
      
      console.log('Success:', successMessage);
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
    console.error('Submission error:', err);
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
  :is-edit="isEdit"
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
