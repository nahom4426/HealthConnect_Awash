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
const fileInputRef = (ref < HTMLInputElement) | (null > null);

function register(formData) {
  console.log("Registration form data received:", formData);

  const insuredJson = formData.get("insured");
  if (!insuredJson) {
    const errorMsg = "Missing insured data";
    toasted(false,'', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  try {
    const insuredData = JSON.parse(insuredJson);

    const requiredInsuredFields = [
      'payerUuid',
      'firstName',
      'fatherName',
      
      'idNumber',
    ];

    const missingFields = requiredInsuredFields.filter((field) => {
      const value = insuredData[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      const errorMsg = `Missing required Insured fields: ${missingFields.join(', ')}`;
      console.error('Validation failed:', errorMsg);
      // toasted(false, errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    return sendRegistrationRequest(formData);
  } catch (error) {
    console.error('Error parsing insured data:', error);
    // toasted(false, 'Invalid insured data format');
    return Promise.reject(error);
  }
}

function sendRegistrationRequest(formData) {
  console.log("Sending registration request with form data");

  return new Promise((resolve, reject) => {
    registerReq.send(
      () => createInsured(formData),
      (response) => {
        if (response.success) {
          console.log("Registration successful:", response.data);
          toasted(true, "Insured member registered successfully");
          resolve(response);
        } else {
          console.error("Registration failed:", response.error);
          const errorMsg =
            response.error || "Failed to register insured member";
          // toasted(false, '',errorMsg);
          reject(new Error(errorMsg));
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
