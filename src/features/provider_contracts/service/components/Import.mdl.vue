<script setup>
import { ref } from "vue";
import Button from "@/components/Button.vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { importServices } from "../api/serviceApi";
import { importDrug } from "../api/drugApi";
import * as XLSX from 'xlsx';
import { useRoute } from "vue-router";

const route = useRoute();
const props = defineProps({
  data: String,
});

// State
const importResults = ref(null);
const showResults = ref(false);
const req = useApiRequest();
const auth = useAuthStore().auth?.user?.providerUuid;
const id = route.params.id;
const progress = ref(0);
const importing = ref(false);
const fileInput = ref();
const selectedFile = ref(null);
const fileName = ref("");
const message = ref({ type: null, text: null });
const wasSuccessful = ref(false);

// Preview
const previewData = ref([]);
const previewHeaders = ref([]);
const showPreview = ref(false);
const previewLoading = ref(false);
const maxPreviewHeight = "200px";

// Reset
const reset = () => {
  progress.value = 0;
  importing.value = false;
  selectedFile.value = null;
  fileName.value = "";
  message.value = { type: null, text: null };
  wasSuccessful.value = false;
  previewData.value = [];
  previewHeaders.value = [];
  showPreview.value = false;
  importResults.value = null;
  showResults.value = false;
  if (fileInput.value) fileInput.value.value = "";
};

// File read
const readFileAsync = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
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
      text: "Could not parse file for preview. Please ensure it's a valid Excel/CSV file."
    };
  } finally {
    previewLoading.value = false;
  }
};

// Import
const importFile = async () => {
  if (!selectedFile.value) {
    message.value = { type: "error", text: "Please select a file first" };
    return;
  }

  importing.value = true;
  progress.value = 0;
  message.value = { type: null, text: null };
  importResults.value = null;
  showResults.value = false;

  const fd = new FormData();
  fd.append("file", selectedFile.value);

  try {
    const apiCall = props.data === "drug"
      ? importDrug({ payerProviderContractUuid: id }, fd, {
          onUploadProgress: (e) => {
            progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          }
        })
      : importServices({ payerProviderContractUuid: id }, fd, {
          onUploadProgress: (e) => {
            progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          }
        });

    const response = await apiCall; // Directly await the API call

    // Check if response exists and has data
    if (!response || !response.data) {
      throw new Error("No valid response data from server");
    }

    const responseData = response.data;
    importResults.value = responseData;

    // Check if we have row results to process
    if (!responseData.rowResults || !Array.isArray(responseData.rowResults)) {
      throw new Error("Invalid response format - missing row results");
    }

    // Calculate actual success/error counts from rowResults if not provided
    const successCount = responseData.successCount || 
                       responseData.rowResults.filter(r => r.success).length;
    const errorCount = responseData.errorCount || 
                      responseData.rowResults.filter(r => r.error).length;

    // Update the counts in the response data
    responseData.successCount = successCount;
    responseData.errorCount = errorCount;

    // Determine if the import was successful
    const hasSuccess = successCount > 0;
    const firstError = responseData.rowResults.find(r => r.error);

    if (responseData.rowResults.length > 0) {
      message.value = {
        type: hasSuccess ? "success" : "error",
        text: hasSuccess
          ? `Import completed: ${successCount} success, ${errorCount} failed`
          : firstError?.message || "Import failed - see results below"
      };
      
      wasSuccessful.value = hasSuccess;
      showResults.value = true;

      if (hasSuccess) {
        toasted(true, props.data === "drug" 
          ? "Drug imported successfully" 
          : "Services imported successfully");
        setTimeout(() => closeModal(true), 20000);
      }
    } else {
      message.value = { 
        type: "error", 
        text: "No data was imported - file might be empty or invalid" 
      };
    }

  } catch (error) {
    console.error('Import error:', error);
    message.value = {
      type: "error",
      text: error.response?.data?.message || 
           error.message || 
           "Import failed due to an unexpected error"
    };
    showResults.value = true;
  } finally {
    importing.value = false;
  }
};

// File handling
const handleFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (!validTypes.includes(file.type)) {
    message.value = { type: "error", text: "Please upload Excel/CSV file" };
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    message.value = { type: "error", text: "File size exceeds 5MB limit" };
    return;
  }

  selectedFile.value = file;
  fileName.value = file.name;
  message.value = { type: null, text: null };
  parseFileForPreview(file);
};

const triggerFileInput = () => fileInput.value?.click();
const removeFile = () => reset();

const title = props.data === "drug" ? "Import Drug Data" : "Import Service Data";
</script>

<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <ModalParent id="import-modal">
      <NewFormParent size="mdd" class="bg-white rounded-xl shadow-2xl overflow-hidden">
        <div class="p-6 space-y-6">
          
          <!-- Title -->
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 class="mt-3 text-lg font-semibold text-gray-900">{{ title }}</h2>
            <p class="mt-1 text-sm text-gray-500">Upload your Excel or CSV file to import data</p>
          </div>

          <!-- Message -->
          <div v-if="message.text" class="rounded-md p-4 border shadow-sm"
            :class="{
              'bg-green-50 border-green-200 text-green-800': message.type === 'success',
              'bg-red-50 border-red-200 text-red-800': message.type === 'error',
              'bg-blue-50 border-blue-200 text-blue-800': !message.type
            }">
            <p class="text-sm font-medium leading-snug">{{ message.text }}</p>
          </div>

          <!-- File Upload -->
          <div @click="triggerFileInput"
            class="relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer"
            :class="{ 'border-blue-400 bg-blue-50/30': selectedFile, 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30': !selectedFile }">
            <template v-if="!selectedFile">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="mt-4 text-sm text-gray-600">Click to upload or drag and drop</p>
              <p class="mt-1 text-xs text-gray-500">Excel or CSV files up to 5MB</p>
              <input ref="fileInput" type="file" class="sr-only" @change="handleFile" />
            </template>
            <template v-else>
              <svg class="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="mt-2 text-sm font-medium text-gray-700 truncate">{{ fileName }}</p>
              <p class="mt-1 text-xs text-gray-500">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
              <button @click.stop="removeFile"
                class="mt-3 text-sm text-red-600 hover:text-red-500 font-medium">Remove file</button>
            </template>
          </div>

          <!-- Preview -->
          <div v-if="previewLoading" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>

          <div v-if="showPreview && previewData.length > 0" class="border rounded-lg overflow-hidden shadow-sm">
            <div class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-700">File Preview</h3>
              <span class="text-xs text-gray-500">{{ previewData.length }} rows</span>
            </div>
            <div class="overflow-auto custom-scrollbar" :style="`max-height: ${maxPreviewHeight}`">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th v-for="(header, idx) in previewHeaders" :key="idx"
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {{ header }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(row, rowIdx) in previewData" :key="rowIdx"
                    :class="rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors'">
                    <td v-for="(cell, cellIdx) in row" :key="cellIdx"
                      class="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Progress -->
          <div v-if="importing" class="space-y-2">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                :style="`width: ${progress}%`"></div>
            </div>
          </div>

          <!-- Results -->
          <div v-if="showResults && importResults" class="border rounded-lg overflow-hidden shadow-sm">
            <div class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-700">Import Results</h3>
              <div class="flex space-x-4">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ importResults.successCount || 0 }} Success
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {{ importResults.errorCount || 0 }} Failed
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {{ importResults.totalRows || 0 }} Total
                </span>
              </div>
            </div>
            <div class="overflow-auto custom-scrollbar" style="max-height: 200px">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th v-if="data === 'service'"
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service UUID
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(result, idx) in importResults.rowResults" :key="idx"
                    :class="[
                      result.success ? 'bg-green-50' : result.error ? 'bg-red-50' : 'bg-white',
                      'hover:bg-gray-100 transition-colors'
                    ]">
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{{ result.rowNumber }}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm">
                      <span v-if="result.success"
                        class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Success</span>
                      <span v-else-if="result.error"
                        class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>
                      <span v-else
                        class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Skipped</span>
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-500">{{ result.message || '-' }}</td>
                    <td v-if="data === 'service'" class="px-4 py-2 text-sm text-gray-500">{{ result.serviceUuid || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <template #bottom>
          <div class="bg-gray-50 px-4 py-3 flex justify-between sm:px-6 rounded-b-lg">
            <Button @click="closeModal" variant="outline" size="md" :disabled="importing">
              {{ showResults ? 'Close' : 'Cancel' }}
            </Button>
            <div class="flex space-x-3">
              <Button v-if="selectedFile && !importing && !showResults" @click="removeFile" variant="outline" size="md">
                Change File
              </Button>
              <Button v-if="selectedFile && !importing && !showResults" @click="importFile" variant="primary" size="md">
                Import Now
              </Button>
              <Button v-if="showResults" @click="reset" variant="primary" size="md">
                Import Again
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
  @apply h-2 w-2;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded-full;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>