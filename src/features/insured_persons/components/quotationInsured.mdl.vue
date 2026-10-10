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
          <div class="px-6 pt-6 pb-4 border-b border-line">
            <div class="flex gap-4 items-center">
              <div class="flex gap-2 items-center px-3 py-1.5 bg-primary/5 rounded-lg">
                <span class="text-lg text-primary">📄</span>
                <span class="text-sm font-medium text-primary-hover">
                  {{ importType === 'main' ? 'Main Members' : 'Dependants' }}
                </span>
              </div>
              <div class="text-sm text-ink-subtle">
                Upload Excel or CSV file to import insured persons
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div class="overflow-y-auto flex-1 p-6 space-y-6">
            <!-- Import Type Selection -->
            <div class="space-y-3">
              <label class="text-sm font-semibold text-ink-muted">Import Type</label>
              <div class="grid grid-cols-2 gap-3">
                <div
                  class="relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                  :class="
                    importType === 'main'
                      ? 'border-primary bg-primary/5'
                      : 'border-line bg-white hover:border-line-strong'
                  "
                  @click="importType = 'main'"
                >
                  <div class="flex gap-3 items-start">
                    <div
                      class="p-2 rounded-lg"
                      :class="importType === 'main' ? 'bg-primary/10' : 'bg-surface-muted'"
                    >
                      <span class="text-xl" :class="importType === 'main' ? 'text-primary' : 'text-ink-subtle'">👤</span>
                    </div>
                    <div class="flex-1">
                      <div class="font-medium text-ink">Main Members With their Dependents</div>
                      <div class="mt-1 text-xs text-ink-subtle">
                        Import primary insured members With their depndents 
                      </div>
                    </div>
                    <div
                      class="flex justify-center items-center w-5 h-5 rounded-full border-2"
                      :class="
                        importType === 'main'
                          ? 'border-primary bg-primary'
                          : 'border-line-strong'
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
                      ? 'border-primary bg-primary/5'
                      : 'border-line bg-white hover:border-line-strong'
                  "
                  @click="importType = 'dependant'"
                >
                  <div class="flex gap-3 items-start">
                    <div
                      class="p-2 rounded-lg"
                      :class="importType === 'dependant' ? 'bg-primary/10' : 'bg-surface-muted'"
                    >
                      <span class="text-xl" :class="importType === 'dependant' ? 'text-primary' : 'text-ink-subtle'">👥</span>
                    </div>
                    <div class="flex-1">
                      <div class="font-medium text-ink">Dependants</div>
                      <div class="mt-1 text-xs text-ink-subtle">
                        Import dependent members
                      </div>
                    </div>
                    <div
                      class="flex justify-center items-center w-5 h-5 rounded-full border-2"
                      :class="
                        importType === 'dependant'
                          ? 'border-primary bg-primary'
                          : 'border-line-strong'
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
                <label class="text-sm font-semibold text-ink-muted">Upload File</label>
                <button
                  class="text-xs font-medium text-primary hover:text-primary-hover"
                  @click="downloadErrorReport"
                  v-if="hasErrors"
                >
                  ⬇️ Download Error Report
                </button>
              </div>

              <div
                v-if="!selectedFile"
                class="relative p-8 bg-surface-muted rounded-xl border-2 border-line-strong border-dashed transition-colors duration-200 cursor-pointer hover:bg-surface-muted group"
                @click="triggerFileInput"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="p-3 mb-3 bg-white rounded-full shadow-sm transition-shadow duration-200 group-hover:shadow"
                  >
                    <span class="text-3xl text-ink-subtle">📤</span>
                  </div>
                  <div class="text-sm font-medium text-ink-muted">
                    Click to upload or drag and drop
                  </div>
                  <div class="mt-1 text-xs text-ink-subtle">
                    Excel or CSV files (Max 10MB)
                  </div>
                </div>
              </div>

              <div
                v-else
                class="p-4 bg-white rounded-xl border border-line"
              >
                <div class="flex gap-3 items-center">
                  <div class="p-2 bg-success-soft rounded-lg">
                    <span class="text-xl text-success">📊</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-ink truncate">
                      {{ fileName }}
                    </div>
                    <div class="text-xs text-ink-subtle">
                      {{ formatFileSize(selectedFile.size) }}
                    </div>
                  </div>
                  <button
                    class="p-2 text-ink-subtle transition-colors duration-200 hover:text-error"
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
                <span class="text-ink-muted">Processing file...</span>
                <span class="font-semibold text-primary">{{ progress }}%</span>
              </div>
              <div class="overflow-hidden w-full h-2 bg-line rounded-full">
                <div
                  class="h-2 bg-gradient-to-r from-primary to-primary rounded-full transition-all duration-300"
                  :style="{ width: `${progress}%` }"
                />
              </div>
            </div>

            <!-- Import Results -->
            <div v-if="showResults && importResult" class="space-y-4">
              <!-- Summary Cards -->
              <div class="grid grid-cols-3 gap-3">
                <div class="p-3 text-center bg-surface-muted rounded-lg border border-line">
                  <div class="text-2xl font-bold text-ink">
                    {{ resultSummary.total }}
                  </div>
                  <div class="text-xs text-ink-muted">Total Rows</div>
                </div>
                <div class="p-3 text-center bg-success-soft rounded-lg border border-success/20">
                  <div class="text-2xl font-bold text-success-strong">
                    {{ resultSummary.success }}
                  </div>
                  <div class="text-xs text-success">Successful</div>
                </div>
                <div class="p-3 text-center bg-error-soft rounded-lg border border-error/20">
                  <div class="text-2xl font-bold text-error-strong">
                    {{ resultSummary.error }}
                  </div>
                  <div class="text-xs text-error">Failed</div>
                </div>
              </div>

              <!-- Success Rate -->
              <div class="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-primary-hover">Success Rate</span>
                  <span class="text-sm font-bold text-primary-hover">
                    {{ resultSummary.successRate }}%
                  </span>
                </div>
                <div class="mt-2 w-full h-2 bg-primary/20 rounded-full">
                  <div
                    class="h-2 bg-primary rounded-full transition-all duration-500"
                    :style="{ width: `${resultSummary.successRate}%` }"
                  />
                </div>
              </div>

              <!-- Error Details -->
              <div v-if="hasErrors" class="space-y-2">
                <div class="flex gap-2 items-center">
                  <span class="text-lg text-error">⚠️</span>
                  <span class="text-sm font-medium text-ink-muted">Error Details</span>
                </div>
                <div class="overflow-y-auto max-h-48 rounded-lg border border-line">
                  <table class="min-w-full divide-y divide-line">
                    <thead class="sticky top-0 bg-surface-muted">
                      <tr>
                        <th class="px-3 py-2 text-xs font-medium text-left text-ink-subtle">
                          Row
                        </th>
                        <th class="px-3 py-2 text-xs font-medium text-left text-ink-subtle">
                          Error Message
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-line">
                      <tr
                        v-for="(result, index) in importResult.rowResults.filter(r => r.error)"
                        :key="index"
                        class="hover:bg-surface-muted"
                      >
                        <td class="px-3 py-2 text-sm font-medium text-ink">
                          #{{ result.rowNumber }}
                        </td>
                        <td class="px-3 py-2 text-sm text-error">
                          {{ result.message }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Success Message -->
              <div v-if="hasSuccess" class="flex gap-2 items-center p-3 bg-success-soft rounded-lg border border-success/20">
                <span class="text-lg text-success">✅</span>
                <span class="text-sm text-success-strong">
                  Successfully imported {{ resultSummary.success }} record(s)
                </span>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 bg-surface-muted border-t border-line">
            <div class="flex gap-3 justify-end">
              <Button
                class="px-4 py-2 text-ink-muted bg-error border border-line-strong hover:bg-surface-muted"
                @click.prevent="closeAndReset"
                :disabled="importing"
              >
                Cancel
              </Button>
              <Button
                v-if="hasErrors"
                class="px-4 py-2 text-white bg-primary hover:bg-primary-hover"
                @click.prevent="closeAndReset"
              >
                Close
              </Button>
              <Button
                v-else
                class="px-4 py-2 text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
  background: rgb(var(--surface-muted));
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgb(var(--line-strong));
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--ink-subtle));
}
</style>