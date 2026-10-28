<script setup >
import { useApiRequest } from "@/composables/useApiRequest";
import { createProvider, importProviders, downloadProviderTemplate } from "../api/providerApi";
import { ref } from "vue";
import { toasted } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true
  }
});

const registerReq = useApiRequest();
const importReq = useApiRequest();
const downloadReq = useApiRequest();
const fileInputRef = ref<HTMLInputElement | null>(null);

function register(formData) {
  console.log('Registration form data received:', formData);
  
  // Check if required fields are present
  const providerJson = formData.get('provider');
  if (!providerJson) {
    const errorMsg = 'Missing provider data';
    toasted(false,'', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  try {
    const providerData = JSON.parse(providerJson );
    
    const requiredProviderFields = [
      'providerName', 
      'threeDigitAcronym', 
      'tinNumber', 
      'category'
    ];

    const missingFields = requiredProviderFields.filter(field => {
      const value = providerData[field];;
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      const errorMsg = `Missing required Provider fields: ${missingFields.join(', ')}`;
      console.error('Validation failed:', errorMsg);
      // toasted(false,'', errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    return sendRegistrationRequest(formData);
  } catch (error) {
    console.error('Error parsing provider data:', error);
    toasted(false, 'Invalid provider  data format');
    return Promise.reject(error);
  }
}

function sendRegistrationRequest(formData) {
  console.log('Sending registration request with form data');
  
  return new Promise((resolve, reject) => {
    registerReq.send(
      () => createProvider(formData), // Make sure your API function accepts FormData
      (response) => {
        if (response.success) {
          console.log('Registration successful:', response.data);
          toasted(true, 'Provider registered successfully');
          resolve(response);
        } else {
          console.error('Registration failed:', response.error);
          const errorMsg = response.error || 'Failed to register provider';
          // toasted(false,'', errorMsg);
          reject(new Error(errorMsg));
        }
      }
    );
  });
}
function importFile(file) {
  return new Promise((resolve, reject) => {
    importReq.send(
      () => importProviders(file),
      (res) => {
        if (res.success) {
          toasted(true, 'Institutions imported successfully');
          resolve(res);
        } else {
          toasted(false, res.error || 'Failed to import institutions');
          reject(new Error(res.error || 'Failed to import institutions'));
        }
      }
    );
  });
}

function downloadTemplate() {
  downloadReq.send(
    () => downloadProviderTemplate(),
    (res) => {
      try {
        const url = window.URL.createObjectURL(new Blob([res]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'institution_template.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading template:', error);
        toasted(false, 'Failed to download template');
      }
    }
  );
}

defineExpose({
  register,
  importFile,
  downloadTemplate,
  fileInputRef,
  pending: registerReq.pending
});
</script>

<template>
  <slot
    :register="register"
    :registerPending="registerReq.pending.value"
    :registerError="registerReq.error.value"
    :importFile="importFile"
    :importPending="importReq.pending.value"
    :importError="importReq.error.value"
    :downloadTemplate="downloadTemplate"
    :downloadPending="downloadReq.pending.value"
    :fileInputRef="fileInputRef"
  />
</template>