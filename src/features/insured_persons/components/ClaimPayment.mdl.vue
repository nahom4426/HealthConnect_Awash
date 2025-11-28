<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import Button from "@/components/Button.vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Input from "@/components/new_form_elements/Input.vue";
import { ClaimSettlePayment } from "@/features/claim/api/claimApi";
import { toast } from "@/utils/utils";

const props = defineProps({
  data: String,
  quotationUuid: String,
  batchCode: {
    type: String,
    default: ""
  },
  providerUuid: {
    type: String,
    default: ""
  },
  totalAmount: {
    type: String,
    default: ""
  },
  claimUuid: {
    type: String,
    default: ""
  }
});

// Form data
const formData = ref({
  providerUuid: props.data.providerUuid,
  batchCode: [props.data.batchCode].filter(Boolean),
  claimUuid: props.data.claimUuid,
  checkNumber: "",
  paymentType: "",
  amount: props.data.totalAmount,
  document: null
});

// State
const importing = ref(false);
const message = ref({ type: null, text: null, isHtml: false });
const fileInput = ref(null);
const selectedFile = ref(null);
const fileName = ref("");
const previewData = ref([]);
const previewHeaders = ref([]);
const showPreview = ref(false);
const previewLoading = ref(false);
const maxPreviewRows = 3;
const maxPreviewHeight = "200px";
const wasSuccessful = ref(false);
const progress = ref(0);

const route = useRoute();

onMounted(() => {
  console.log("Received props:", {
    batchCode: props.data.batchCode,
    providerUuid: props.data.providerUuid,
    claimUuid: props.data.claimUuid,
    amount: props.data.totalAmount
  });
});

// Submit form
const submitForm = async () => {
  try {
    importing.value = true;
    message.value = { type: null, text: null, isHtml: false };

    // Basic validations & sources
    const claimUuid = props.data.claimUuid || route.params.claimUuid;
    // if (!claimUuid) {
    //   throw new Error("Claim UUID is missing. Please try again from the claims list.");
    // }

    const providerUuid = props.data.providerUuid;
    if (!providerUuid) {
      throw new Error("Provider UUID is missing. Please try again from the claims list.");
    }

    const totalAmount = props.data.totalAmount;
    if (!totalAmount) {
      throw new Error("Total amount is missing. Please try again from the claims list.");
    }

    const batchCodes = [props.data.batchCode].filter(
      code => !!code && code.trim() !== ""
    );
    if (!batchCodes.length) {
      throw new Error("Batch code is missing. Please try again from the claims list.");
    }

    if (!selectedFile.value) {
      throw new Error("Please select a payment attachment file.");
    }

    // Build the inner payClaimRequest object (matches your Swagger example)
    const payClaimRequest = {
      providerUuid,
      batchCode: batchCodes,
      checkNumber: formData.value.checkNumber,
      paymentType: formData.value.paymentType,
      amount: props.data.totalAmount
    };

    console.log("Submitting settle payment request", {
      claimUuid,
      payClaimRequest,
      attachment: selectedFile.value?.name
    });     

    // Call API helper, which will create FormData as:
    // attachment: file, payClaimRequest: JSON string
    const response = await ClaimSettlePayment(
      {
        attachment: selectedFile.value,
        payClaimRequest,
      },
      claimUuid
    );

    // ClaimSettlePayment is wrapped by ApiService/responseHandler and returns AsyncResponse
    if (response && response.success) {
      const successMessage = (response.data && response.data.message) || "Claim payment submitted successfully";

      message.value = {
        type: "success",
        text: successMessage,
        isHtml: false,
      };

      wasSuccessful.value = true;

      toast.success(successMessage);
      closeModal();
    } else {
      // 4xx/5xx or logical failure: ApiResponseHandler already toasted the error
      const errorMessage =
        response?.error || (response && response.data && response.data.message) ||
        "Failed to submit claim payment. Please try again.";

      message.value = {
        type: "error",
        text: errorMessage,
        isHtml: false,
      };
      return;
    }

  } catch (error) {
    console.error("Error submitting claim payment:", error);
    message.value = {
      type: "error",
      text: error.message || "Failed to submit claim payment. Please try again.",
      text: error?.message || "Failed to submit claim payment. Please try again.",
      isHtml: false,
    };
  } finally {
    importing.value = false;
  }
};

// Close modal
const closeModal = () => {
  const modal = document.getElementById('import-modal');
  if (modal) modal.style.display = 'none';
  reset();
};

// Add/remove batch code
const addBatchCode = () => formData.value.batchCode.push("");

const removeBatchCode = (index) => {
  if (formData.value.batchCode.length > 1) {
    formData.value.batchCode.splice(index, 1);
  }
};

// Reset form
const reset = () => {
  progress.value = 0;
  importing.value = false;
  selectedFile.value = null;
  fileName.value = "";
  message.value = { type: null, text: null, isHtml: false };
  wasSuccessful.value = false;
  previewData.value = [];
  previewHeaders.value = [];
  showPreview.value = false;

  if (fileInput.value) fileInput.value.value = "";

  const responseData = formData.value.responseData;

  formData.value = {
    claimUuid: "",
    providerUuid: responseData?.providerUuid || "",
    batchCode: responseData?.batchCode
      ? (Array.isArray(responseData.batchCode)
          ? responseData.batchCode
          : [responseData.batchCode])
      : [""],
    checkNumber: "",
    paymentType: "",
    totalAmount: responseData?.totalAmount||"",
    responseData: responseData || null
  };
};

// Read file
const readFileAsync = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// File import
const importFile = () => {
  if (!selectedFile.value) {
    message.value = { type: "error", text: "Please select a file first", isHtml: false };
    return;
  }

  importing.value = true;
  progress.value = 0;
  message.value = { type: null, text: null, isHtml: false };

  const fd = new FormData();
  fd.append("file", selectedFile.value);

  const quotationUuid = props.quotationUuid || route.query.quotationUuid;
};

// Handle file selection
const handleFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (!validTypes.includes(file.type)) {
    message.value = {
      type: "error",
      text: "Please upload a valid file (Excel, CSV, PDF, or Word document)",
      isHtml: false
    };
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    message.value = {
      type: "error",
      text: "File size exceeds 5MB limit",
      isHtml: false
    };
    return;
  }

  selectedFile.value = file;
  fileName.value = file.name;

  message.value = { type: null, text: null, isHtml: false };

  if (
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    showPreview.value = true;
    previewHeaders.value = ["File Information"];
    previewData.value = [[`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`]];
  } else {
    if (typeof parseFileForPreview === "function") {
      parseFileForPreview(file);
    }
  }
};

const triggerFileInput = () => fileInput.value?.click();

const removeFile = () => {
  reset();
  if (fileInput.value) fileInput.value.value = "";
};

const title = props.data === "dependant" ? "Import Dependant Data" : "Claim Payment";
</script>

<template>
  <div class="bg-black/50 min-h-full p-6 grid place-items-center">
    <ModalParent id="import-modal">
      <NewFormParent
        size="md"
        class="bg-white rounded-lg shadow-xl overflow-hidden"
        :title="title"
      >
        <div class="p-6">
          <form @submit.prevent="submitForm" class="space-y-4">
           

           <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Payment Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.paymentType"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>Select payment type</option>
                <option value="CHECK">Check</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="DIGITAL">Digital</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Check Number <span class="text-red-500">*</span>
              </label>
              <Input
                v-model="formData.checkNumber"
                type="text"
                placeholder="Enter check number"
                required
                class="w-full"
              />
            </div>

            

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Amount <span class="text-red-500">*</span>
              </label>
              <Input
                :model-value="props.data.totalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                required
                readonly
                class="w-full"
              />
            </div>
             <!-- File upload area -->
          <div class="mb-4">
            <div
              @click="triggerFileInput"
              class="w-full max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors duration-200"
              :class="{ 
                'border-blue-400 bg-blue-50/50': selectedFile,
                'hover:border-blue-400': !selectedFile 
              }"
            >
              <template v-if="!selectedFile">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to select file or drag and drop</p>
                <p class="text-xs text-gray-500 mt-1">Supports .pdf, .xlsx, .xls, .csv (Max 5MB)</p>
              </template>
              <template v-else>
                <div class="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="mt-2 text-sm font-medium text-gray-700 truncate px-4">{{ fileName }}</p>
                <button 
                  @click.stop="removeFile" 
                  class="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center justify-center mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove file
                </button>
              </template>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".csv, .xlsx, .xls"
              class="hidden"
              @change="handleFile"
            />
          </div>

            <div class="pt-2">
              <Button
                type="submit"
                :loading="importing"
                class="w-full bg-primary text-white justify-center"
              >
                {{ importing ? 'Processing...' : 'Submit Payment' }}
              </Button>
            </div>

            <div v-if="message.text" class="mt-4">
              <div
                v-if="message.type === 'success'"
                class="p-3 rounded-md bg-green-50 text-green-700 text-sm"
              >
                {{ message.text }}
              </div>
              <div
                v-else-if="message.type === 'error'"
                class="p-3 rounded-md bg-red-50 text-red-700 text-sm"
              >
                {{ message.text }}
              </div>
            </div>
          </form>
        </div>
      </NewFormParent>
    </ModalParent>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Smooth transitions for elements */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Animation for progress bar */
@keyframes progress-pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.bg-blue-600 {
  animation: progress-pulse 1.5s ease-in-out infinite;
}

/* Form styles */
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.required:after {
  content: ' *';
  @apply text-red-500;
}
</style>