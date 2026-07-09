<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { useInsuredPersonsRefreshStore } from "../store/insuredPersonsRefreshStore";
import {
  importQuotedMainMembers,
  importQuotedDependants,
} from "../api/insuredPersonsApi";

const route = useRoute();
const refreshStore = useInsuredPersonsRefreshStore();

const quotationUuid = computed(() => route.params.quotationUuid || route.params.payerInstitutionContractUuid);
const payerInstitutionContractUuid = computed(() => route.params.id || route.params.payerInstitutionContractUuid);

const importType = ref("main");
const fileInput = ref(null);
const selectedFile = ref(null);
const fileName = ref("");

const importing = ref(false);
const progress = ref(0);
const importResult = ref(null);
const showResults = ref(false);

const res = useApiRequest();

// Computed for UI states
const hasErrors = computed(() => importResult.value?.errorCount > 0);
const hasSuccess = computed(() => importResult.value?.successCount > 0);
const resultSummary = computed(() => {
  if (!importResult.value) return null;
  const { totalRows, successCount, errorCount } = importResult.value;
  return {
    total: totalRows,
    success: successCount,
    error: errorCount,
    successRate: totalRows ? Math.round((successCount / totalRows) * 100) : 0
  };
});

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFile(e) {
  const file = e?.target?.files?.[0];
  if (!file) return;

  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel.sheet.macroEnabled.12"
  ];

  // Check file extension as fallback
  const extension = file.name.split('.').pop().toLowerCase();
  const validExtensions = ['csv', 'xlsx', 'xls'];
  
  if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
    toasted(false, "Please upload a valid Excel (.xlsx, .xls) or CSV file", "");
    return;
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toasted(false, "File size should not exceed 10MB", "");
    return;
  }

  selectedFile.value = file;
  fileName.value = file.name;
  importResult.value = null;
  showResults.value = false;
}

function clearFile() {
  selectedFile.value = null;
  fileName.value = "";
  importResult.value = null;
  showResults.value = false;
  if (fileInput.value) fileInput.value.value = "";
}

function buildFormData() {
  const fd = new FormData();
  fd.append("file", selectedFile.value);
  return fd;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadErrorReport() {
  if (!importResult.value?.rowResults) return;
  
  const errors = importResult.value.rowResults.filter(r => r.error);
  let csv = 'Row Number,Error Message\n';
  errors.forEach(err => {
    csv += `${err.rowNumber},"${err.message}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `import_errors_${new Date().getTime()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function importNow() {
  if (!quotationUuid.value) {
    toasted(false, "Quotation UUID not found", "");
    return;
  }

  if (!payerInstitutionContractUuid.value) {
    toasted(false, "Contract UUID not found", "");
    return;
  }

  if (!selectedFile.value) {
    toasted(false, "Please select a file first", "");
    return;
  }

  importing.value = true;
  progress.value = 0;
  importResult.value = null;
  showResults.value = false;

  const fd = buildFormData();

  const params = {
    quotationUuid: quotationUuid.value,
    payerInstitutionContractUuid: payerInstitutionContractUuid.value,
  };

  const requestFn =
    importType.value === "dependant"
      ? () =>
          importQuotedDependants(params, fd, {
            onUploadProgress: (e) => {
              progress.value = e.total
                ? Math.round((e.loaded * 100) / e.total)
                : 0;
            },
          })
      : () =>
          importQuotedMainMembers(params, fd, {
            onUploadProgress: (e) => {
              progress.value = e.total
                ? Math.round((e.loaded * 100) / e.total)
                : 0;
            },
          });

  res.send(
    requestFn,
    (response) => {
      importing.value = false;
      
      // Handle the response with error details
      if (response?.data) {
        importResult.value = response.data;
        showResults.value = true;
        
        // Only close modal if all rows were successful
        if (importResult.value.errorCount === 0) {
          toasted(true, `Successfully imported ${importResult.value.successCount} records`, "");
          // Trigger refresh to update the insured persons table
          refreshStore.triggerRefresh();
          setTimeout(() => closeModal(), 1500);
        } else {
          // Show toast with summary
          const message = importResult.value.errorCount > 0 
            ? `Import completed with ${importResult.value.errorCount} errors` 
            : `Successfully imported ${importResult.value.successCount} records`;
          
          toasted(importResult.value.errorCount === 0, message, "");
          // Trigger refresh even with partial success
          refreshStore.triggerRefresh();
        }
      } else {
        toasted(true, "Import completed successfully", "");
        // Trigger refresh
        refreshStore.triggerRefresh();
        closeModal();
      }
    },
    (error) => {
      importing.value = false;
      const msg = error?.response?.data?.message || "Import failed";
      toasted(false, msg, "");
    }
  );
}

function closeAndReset() {
  importResult.value = null;
  showResults.value = false;
  clearFile();
  closeModal();
}
</script>

<template>
  <div class="grid place-items-center p-6 min-h-full backdrop-blur-sm bg-black/50">
    <ModalParent>
      <NewFormParent size="lg" :title="'Import Quotation Insured'">
        <div class="flex flex-col max-h-[85vh]">
          <!-- Header Section -->
          <div class="px-6 pt-6 pb-4 border-b border-gray-200">
            <div class="flex gap-4 items-center">
              <div class="flex gap-2 items-center px-3 py-1.5 bg-blue-50 rounded-lg">
                <span class="text-lg text-blue-600">📄</span>
                <span class="text-sm font-medium text-blue-700">
                  {{ importType === 'main' ? 'Main Members' : 'Dependants' }}
                </span>
              </div>
              <div class="text-sm text-gray-500">
                Upload Excel or CSV file to import insured persons
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div class="overflow-y-auto flex-1 p-6 space-y-6">
            <!-- Import Type Selection -->
            <div class="space-y-3">
              <label class="text-sm font-semibold text-gray-700">Import Type</label>
              <div class="grid grid-cols-2 gap-3">
                <div
                  class="relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                  :class="
                    importType === 'main'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  "
                  @click="importType = 'main'"
                >
                  <div class="flex gap-3 items-start">
                    <div
                      class="p-2 rounded-lg"
                      :class="importType === 'main' ? 'bg-blue-100' : 'bg-gray-100'"
                    >
                      <span class="text-xl" :class="importType === 'main' ? 'text-blue-600' : 'text-gray-500'">👤</span>
                    </div>
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">Main Members With their Dependents</div>
                      <div class="mt-1 text-xs text-gray-500">
                        Import primary insured members With their depndents 
                      </div>
                    </div>
                    <div
                      class="flex justify-center items-center w-5 h-5 rounded-full border-2"
                      :class="
                        importType === 'main'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      "
                    >
                      <span v-if="importType === 'main'" class="text-xs text-white">✓</span>
                    </div>
                  </div>
                </div>

                <div
                  class="relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                  :class="
                    importType === 'dependant'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  "
                  @click="importType = 'dependant'"
                >
                  <div class="flex gap-3 items-start">
                    <div
                      class="p-2 rounded-lg"
                      :class="importType === 'dependant' ? 'bg-blue-100' : 'bg-gray-100'"
                    >
                      <span class="text-xl" :class="importType === 'dependant' ? 'text-blue-600' : 'text-gray-500'">👥</span>
                    </div>
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">Dependants</div>
                      <div class="mt-1 text-xs text-gray-500">
                        Import dependent members
                      </div>
                    </div>
                    <div
                      class="flex justify-center items-center w-5 h-5 rounded-full border-2"
                      :class="
                        importType === 'dependant'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      "
                    >
                      <span v-if="importType === 'dependant'" class="text-xs text-white">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- File Upload Section -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-sm font-semibold text-gray-700">Upload File</label>
                <button
                  class="text-xs font-medium text-blue-600 hover:text-blue-700"
                  @click="downloadErrorReport"
                  v-if="hasErrors"
                >
                  ⬇️ Download Error Report
                </button>
              </div>

              <div
                v-if="!selectedFile"
                class="relative p-8 bg-gray-50 rounded-xl border-2 border-gray-300 border-dashed transition-colors duration-200 cursor-pointer hover:bg-gray-100 group"
                @click="triggerFileInput"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="p-3 mb-3 bg-white rounded-full shadow-sm transition-shadow duration-200 group-hover:shadow"
                  >
                    <span class="text-3xl text-gray-400">📤</span>
                  </div>
                  <div class="text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </div>
                  <div class="mt-1 text-xs text-gray-500">
                    Excel or CSV files (Max 10MB)
                  </div>
                </div>
              </div>

              <div
                v-else
                class="p-4 bg-white rounded-xl border border-gray-200"
              >
                <div class="flex gap-3 items-center">
                  <div class="p-2 bg-green-50 rounded-lg">
                    <span class="text-xl text-green-600">📊</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">
                      {{ fileName }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ formatFileSize(selectedFile.size) }}
                    </div>
                  </div>
                  <button
                    class="p-2 text-gray-400 transition-colors duration-200 hover:text-red-600"
                    @click.stop="clearFile"
                    :disabled="importing"
                  >
                    <span class="text-lg">✕</span>
                  </button>
                </div>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept=".csv,.xlsx,.xls"
                class="hidden"
                @change="handleFile"
              />
            </div>

            <!-- Progress Bar -->
            <div v-if="importing" class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Processing file...</span>
                <span class="font-semibold text-blue-600">{{ progress }}%</span>
              </div>
              <div class="overflow-hidden w-full h-2 bg-gray-200 rounded-full">
                <div
                  class="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  :style="{ width: `${progress}%` }"
                />
              </div>
            </div>

            <!-- Import Results -->
            <div v-if="showResults && importResult" class="space-y-4">
              <!-- Summary Cards -->
              <div class="grid grid-cols-3 gap-3">
                <div class="p-3 text-center bg-gray-50 rounded-lg border border-gray-200">
                  <div class="text-2xl font-bold text-gray-900">
                    {{ resultSummary.total }}
                  </div>
                  <div class="text-xs text-gray-600">Total Rows</div>
                </div>
                <div class="p-3 text-center bg-green-50 rounded-lg border border-green-200">
                  <div class="text-2xl font-bold text-green-700">
                    {{ resultSummary.success }}
                  </div>
                  <div class="text-xs text-green-600">Successful</div>
                </div>
                <div class="p-3 text-center bg-red-50 rounded-lg border border-red-200">
                  <div class="text-2xl font-bold text-red-700">
                    {{ resultSummary.error }}
                  </div>
                  <div class="text-xs text-red-600">Failed</div>
                </div>
              </div>

              <!-- Success Rate -->
              <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-blue-700">Success Rate</span>
                  <span class="text-sm font-bold text-blue-700">
                    {{ resultSummary.successRate }}%
                  </span>
                </div>
                <div class="mt-2 w-full h-2 bg-blue-200 rounded-full">
                  <div
                    class="h-2 bg-blue-600 rounded-full transition-all duration-500"
                    :style="{ width: `${resultSummary.successRate}%` }"
                  />
                </div>
              </div>

              <!-- Error Details -->
              <div v-if="hasErrors" class="space-y-2">
                <div class="flex gap-2 items-center">
                  <span class="text-lg text-red-500">⚠️</span>
                  <span class="text-sm font-medium text-gray-700">Error Details</span>
                </div>
                <div class="overflow-y-auto max-h-48 rounded-lg border border-gray-200">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="sticky top-0 bg-gray-50">
                      <tr>
                        <th class="px-3 py-2 text-xs font-medium text-left text-gray-500">
                          Row
                        </th>
                        <th class="px-3 py-2 text-xs font-medium text-left text-gray-500">
                          Error Message
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr
                        v-for="(result, index) in importResult.rowResults.filter(r => r.error)"
                        :key="index"
                        class="hover:bg-gray-50"
                      >
                        <td class="px-3 py-2 text-sm font-medium text-gray-900">
                          #{{ result.rowNumber }}
                        </td>
                        <td class="px-3 py-2 text-sm text-red-600">
                          {{ result.message }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Success Message -->
              <div v-if="hasSuccess" class="flex gap-2 items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span class="text-lg text-green-600">✅</span>
                <span class="text-sm text-green-700">
                  Successfully imported {{ resultSummary.success }} record(s)
                </span>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div class="flex gap-3 justify-end">
              <Button
                class="px-4 py-2 text-gray-700 bg-red-500 border border-gray-300 hover:bg-gray-50"
                @click.prevent="closeAndReset"
                :disabled="importing"
              >
                Cancel
              </Button>
              <Button
                v-if="hasErrors"
                class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700"
                @click.prevent="closeAndReset"
              >
                Close
              </Button>
              <Button
                v-else
                class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="importing || !selectedFile"
                @click.prevent="importNow"
              >
                <span v-if="!importing">Import</span>
                <span v-else>Importing...</span>
              </Button>
            </div>
          </div>
        </div>
      </NewFormParent>
    </ModalParent>
  </div>
</template>

<style scoped>
/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>