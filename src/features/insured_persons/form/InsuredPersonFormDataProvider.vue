<script setup>
import { useApiRequest } from "@/composables/useApiRequest";
import {
  createInsured,
  importInsuredMembers,
  downloadInsuredTemplate,
} from "../api/insuredPersonsApi";
import { ref } from "vue";
import { toasted } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
});

const registerReq = useApiRequest();
const importReq = useApiRequest();
const downloadReq = useApiRequest();
const fileInputRef = ref(null);

async function register(payload) {
  console.log("Registration payload received:", payload);

  // Normalize to FormData with 'insured' JSON part
  let formData;
  if (payload instanceof FormData) {
    formData = payload;
  } else if (payload && typeof payload === 'object') {
    formData = new FormData();
    formData.append(
      'insuredRequest',
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );
  } else {
    const errorMsg = 'Invalid payload provided to register()';
    toasted(false, '', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  // Extract and parse 'insured' for validation
  const insuredPart = formData.get('insuredRequest');
  if (!insuredPart) {
    const errorMsg = 'Missing insured data';
    // toasted(false, '', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  try {
    let insuredData;
    if (insuredPart instanceof Blob) {
      const text = await insuredPart.text();
      insuredData = JSON.parse(text || '{}');
    } else if (typeof insuredPart === 'string') {
      insuredData = JSON.parse(insuredPart || '{}');
    } else {
      // Fallback: attempt to stringify unknown types
      insuredData = JSON.parse(String(insuredPart));
    }

    const requiredInsuredFields = [
      'firstName',
      'fatherName',
      'idNumber',
    ];

    const missingFields = requiredInsuredFields.filter((field) => {
      const value = insuredData[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      const errorMsg = `Missing required Insured fields: ${missingFields.join(', ')}`;
      console.error('Validation failed:', errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    // Debug: log all FormData entries
    console.log('FormData before submit (key -> value type):');
    for (let [key, value] of formData.entries()) {
      console.log(`  - ${key}:`, value instanceof File || value instanceof Blob ? `${value.constructor.name} (${value.type || 'n/a'})` : value);
    }

    // All good: send the prepared FormData directly
    return sendRegistrationRequest(formData);
  } catch (error) {
    console.error('Error parsing insured data:', error);
    return Promise.reject(error);
  }
}
function sendRegistrationRequest(payload) {
  console.log("Sending registration request (raw FormData):", payload);

  return new Promise((resolve, reject) => {
    registerReq.send(
      () => createInsured(payload),
      (response) => {
        if (response.success) {
          console.log("Registration successful:", response.data);
          resolve(response);
        } else {
          console.error("Registration failed:", response.error);
          reject(new Error(response.error || "Failed to register insured member"));
        }
      }
    );
  });
}

function importFile(file) {
  return new Promise((resolve, reject) => {
    importReq.send(
      () => importInsuredMembers(file),
      (res) => {
        if (res.success) {
          toasted(true, "Insured members imported successfully");
          resolve(res);
        } else {
          toasted(false, res.error || "Failed to import insured members");
          reject(new Error(res.error || "Failed to import insured members"));
        }
      }
    );
  });
}

function downloadTemplate() {
  downloadReq.send(
    () => downloadInsuredTemplate(),
    (res) => {
      try {
        const url = window.URL.createObjectURL(new Blob([res]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "insured_members_template.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading template:", error);
        toasted(false, "Failed to download template");
      }
    }
  );
}

defineExpose({
  register,
  importFile,
  downloadTemplate,
  fileInputRef,
  pending: registerReq.pending,
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
