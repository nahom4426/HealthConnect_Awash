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

const req = useApiRequest();
const auth = useAuthStore().auth?.user?.providerUuid;
const id  = route.params.id;
const progress = ref(0);
const importing = ref(false);
const fileInput = ref();
const selectedFile = ref(null);
const fileName = ref("");
const message = ref({ type: null, text: null });
const wasSuccessful = ref(false);

// For Excel preview
const previewData = ref([]);
const previewHeaders = ref([]);
const showPreview = ref(false);
const previewLoading = ref(false);
const maxPreviewHeight = "200px";

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
  if (fileInput.value) fileInput.value.value = "";
};

// Parse Excel/CSV file for preview
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
    message.value = { type: "error", text: "Please select a file first" };
    return;
  }

  importing.value = true;
  progress.value = 0;
  message.value = { type: null, text: null };

  const fd = new FormData();
  fd.append("file", selectedFile.value);

  const apiCall = props.data === "drug" 
    ? importDrug({ payerProviderContractUuid : id }, fd, {
        onUploadProgress: (e) => {
          progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
        }
      })
    : importServices({ payerProviderContractUuid : id }, fd, {
        onUploadProgress: (e) => {
          progress.value = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
        }
      });

  req.send(
    () => apiCall,
    (res) => {
      importing.value = false;

      if (req?.success) {
        message.value = { 
          type: "success", 
          text: "Import completed successfully!",
          isHtml: false
        };
        wasSuccessful.value = true;
        toasted.success(props.data === "drug" ? "Drug imported" : "Services imported");
        setTimeout(() => closeModal('import-modal'), 2000);
      } else {
        message.value = {
          type: "error",
          text: req.response.value?.message || "Import failed",
          isHtml: false
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
    message.value = { type: "error", text: "Please upload Excel/CSV file" };
    return;
  }

  selectedFile.value = file;
  fileName.value = file.name;
  message.value = { type: null, text: null };
  parseFileForPreview(file);
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const removeFile = () => {
  reset();
};

const title = props.data === "drug" ? "Import Drug Data" : "Import Service Data";
</script>

<template>
  <div class="bg-black/50 min-h-full p-6 grid place-items-center">
    <ModalParent id="import-modal">
      <NewFormParent
        size="mdd"
        class="bg-white rounded-lg shadow-xl"
        :title="title"
      >
        <div class="p-6">
          <div class="mb-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h2 class="mt-2 text-lg font-semibold text-gray-800">{{ title }}</h2>
            <p class="mt-1 text-sm text-gray-500">Upload your Excel or CSV file</p>
          </div>

          <div class="mb-4">
            <div
              @click="triggerFileInput"
              class="w-full max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              :class="{ 'border-blue-400': selectedFile }"
            >
              <template v-if="!selectedFile">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to select file</p>
                <p class="text-xs text-gray-500 mt-1">Excel or CSV files only</p>
              </template>
              <template v-else>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-2 text-sm font-medium text-gray-700 truncate">{{ fileName }}</p>
                <button @click.stop="removeFile" class="mt-2 text-xs text-red-500 hover:text-red-700">
                  Remove file
                </button>
              </template>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="hidden"
              @change="handleFile"
            />
          </div>

          <!-- Supported formats section -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-700 mb-2 text-center">Supported Formats</h3>
            <div class="flex justify-center gap-4">
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span class="text-xs mt-1">XLS</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span class="text-xs mt-1">CSV</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span class="text-xs mt-1">XLSX</span>
              </div>
            </div>
          </div>

          <!-- File Preview Section -->
          <div v-if="previewLoading" class="my-4 text-center">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <p class="mt-2 text-sm text-gray-600">Loading preview...</p>
          </div>

          <div v-if="showPreview && previewData.length > 0" class="my-4 border rounded-lg">
            <div class="text-sm font-medium text-gray-700 p-3 bg-gray-50 border-b flex justify-between items-center">
              <span>File Preview ({{ previewData.length }} rows)</span>
              <span class="text-xs text-gray-500">Scroll to see more</span>
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

          <div v-if="message.text" class="mb-4 p-3 rounded-md" :class="{
            'bg-red-50': message.type === 'error',
            'bg-green-50': message.type === 'success',
            'bg-blue-50': !message.type
          }">
            <div v-if="message.isHtml" v-html="message.text" class="text-sm"></div>
            <template v-else class="text-sm">{{ message.text }}</template>
          </div>

          <div v-if="importing" class="mb-4">
            <div class="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" :style="`width: ${progress}%`" />
            </div>
          </div>

          <div class="text-xs text-gray-500 mt-4 text-center">
            <p>Ensure your file follows the required format.</p>
            <p class="mt-1">Max file size: 5MB</p>
          </div>
        </div>

        <template #bottom>
          <div class="flex justify-between items-center w-full p-4 border-t gap-3">
            <Button
              @click="closeModal('import-modal')"
              class="border border-gray-300 text-gray-700 hover:bg-gray-50"
              size="md"
              :disabled="importing"
            >
              Cancel
            </Button>
            <div class="flex gap-3">
              <Button
                v-if="selectedFile && !importing && message.type !== 'success'"
                @click="removeFile"
                class="border border-gray-300 text-gray-700 hover:bg-gray-50"
                size="md"
              >
                Change File
              </Button>
              <Button
                v-if="selectedFile && !importing && message.type !== 'success'"
                @click="importFile"
                class="bg-blue-600 text-white hover:bg-blue-700"
                size="md"
              >
                Import Now
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
</style>