<script setup>
  import { ref, onMounted, watch } from "vue";
  import Button from "@/components/Button.vue";
  import ModalParent from "@/components/ModalParent.vue";
  import NewFormParent from "@/components/NewFormParent.vue";
  import { useApiRequest } from "@/composables/useApiRequest";
  import { useAuthStore } from "@/stores/auth";
  import { closeModal } from "@customizer/modal-x";
  import { useInsuredPersonsRefreshStore } from "../store/insuredPersonsRefreshStore";
  import { importInsuredPersons } from "../api/insuredPersonsApi";
  import { getPackages } from "@/features/product_settings/api/coverageApi";
  import * as XLSX from 'xlsx';
  import { useRoute } from "vue-router";
  
  const route = useRoute();
  const props = defineProps({
    data: String,
  });
  
  const auth = useAuthStore().auth?.user?.payerUuid;
  
  const res = useApiRequest();
  const refreshStore = useInsuredPersonsRefreshStore();
  
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
  
  const packages = ref([]);
  const loadingPackages = ref(false);

  // Capped limit selection
  const showCappedOptions = ref(false);
  
  // Capped From (single)
  const selectedPackage = ref(null);
  
  // Capped To (multiple)
  const selectedPackages = ref([]);
  
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
    showCappedOptions.value = false;
    selectedPackage.value = null;
    selectedPackages.value = [];
    if (fileInput.value) fileInput.value.value = "";
  };
  
  const loadPackages = async () => {
    try {
      loadingPackages.value = true;
      const response = await getPackages();
      packages.value = response?.data || [];
    } catch (error) {
      console.error('Error loading packages:', error);
      message.value = {
        type: "error",
        text: "Failed to load packages",
        isHtml: false
      };
    } finally {
      loadingPackages.value = false;
    }
  };

  watch(showCappedOptions, async (enabled) => {
    if (enabled && packages.value.length === 0) {
      await loadPackages();
    }
  });

  watch(selectedPackage, (pkg) => {
    if (!pkg) return;
    selectedPackages.value = (selectedPackages.value || []).filter(
      (p) => p?.packageUuid !== pkg?.packageUuid
    );
  });

  // Multiple package selection helpers (new)
  const togglePackage = (pkg) => {
    const index = selectedPackages.value.findIndex(p => p.packageUuid === pkg.packageUuid);
    if (index === -1) {
      selectedPackages.value.push(pkg);
    } else {
      selectedPackages.value.splice(index, 1);
    }
  };

  const isPackageSelected = (pkg) => {
    return selectedPackages.value.some(p => p.packageUuid === pkg.packageUuid);
  };

  const isPackageDisabledForTo = (pkg) => {
    return !!selectedPackage.value && pkg?.packageUuid === selectedPackage.value?.packageUuid;
  };

  const selectAllPackages = () => {
    const allowed = (packages.value || []).filter((p) => !isPackageDisabledForTo(p));

    if (selectedPackages.value.length === allowed.length) {
      selectedPackages.value = [];
    } else {
      selectedPackages.value = [...allowed];
    }
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

    // Validate capped options
    if (showCappedOptions.value) {
      if (!selectedPackage.value) {
        message.value = { type: "error", text: "Please select a package for Capped From", isHtml: false };
        return;
      }

      if (!Array.isArray(selectedPackages.value) || selectedPackages.value.length === 0) {
        message.value = { type: "error", text: "Please select at least one package for Capped To", isHtml: false };
        return;
      }
    }

    importing.value = true;
    progress.value = 0;
    message.value = { type: null, text: null, isHtml: false };

    const fd = new FormData();
    fd.append("file", selectedFile.value);

    // Build the request object based on selected option
    const insuredImportRequest = {
      payerInstitutionContractUuid: String(route.params.id || ""),
      institutionUuid: String(route.params.institutionUuid || ""),
      cuppedInUuid: showCappedOptions.value
        ? (selectedPackage.value?.packageUuid || null)
        : null,
      cuppedInUuids: showCappedOptions.value
        ? (selectedPackages.value || []).map((pkg) => pkg?.packageUuid).filter(Boolean)
        : []
    };

    fd.append("insuredImportRequest", JSON.stringify(insuredImportRequest));

    res.send(
      () =>
        importInsuredPersons(
          {
            institutionUuid: route.params.institutionUuid,
            payerInstitutionContractUuid: route.params.id,
            payerUuid: auth
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
      
      const data = response.data;
      
      // Handle the response based on successCount and errorCount
      if (data && data.totalRows !== undefined) {
        // Remove duplicate rows from rowResults
        const uniqueRowResults = [];
        const seenRows = new Set();
        
        if (data.rowResults && Array.isArray(data.rowResults)) {
          data.rowResults.forEach(row => {
            const key = `row-${row.rowNumber}-${row.message}`;
            if (!seenRows.has(key)) {
              seenRows.add(key);
              uniqueRowResults.push(row);
            }
          });
        }
        
        // Create a clean data object with unique rows
        const cleanData = {
          ...data,
          rowResults: uniqueRowResults
        };
        
        // Build the message based on successCount
        let messageText = '';
        let messageType = "info";
        
        if (cleanData.successCount > 0) {
          // Some records were imported successfully
          messageType = "success";
          messageText = `
            <div class="p-4 bg-success-soft rounded-lg border border-success-soft">
              <div class="flex items-start">
                <svg class="mt-0.5 mr-2 w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-success-strong">Partial Import Success</h4>
                  <p class="mt-1 text-sm text-success-strong">
                    Total Rows Processed: ${cleanData.totalRows || 0}<br>
                    Successfully Imported: ${cleanData.successCount || 0}<br>
                    Failed: ${cleanData.errorCount || 0}
                  </p>
                </div>
              </div>
            </div>
          `;
        } else if (cleanData.errorCount > 0) {
          // All records failed
          messageType = "error";
          messageText = `
            <div class="p-4 bg-error-soft rounded-lg border border-error-soft">
              <div class="flex items-start">
                <svg class="mt-0.5 mr-2 w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-error-strong">Import Failed</h4>
                  <p class="mt-1 text-sm text-error-strong">
                    Total Rows: ${cleanData.totalRows || 0}<br>
                    Successfully Imported: ${cleanData.successCount || 0}<br>
                    Errors: ${cleanData.errorCount || 0}
                  </p>
                  <p class="mt-2 text-sm text-error">
                    No records were imported. Please fix the errors below and try again.
                  </p>
                </div>
              </div>
            </div>
          `;
        } else if (cleanData.successCount === 0 && cleanData.errorCount === 0) {
          // No records processed
          messageType = "warning";
          messageText = `
            <div class="p-4 bg-warning-soft rounded-lg border border-warning-soft">
              <div class="flex items-start">
                <svg class="mt-0.5 mr-2 w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-warning-strong">No Records Processed</h4>
                  <p class="mt-1 text-sm text-warning-strong">
                    The file was processed but no records were imported.
                    Please check your file format and try again.
                  </p>
                </div>
              </div>
            </div>
          `;
        }

        // Display individual row errors if any
        if (cleanData.rowResults && cleanData.rowResults.length > 0) {
          const errorRows = cleanData.rowResults.filter(row => row.error);
          const skippedRows = cleanData.rowResults.filter(row => row.skipped);
          const successRows = cleanData.rowResults.filter(row => row.success);
          
          // Show successful rows if any
          if (successRows.length > 0) {
            messageText += `
              <div class="p-4 mt-4 bg-success-soft rounded-lg border border-success-soft">
                <div class="flex items-start">
                  <svg class="mt-0.5 mr-2 w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 class="text-sm font-medium text-success-strong">Successfully Imported Rows (${successRows.length})</h4>
                    <ul class="overflow-y-auto mt-1 space-y-1 max-h-40 text-xs text-success-strong">
                      ${successRows.map(row => `
                        <li class="py-1 pl-1 border-b border-success-soft last:border-b-0">
                          <strong>Row ${row.rowNumber}:</strong> Successfully imported
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            `;
          }
          
          // Show error rows if any
          if (errorRows.length > 0) {
            messageText += `
              <div class="p-4 mt-4 bg-error-soft rounded-lg border border-error-soft">
                <div class="flex items-start">
                  <svg class="mt-0.5 mr-2 w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 class="text-sm font-medium text-error-strong">Error Rows (${errorRows.length})</h4>
                    <ul class="overflow-y-auto mt-1 space-y-2 max-h-40 text-xs text-error-strong">
                      ${errorRows.map(row => `
                        <li class="py-1 pl-1 border-b border-error-soft last:border-b-0">
                          <div class="font-medium">Row ${row.rowNumber}:</div>
                          <div class="mt-0.5 text-error">${row.message || 'Unknown error'}</div>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            `;
          }

          // Show skipped rows if any
          if (skippedRows.length > 0) {
            messageText += `
              <div class="p-4 mt-4 bg-warning-soft rounded-lg border border-warning-soft">
                <div class="flex items-start">
                  <svg class="mt-0.5 mr-2 w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 class="text-sm font-medium text-warning-strong">Skipped Rows (${skippedRows.length})</h4>
                    <ul class="overflow-y-auto mt-1 space-y-2 max-h-40 text-xs text-warning-strong">
                      ${skippedRows.map(row => `
                        <li class="py-1 pl-1 border-b border-warning-soft last:border-b-0">
                          <div class="font-medium">Row ${row.rowNumber}:</div>
                          <div class="mt-0.5 text-warning">${row.message || 'Skipped'}</div>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            `;
          }
        }

        message.value = {
          type: messageType,
          text: messageText,
          isHtml: true
        };
        
        // Set wasSuccessful only if some records were imported
        wasSuccessful.value = cleanData.successCount > 0;

        // Refresh the insured persons list and close modal if fully successful
        if (cleanData.successCount > 0) {
          refreshStore.triggerRefresh();

          // If no errors, auto-close the modal after a brief delay so user sees the success message
          if (cleanData.errorCount === 0) {
            setTimeout(() => {
              closeModal('employeeImport');
              reset();
            }, 1500);
          }
        }

      } else {
        // Handle old response format or unexpected response
        message.value = {
          type: "error",
          text: `
            <div class="p-4 bg-error-soft rounded-lg border border-error-soft">
              <div class="flex items-start">
                <svg class="mt-0.5 mr-2 w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-error-strong">Unexpected Response Format</h4>
                  <p class="mt-1 text-sm text-error-strong">The server returned an unexpected response format.</p>
                </div>
              </div>
            </div>
          `,
          isHtml: true
        };
      }
    },
    (error) => {
      importing.value = false;
      message.value = {
        type: "error",
        text: `
          <div class="p-4 bg-error-soft rounded-lg border border-error-soft">
            <div class="flex items-start">
              <svg class="mt-0.5 mr-2 w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 class="text-sm font-medium text-error-strong">Network Error</h4>
                <p class="mt-1 text-sm text-error-strong">Failed to connect to server. Please try again.</p>
              </div>
            </div>
          </div>
        `,
        isHtml: true
      };
      console.error('Import error:', error);
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
  
    if (file.size > 10 * 1024 * 1024) {
      message.value = { 
        type: "error", 
        text: "File size exceeds 10MB limit",
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
    <div class="grid place-items-center p-6 min-h-full bg-black/50">
      <ModalParent id="import-modal">
        <NewFormParent
          size="lg"
          class="overflow-hidden bg-white rounded-xl shadow-2xl"
          :title="title"
        >
          <div class="p-6 max-h-[80vh] overflow-y-auto">
            <!-- Modern Header -->
            <div class="mb-8">
              <div class="flex items-center space-x-3">
                <div class="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-primary to-primary rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-ink">{{ title }}</h2>
                  <p class="text-sm text-ink-subtle">Upload Excel or CSV file to bulk import records</p>
                </div>
              </div>
            </div>
  
            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <!-- Left Column: Settings -->
              <div class="space-y-6 lg:col-span-1">
                <!-- Capped Limit Toggle (updated with multiple package option) -->
                <div class="p-5 bg-white rounded-xl border border-line shadow-sm">
                  <div class="flex justify-between items-center mb-2">
                    <h3 class="text-sm font-semibold text-ink">Capped Package Options</h3>
                    <button
                      @click="showCappedOptions = !showCappedOptions"
                      type="button"
                      class="inline-flex relative flex-shrink-0 items-center w-11 h-6 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      :class="showCappedOptions ? 'bg-primary' : 'bg-line'"
                    >
                      <span
                        :class="showCappedOptions ? 'translate-x-5' : 'translate-x-0'"
                        class="inline-block w-5 h-5 bg-white rounded-full shadow transition duration-200 transform"
                      />
                    </button>
                  </div>
                  <p class="mb-4 text-xs text-ink-subtle">Enable to set capped limits from packages.</p>

                  <div v-if="showCappedOptions" class="pt-4 space-y-4 border-t border-line animate-slide-down">
                    <div class="space-y-3">
                      <!-- Capped From -->
                      <div class="p-3 rounded-lg border border-line bg-white">
                        <label class="block mb-2 text-xs font-medium text-ink-muted">Capped From Package</label>
                        <div v-if="loadingPackages" class="flex items-center text-sm text-ink-muted">
                          <div class="mr-2 w-4 h-4 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                          Loading packages...
                        </div>
                        <select
                          v-else
                          v-model="selectedPackage"
                          class="px-4 py-2.5 w-full text-sm rounded-lg border border-line-strong transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="" disabled>Choose a package</option>
                          <option v-for="pkg in packages" :key="pkg.packageUuid" :value="pkg" class="py-2">
                            {{ pkg.packageName }}
                          </option>
                        </select>
                      </div>

                      <!-- Capped To -->
                      <div class="p-3 rounded-lg border border-line bg-white">
                        <div class="flex justify-between items-center mb-2">
                          <label class="block text-xs font-medium text-ink-muted">Capped To Packages</label>
                          <button
                            @click="selectAllPackages"
                            type="button"
                            class="text-xs text-primary transition-colors hover:text-primary-hover"
                          >
                            Select All
                          </button>
                        </div>

                        <div v-if="loadingPackages" class="flex items-center text-sm text-ink-muted">
                          <div class="mr-2 w-4 h-4 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                          Loading packages...
                        </div>
                        <div v-else class="overflow-y-auto p-1 space-y-2 max-h-48 custom-scrollbar">
                          <div
                            v-for="pkg in packages"
                            :key="pkg.packageUuid"
                            @click="!isPackageDisabledForTo(pkg) && togglePackage(pkg)"
                            class="flex items-center p-2 rounded-lg border border-line transition-all cursor-pointer hover:bg-surface-muted"
                            :class="{
                              'bg-primary/5 border-primary/20': isPackageSelected(pkg),
                              'opacity-50 cursor-not-allowed': isPackageDisabledForTo(pkg)
                            }"
                          >
                            <input
                              type="checkbox"
                              :checked="isPackageSelected(pkg)"
                              :disabled="isPackageDisabledForTo(pkg)"
                              @click.stop
                              @change="togglePackage(pkg)"
                              class="w-4 h-4 text-primary rounded border-line-strong focus:ring-primary"
                            />
                            <div class="ml-3">
                              <span class="text-sm font-medium text-ink">{{ pkg.packageName }}</span>
                              <p v-if="pkg.packageDescription" class="text-xs text-ink-subtle">{{ pkg.packageDescription }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  
              <!-- Right Column: File Upload & Preview (unchanged) -->
              <div class="lg:col-span-2">
                <div class="p-6 bg-white rounded-xl border border-line shadow-sm">
                  <!-- File Upload Area -->
                  <div class="mb-6">
                    <h3 class="mb-4 text-sm font-semibold text-ink">Upload File</h3>
                    <div
                      @click="triggerFileInput"
                      class="p-8 text-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer"
                      :class="{ 
                        'border-primary/70 bg-primary/[0.025]': selectedFile,
                        'border-line-strong hover:border-primary/70 hover:bg-primary/[0.015]': !selectedFile 
                      }"
                    >
                      <template v-if="!selectedFile">
                        <div class="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-surface-muted to-surface-muted rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p class="text-sm font-medium text-ink-muted">Drop your file here or click to browse</p>
                        <p class="mt-1 text-xs text-ink-subtle">Supports .xlsx, .xls, .csv (Max 5MB)</p>
                      </template>
                      <template v-else>
                        <div class="flex flex-col items-center">
                          <div class="flex justify-center items-center mb-4 w-16 h-16 bg-gradient-to-br from-success-soft to-success-soft rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div class="text-center">
                            <p class="max-w-xs text-sm font-medium text-ink-muted truncate">{{ fileName }}</p>
                            <button 
                              @click.stop="removeFile" 
                              class="inline-flex items-center mt-2 text-xs text-error transition-colors hover:text-error-strong"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove file
                            </button>
                          </div>
                        </div>
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
  
                  <!-- Import Progress -->
                  <div v-if="importing" class="mb-6">
                    <div class="flex justify-between mb-2 text-sm text-ink-muted">
                      <span class="font-medium">Uploading...</span>
                      <span class="font-semibold">{{ progress }}%</span>
                    </div>
                    <div class="overflow-hidden w-full h-2.5 bg-line rounded-full">
                      <div 
                        class="h-2.5 bg-gradient-to-r from-primary to-primary rounded-full transition-all duration-300 ease-out" 
                        :style="`width: ${progress}%`" 
                      />
                    </div>
                  </div>
  
                  <!-- File Preview -->
                  <div v-if="previewLoading" class="py-4 mb-6 text-center">
                    <div class="inline-flex items-center">
                      <div class="mr-2 w-5 h-5 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                      <span class="text-sm text-ink-muted">Loading preview...</span>
                    </div>
                  </div>
  
                  <div v-if="showPreview && previewData.length > 0 && !message.type" class="mb-6">
                    <div class="flex justify-between items-center mb-3">
                      <h3 class="text-sm font-semibold text-ink">File Preview</h3>
                      <span class="text-xs text-ink-subtle">{{ previewData.length }} rows</span>
                    </div>
                    <div class="overflow-hidden rounded-lg border border-line">
                      <div class="overflow-x-auto custom-scrollbar" :style="`max-height: ${maxPreviewHeight}`">
                        <table class="min-w-full divide-y divide-line">
                          <thead class="bg-surface-muted">
                            <tr>
                              <th 
                                v-for="(header, idx) in previewHeaders" 
                                :key="idx"
                                class="px-4 py-3 text-xs font-medium tracking-wider text-left text-ink-subtle uppercase whitespace-nowrap"
                              >
                                {{ header }}
                              </th>
                            </tr>
                          </thead>
                          <tbody class="bg-white divide-y divide-line">
                            <tr v-for="(row, rowIdx) in previewData.slice(0, maxPreviewRows)" :key="rowIdx" 
                                :class="rowIdx % 2 === 0 ? 'bg-white' : 'bg-surface-muted/50'">
                              <td 
                                v-for="(cell, cellIdx) in row" 
                                :key="cellIdx"
                                class="px-4 py-3 text-sm text-ink-muted whitespace-nowrap"
                              >
                                {{ cell }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-if="previewData.length > maxPreviewRows" class="px-4 py-2 text-xs text-center text-ink-subtle bg-surface-muted border-t">
                        Showing first {{ maxPreviewRows }} rows of {{ previewData.length }}
                      </div>
                    </div>
                  </div>
  
                  <!-- Messages -->
                  <div v-if="message.text" class="transition-all duration-300 animate-fade-in">
                    <div v-if="message.isHtml" v-html="message.text"></div>
                    <div v-else class="p-4 text-sm rounded-lg" :class="{
                      'bg-error-soft border border-error-soft text-error-strong': message.type === 'error',
                      'bg-primary/5 border border-primary/10 text-primary-hover': !message.type
                    }">
                      {{ message.text }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Footer Actions -->
          <template #bottom>
            <div class="flex gap-3 justify-between items-center p-6 w-full bg-surface-muted border-t border-line">
              <Button
                @click="closeModal('import-modal')"
                class="px-6 text-ink-muted bg-white border border-line-strong transition-colors hover:bg-surface-muted hover:border-ink-subtle active:bg-surface-muted"
                size="md"
              >
                {{ wasSuccessful ? 'Close' : 'Cancel' }}
              </Button>
              <div class="flex gap-3">
                <Button
                  v-if="selectedFile && !importing && !wasSuccessful"
                  @click="reset"
                  class="px-6 text-ink-muted bg-white border border-line-strong transition-colors hover:bg-surface-muted hover:border-ink-subtle active:bg-surface-muted"
                  size="md"
                >
                  Reset
                </Button>
                <Button
                  v-if="selectedFile && !importing && !wasSuccessful"
                  @click="importFile"
                  class="px-6 text-white bg-gradient-to-r from-primary to-primary-hover transition-all duration-200 hover:from-primary-hover hover:to-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  size="md"
                  :disabled="importing"
                >
                  <span class="flex items-center">
                    <svg v-if="importing" class="mr-2 -ml-1 w-4 h-4 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ importing ? 'Importing...' : 'Import Records' }}
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
  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgb(var(--surface-muted));
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(var(--line-strong));
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(var(--ink-subtle));
  }
  
  /* Animations */
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-slide-down {
    animation: slideDown 0.3s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  /* Smooth transitions */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }
  
  /* Toggle button styles */
  .toggle-checkbox:checked {
    @apply right-0 border-primary;
  }
  
  .toggle-checkbox:checked + .toggle-label {
    @apply bg-primary;
  }
  </style>