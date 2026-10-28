<script setup>
import { ref } from "vue";
import Button from "@/components/Button.vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { importServices, getAllServices } from "../api/serviceApi";
import { importDrug } from "../api/drugApi";
import { importInstitutions } from "@/features/institutions/api/institutionApi";
import * as XLSX from 'xlsx';
import { useRoute } from "vue-router";
import { useServiceListStore } from "../store/serviceListStore";

const route = useRoute();

const props = defineProps({
  data: {
    type: [String, Object],
    default: "service",
  },
});

const importType = ref(typeof props.data === 'string' ? props.data : (props.data?.type || 'service'));
const onRefetch = typeof props.data === 'object' ? props.data?.onRefetch : undefined;

const triggerRefetch = () => {
  if (typeof onRefetch !== 'function') return;
  const delays = [0, 1500, 3500, 7000];
  delays.forEach((ms) => {
    window.setTimeout(() => {
      onRefetch();
    }, ms);
  });
};

// State
const importResults = ref(null);
const showResults = ref(false);
const req = useApiRequest();
const auth = useAuthStore().auth?.user?.providerUuid;
const id = route.params.id;
const currentProviderName = String(route.params.providerName || '').trim();
const serviceListStore = useServiceListStore();
const progress = ref(0);
const importing = ref(false);
const fileInput = ref();
const selectedFile = ref(null);
const fileName = ref("");
const message = ref({ type: null, text: null });
const wasSuccessful = ref(false);

const normalizeProviderName = (name) => {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const extractProviderNameFromFilename = (name) => {
  const file = String(name || '');
  // Expected export filename: services_{provider}_{YYYY-MM-DD}.xlsx
  const m = file.match(/services_([\w\-]+)_\d{4}-\d{2}-\d{2}\.(xlsx|xls|csv)$/i);
  if (!m) return '';
  return String(m[1] || '').replace(/_/g, ' ').trim();
};

const extractProviderNameFromSheet = (sheetRows) => {
  if (!Array.isArray(sheetRows)) return '';
  const maxRows = Math.min(sheetRows.length, 15);
  for (let r = 0; r < maxRows; r++) {
    const row = sheetRows[r];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const text = String(cell || '').toLowerCase();
      if (!text) continue;
      const isLabel = text.includes('provider') && text.includes('name');
      if (isLabel) {
        const right = row[c + 1];
        if (right != null && String(right).trim()) return String(right).trim();
        const below = sheetRows[r + 1]?.[c];
        if (below != null && String(below).trim()) return String(below).trim();
      }
      if (text.startsWith('provider:')) {
        return String(cell).split(':').slice(1).join(':').trim();
      }
      if (text.startsWith('provider name:')) {
        return String(cell).split(':').slice(1).join(':').trim();
      }
    }
  }
  return '';
};

const clearSelectedFile = () => {
  progress.value = 0;
  importing.value = false;
  selectedFile.value = null;
  fileName.value = '';
  previewData.value = [];
  previewHeaders.value = [];
  showPreview.value = false;
  importResults.value = null;
  showResults.value = false;
  wasSuccessful.value = false;
  if (fileInput.value) fileInput.value.value = '';
};

const validateProviderName = async (file) => {
  if (!file) return true;
  if (!currentProviderName) return true;
  try {
    const data = await readFileAsync(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const fileProviderName = extractProviderNameFromSheet(sheetRows);

    const providerFromName = extractProviderNameFromFilename(file?.name);
    const providerToCompare = fileProviderName || providerFromName;

    if (!providerToCompare) return true;

    if (normalizeProviderName(providerToCompare) !== normalizeProviderName(currentProviderName)) {
      message.value = {
        type: 'error',
        text: `Provider names don't match. Current: ${currentProviderName}. File: ${providerToCompare}. Please use the correct exported Excel.`
      };
      toasted(false, '', "Provider names don't match. Please use the correct exported Excel.");
      clearSelectedFile();
      return false;
    }

    return true;
  } catch (e) {
    return true;
  }
};

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

const refetchServicesList = async () => {
  try {
    const payerProviderContractUuid = route.params.id;
    if (!payerProviderContractUuid) {
      console.log("[Import] refetchServicesList skipped: missing route.params.id");
      return;
    }
    console.log("[Import] refetchServicesList: fetching services for contract", payerProviderContractUuid);
    const existingRes = await getAllServices(payerProviderContractUuid, { page: 0, limit: 25, search: "" });
    console.log("[Import] refetchServicesList: response=", existingRes);

    // ApiService returns AsyncResponse via responseHandler: { success, data, error }
    const payload = Object.prototype.hasOwnProperty.call(existingRes || {}, "data") ? existingRes.data : existingRes;

    const existingData = Array.isArray(payload?.content)
      ? payload.content
      : (Array.isArray(payload?.data?.content)
          ? payload.data.content
          : (Array.isArray(payload) ? payload : []));

    serviceListStore.set(existingData || []);
    console.log("[Import] refetchServicesList: store updated. items=", Array.isArray(existingData) ? existingData.length : 0);
  } catch (e) {
    console.error("Failed to refetch services after import", e);
  }
};

// Import
const importFile = async () => {
  if (!selectedFile.value) {
    message.value = { type: "error", text: "Please select a file first" };
    return;
  }

  if (importType.value !== "institution") {
    const ok = await validateProviderName(selectedFile.value);
    if (!ok) return;
  }

  importing.value = true;
  progress.value = 0;
  message.value = { type: null, text: null };
  importResults.value = null;
  showResults.value = false;

  const fd = new FormData();
  if (importType.value === "institution") {
    fd.append("institutions", selectedFile.value);
  } else {
    fd.append("file", selectedFile.value);
  }

  try {
    const apiCall = importType.value === "institution"
      ? importInstitutions(fd, {
          onUploadProgress: (e) => {
            progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          },
        })
      : (importType.value === "drug"
          ? importDrug({ payerProviderContractUuid: id }, fd, {
              onUploadProgress: (e) => {
                progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
              },
            })
          : importServices({ payerProviderContractUuid: id }, fd, {
              onUploadProgress: (e) => {
                progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
              },
            }));

    const response = await apiCall;

    // ApiService returns AsyncResponse via responseHandler: { success, data, error, status }
    if (!response?.success) {
      throw new Error(response?.error || "Import failed");
    }

    const responseData = response.data;
    if (!responseData) {
      throw new Error("No valid response data from server");
    }

    importResults.value = responseData;

    // Check if we have row results to process
    if (!responseData.rowResults || !Array.isArray(responseData.rowResults)) {
      // Some backends may return success without row details. Treat as success.
      message.value = {
        type: "success",
        text: "Import completed",
      };
      wasSuccessful.value = true;
      showResults.value = true;

      if (importType.value === "service") {
        console.log("[Import] success -> refetchServicesList (no rowResults)");
        await refetchServicesList();
        window.dispatchEvent(new CustomEvent('service-imported', { detail: { type: 'service' } }));
        triggerRefetch();
      }

      if (importType.value === "institution") {
        toasted(true, "Institutions imported successfully");
        if (typeof onRefetch === 'function') onRefetch();
      } else {
        toasted(true, importType.value === "drug" ? "Drug imported successfully" : "Services imported successfully");
      }
      closeModal(true);
      return;
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

    const totalRows =
      typeof responseData.totalRows === "number"
        ? responseData.totalRows
        : (Array.isArray(responseData.rowResults) ? responseData.rowResults.length : 0);

    if (responseData.rowResults.length > 0) {
      message.value = {
        // HTTP request succeeded. Outcome depends on row-level results.
        type: hasSuccess ? "success" : "error",
        text: hasSuccess
          ? `Import completed: ${successCount} success, ${errorCount} failed`
          : (firstError?.message || `Import completed: ${successCount} success, ${errorCount} failed`)
      };
      
      wasSuccessful.value = hasSuccess;
      showResults.value = true;

      // Only refetch and close if at least one row actually imported.
      if (hasSuccess && importType.value === "service") {
        console.log("[Import] success -> refetchServicesList (rowResults present)");
        await refetchServicesList();
        window.dispatchEvent(new CustomEvent('service-imported', { detail: { type: 'service' } }));
        triggerRefetch();
      }

      if (hasSuccess && importType.value === "institution") {
        if (typeof onRefetch === 'function') onRefetch();
      }

      if (hasSuccess) {
        if (importType.value === "institution") {
          toasted(true, "Institutions imported successfully");
        } else {
          toasted(true, importType.value === "drug" 
            ? "Drug imported successfully" 
            : "Services imported successfully");
        }
        closeModal(true);
      }
    } else if (totalRows > 0) {
      // Backend processed rows but didn't return per-row details.
      message.value = {
        type: hasSuccess ? "success" : "error",
        text: hasSuccess
          ? `Import completed: ${successCount} success, ${errorCount} failed`
          : `Import completed: ${successCount} success, ${errorCount} failed`,
      };

      wasSuccessful.value = hasSuccess;
      showResults.value = true;

      if (hasSuccess && importType.value === "service") {
        console.log("[Import] success -> refetchServicesList (rowResults empty, totalRows > 0)");
        await refetchServicesList();
        window.dispatchEvent(new CustomEvent('service-imported', { detail: { type: 'service' } }));
        triggerRefetch();
      }

      if (hasSuccess && importType.value === "institution") {
        if (typeof onRefetch === 'function') onRefetch();
      }

      if (hasSuccess) {
        if (importType.value === "institution") {
          toasted(true, "Institutions imported successfully");
        } else {
          toasted(true, importType.value === "drug"
            ? "Drug imported successfully"
            : "Services imported successfully");
        }
        closeModal(true);
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
      text: error?.response?.data?.message || 
           error?.message || 
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

  // Check file extension instead of MIME type
  const name = file.name.toLowerCase();
  const validExtensions = ['.csv', '.xls', '.xlsx'];
  
  // Get the file extension properly
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex === -1) {
    message.value = { type: "error", text: "Please upload Excel (.xls, .xlsx) or CSV file" };
    return;
  }
  
  const fileExtension = name.substring(lastDotIndex);
  
  console.log('File name:', name);
  console.log('File extension:', fileExtension);
  console.log('Valid extensions:', validExtensions);
  console.log('Is valid:', validExtensions.includes(fileExtension));
  
  if (!validExtensions.includes(fileExtension)) {
    message.value = { type: "error", text: "Please upload Excel (.xls, .xlsx) or CSV file" };
    return;
  }

  // Remove or comment out the MIME type check for now, or make it more permissive
  // if (file.type && file.type !== "" && 
  //     file.type !== "application/octet-stream" &&
  //     file.type !== "text/csv" &&
  //     file.type !== "application/vnd.ms-excel" &&
  //     file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
  //   message.value = { type: "error", text: "Please upload Excel/CSV file" };
  //   return;
  // }

  if (file.size > 5 * 1024 * 1024) {
    message.value = { type: "error", text: "File size exceeds 5MB limit" };
    return;
  }

  selectedFile.value = file;
  fileName.value = file.name; // Use the ref, not local variable
  message.value = { type: null, text: null };
  
  if (importType.value === "institution") {
    parseFileForPreview(file);
    return;
  }

  validateProviderName(file).then((ok) => {
    if (!ok) return;
    parseFileForPreview(file);
  });
};

const triggerFileInput = () => fileInput.value?.click();
const removeFile = () => reset();

const title = importType.value === "drug"
  ? "Import Drug Data"
  : (importType.value === "institution" ? "Import Institution Data" : "Import Service Data");
</script>

<template>
  <div class="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50">
    <ModalParent id="import-modal">
      <NewFormParent size="mdd" class="flex flex-col bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
        <div class="overflow-y-auto overflow-x-hidden p-6 space-y-6 custom-scrollbar">
          
          <!-- Title -->
          <div class="text-center">
            <div class="flex justify-center items-center mx-auto w-12 h-12 bg-blue-100 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 class="mt-3 text-lg font-semibold text-gray-900">{{ title }}</h2>
            <p class="mt-1 text-sm text-gray-500">Upload your Excel or CSV file to import data</p>
          </div>

          <!-- Message -->
          <div v-if="message.text" class="p-4 rounded-md border shadow-sm"
            :class="{
              'bg-green-50 border-green-200 text-green-800': message.type === 'success',
              'bg-red-50 border-red-200 text-red-800': message.type === 'error',
              'bg-blue-50 border-blue-200 text-blue-800': !message.type
            }">
            <p class="text-sm font-medium leading-snug">{{ message.text }}</p>
          </div>

          <!-- File Upload -->
          <div @click="triggerFileInput"
            class="relative p-8 text-center rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer"
            :class="{ 'border-blue-400 bg-blue-50/30': selectedFile, 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30': !selectedFile }">
            <template v-if="!selectedFile">
              <svg class="mx-auto w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="mt-4 text-sm text-gray-600">Click to upload or drag and drop</p>
              <p class="mt-1 text-xs text-gray-500">Excel or CSV files up to 5MB</p>
              <input ref="fileInput" type="file" class="sr-only" @change="handleFile" />
            </template>
            <template v-else>
              <svg class="mx-auto w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="mt-2 text-sm font-medium text-gray-700 truncate">{{ fileName }}</p>
              <p class="mt-1 text-xs text-gray-500">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
              <button @click.stop="removeFile"
                class="mt-3 text-sm font-medium text-red-600 hover:text-red-500">Remove file</button>
            </template>
          </div>

          <!-- Preview -->
          <div v-if="previewLoading" class="flex justify-center items-center py-8">
            <div class="w-8 h-8 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
          </div>

          <div v-if="showPreview && previewData.length > 0" class="overflow-hidden rounded-lg border shadow-sm">
            <div class="flex justify-between items-center px-4 py-3 bg-gray-50 border-b">
              <h3 class="text-sm font-medium text-gray-700">File Preview</h3>
              <span class="text-xs text-gray-500">{{ previewData.length }} rows</span>
            </div>
            <div class="overflow-x-scroll overflow-y-scroll custom-scrollbar" :style="`height: ${maxPreviewHeight}`">
              <table class="min-w-max divide-y divide-gray-200">
                <thead class="sticky top-0 bg-gray-50">
                  <tr>
                    <th v-for="(header, idx) in previewHeaders" :key="idx"
                      class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                      {{ header }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(row, rowIdx) in previewData" :key="rowIdx"
                    :class="rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors'">
                    <td v-for="(cell, cellIdx) in row" :key="cellIdx"
                      class="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
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
            <div class="overflow-hidden w-full h-2.5 bg-gray-200 rounded-full">
              <div class="h-2.5 bg-blue-600 rounded-full transition-all duration-300 ease-out"
                :style="`width: ${progress}%`"></div>
            </div>
          </div>

          <!-- Results -->
          <div v-if="showResults && importResults" class="overflow-hidden rounded-lg border shadow-sm">
            <div class="flex justify-between items-center px-4 py-3 bg-gray-50 border-b">
              <h3 class="text-sm font-medium text-gray-700">Import Results</h3>
              <div class="flex space-x-4">
                <span class="px-2.5 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  {{ importResults.successCount || 0 }} Success
                </span>
                <span class="px-2.5 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                  {{ importResults.errorCount || 0 }} Failed
                </span>
                <span class="px-2.5 py-0.5 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                  {{ importResults.totalRows || 0 }} Total
                </span>
              </div>
            </div>
            <div class="overflow-x-scroll overflow-y-scroll custom-scrollbar" style="height: 200px">
              <table class="min-w-max divide-y divide-gray-200">
                <thead class="sticky top-0 bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Row</th>
                    <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                    <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Message</th>
                    <th v-if="importType === 'service'"
                      class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Service UUID
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(result, idx) in importResults.rowResults" :key="idx"
                    :class="[
                      result.success ? 'bg-green-50' : result.error ? 'bg-red-50' : 'bg-white',
                      'hover:bg-gray-100 transition-colors'
                    ]">
                    <td class="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{{ result.rowNumber }}</td>
                    <td class="px-4 py-2 text-sm whitespace-nowrap">
                      <span v-if="result.success"
                        class="px-2.5 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">Success</span>
                      <span v-else-if="result.error"
                        class="px-2.5 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded-full">Error</span>
                      <span v-else
                        class="px-2.5 py-0.5 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">Skipped</span>
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-500">{{ result.message || '-' }}</td>
                    <td v-if="importType === 'service'" class="px-4 py-2 text-sm text-gray-500">{{ result.serviceUuid || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <template #bottom>
          <div class="flex justify-between px-4 py-3 bg-gray-50 rounded-b-lg sm:px-6">
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
.custom-scrollbar {
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #f3f4f6;
}

:deep(.custom-scrollbar::-webkit-scrollbar) {
  @apply h-3 w-3;
}

:deep(.custom-scrollbar::-webkit-scrollbar-track) {
  @apply bg-gray-200 rounded;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb) {
  @apply bg-gray-500 rounded;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
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