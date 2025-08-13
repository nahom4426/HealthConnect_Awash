<script setup>
import { ref, onMounted } from "vue";
import Button from "@/components/Button.vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { toast } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { importInsuredPersons } from "../api/insuredPersonsApi";
import { insuredMembers } from "../store/insuredPersonsStore";
import * as XLSX from 'xlsx';
import { useRoute } from "vue-router";

const route = useRoute();
const props = defineProps({
  data: String,
});

const auth = useAuthStore().auth?.user?.payerUuid;

const res = useApiRequest();
const insuredStore = insuredMembers();

const fileInput = ref(null);
const selectedFile = ref(null);
const fileName = ref("");
const importing = ref(false);
const progress = ref(0);
const message = ref({ type: null, text: null, isHtml: false });
const wasSuccessful = ref(false);

// For Excel preview
const previewData = ref([]);
const previewHeaders = ref([]);
const showPreview = ref(false);
const previewLoading = ref(false);
const maxPreviewRows = 3;
const maxPreviewHeight = "200px";

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
};

const parseFileForPreview = async (file) => {
  if (!file) return;
  
  previewLoading.value = true;
  
  try {
    const data = await readFileAsync(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length > 0) {
      previewHeaders.value = jsonData[0];
      previewData.value = jsonData.slice(1);
      showPreview.value = true;
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    message.value = { 
      type: "error", 
      text: "Could not parse file for preview. Please ensure it's a valid Excel/CSV file.",
      isHtml: false
    };
  } finally {
    previewLoading.value = false;
  }
};

const readFileAsync = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

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

  res.send(
    () => importInsuredPersons(
      {
        institutionUuid: route.params.institutionUuid,
        payerInstitutionContractUuid: route.params.id,
        payerUuid: auth // Include payerUuid from auth store
      },
      fd,
      {
        onUploadProgress: (e) => {
          progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
        }
      }
    ),
    (response) => {
      importing.value = false;

      if (response.success) {
        // Get the success message - first try response.data.message, then construct from successfulImports
        const successMessage = response.data?.message || 
          `Successfully imported ${response.data?.successfulImports || response.data?.importedInsured?.length || 0} records`;

        let messageText = `
          <div class="bg-green-50 border border-green-100 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 class="text-sm font-medium text-green-800">Import Successful!</h4>
                <p class="text-sm text-green-700 mt-1">${successMessage}</p>
              </div>
            </div>
          </div>
        `;

        // Handle skipped records if they exist
        if (response.data?.skippedInsured?.length > 0) {
          messageText += `
            <div class="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <div class="flex items-start">
                <svg class="h-5 w-5 text-yellow-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-yellow-800">Skipped Records (${response.data.skippedInsured.length})</h4>
                  <ul class="text-xs text-yellow-700 mt-1 space-y-1 max-h-40 overflow-y-auto">
                    ${response.data.skippedInsured.map(skipped => `<li class="pl-1">${skipped}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          `;
        }

        // Handle errors if they exist
        if (response.data?.errors?.length > 0) {
          messageText += `
            <div class="mt-4 bg-red-50 border border-red-100 rounded-lg p-4">
              <div class="flex items-start">
                <svg class="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-red-800">Errors (${response.data.errors.length})</h4>
                  <ul class="text-xs text-red-700 mt-1 space-y-1 max-h-40 overflow-y-auto">
                    ${response.data.errors.map(error => `<li class="pl-1">${error}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          `;
        }

        message.value = {
          type: "success",
          text: messageText,
          isHtml: true
        };
        wasSuccessful.value = true;

        // Update the store with imported data if available
        if (response.data?.importedInsured && Array.isArray(response.data.importedInsured)) {
          const currentData = insuredStore.getAll();
          const mergedData = [
            ...response.data.importedInsured,
            ...currentData.filter(
              item => !response.data.importedInsured.some(
                newItem => newItem.insuredUuid === item.insuredUuid
              )
            )
          ];
          insuredStore.setAll(mergedData);
        }
      } else {
        // Error handling
        message.value = {
          type: "error",
          text: `
            <div class="bg-red-50 border border-red-100 rounded-lg p-4">
              <div class="flex items-start">
                <svg class="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-red-800">Import Failed</h4>
                  <p class="text-sm text-red-700 mt-1">${response.error || response.message || "An unknown error occurred during import"}</p>
                </div>
              </div>
            </div>
          `,
          isHtml: true
        };
      }
    }
  );
};
const handleFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (!validTypes.includes(file.type)) {
    message.value = { 
      type: "error", 
      text: "Please upload a valid Excel (.xlsx, .xls) or CSV file",
      isHtml: false 
    };
    return;
  }

  // Check file size (5MB max)
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
  parseFileForPreview(file);
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const removeFile = () => {
  reset();
  fileInput.value.value = "";
};

const title = props.data === "dependant" ? "Import Dependant Data" : "Import Employee Data";
</script>

<template>
  <div class="bg-black/50 min-h-full p-6 grid place-items-center">
    <ModalParent id="import-modal">
      <NewFormParent
        size="mdd"
        class="bg-white rounded-lg shadow-xl overflow-hidden"
        :title="title"
      >
        <div class="p-6">
          <div class="mb-6 text-center">
            <div class="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 class="mt-3 text-lg font-semibold text-gray-800">{{ title }}</h2>
            <p class="mt-1 text-sm text-gray-500">Upload your Excel or CSV file to import records</p>
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
                <p class="text-xs text-gray-500 mt-1">Supports .xlsx, .xls, .csv (Max 5MB)</p>
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

          <!-- Import results/messages -->
          <div v-if="message.text" class="mb-4 transition-all duration-300">
            <div v-if="message.isHtml" v-html="message.text"></div>
            <div v-else class="rounded-md p-3 text-sm" :class="{
              'bg-red-50 border border-red-100 text-red-700': message.type === 'error',
              'bg-blue-50 border border-blue-100 text-blue-700': !message.type
            }">
              {{ message.text }}
            </div>
          </div>

          <!-- Progress bar -->
          <div v-if="importing" class="mb-4">
            <div class="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                class="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                :style="`width: ${progress}%`" 
              />
            </div>
          </div>

          <!-- File preview -->
          <div v-if="previewLoading" class="my-4 text-center">
            <div class="inline-flex items-center">
              <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <span class="text-sm text-gray-600">Loading preview...</span>
            </div>
          </div>

        <div v-if="showPreview && previewData.length > 0 && !message.type" class="my-4 border rounded-lg overflow-hidden">
    <div class="text-sm font-medium text-gray-700 p-3 bg-gray-50 border-b flex justify-between items-center">
      <span>File Preview ({{ previewData.length }} rows)</span>
      <span class="text-xs text-gray-500">Scroll to see all columns</span>
    </div>
    <div class="overflow-auto custom-scrollbar" :style="`max-height: ${maxPreviewHeight}`">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th 
              v-for="(header, idx) in previewHeaders" 
              :key="idx"
              class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(row, rowIdx) in previewData" :key="rowIdx">
            <td 
              v-for="(cell, cellIdx) in row" 
              :key="cellIdx"
              class="px-3 py-2 whitespace-nowrap text-xs text-gray-500"
            >
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

          <!-- <div class="text-xs text-gray-500 mt-4 text-center">
            <p>Download our template file to ensure proper formatting.</p>
            <p class="mt-1">Need help? <a href="#" class="text-blue-500 hover:underline">View import guidelines</a></p>
          </div> -->
        </div>

        <template #bottom>
          <div class="flex justify-between items-center w-full p-4 border-t gap-3 bg-gray-50">
            <Button
              @click="closeModal('import-modal')"
              class="border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              size="md"
            >
              {{ wasSuccessful ? 'Close' : 'Cancel' }}
            </Button>
            <div class="flex gap-3">
              <Button
                v-if="selectedFile && !importing && !wasSuccessful"
                @click="reset"
                class="border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                size="md"
              >
                Change File
              </Button>
              <Button
                v-if="selectedFile && !importing && !wasSuccessful"
                @click="importFile"
                class="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                size="md"
                :disabled="importing"
              >
                <span class="flex items-center">
                  <svg v-if="importing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ importing ? 'Importing...' : 'Import Now' }}
                </span>
              </Button>
            </div>
          </div>
        </template>
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
</style>