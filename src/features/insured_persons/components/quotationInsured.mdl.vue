<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import {
  importQuotedMainMembers,
  importQuotedDependants,
} from "../api/insuredPersonsApi";

const route = useRoute();

const quotationUuid = computed(() => route.params.quotationUuid || route.params.institutionName);
const payerInstitutionContractUuid = computed(() => route.params.id);

const importType = ref("main");
const fileInput = ref(null);
const selectedFile = ref(null);
const fileName = ref("");

const importing = ref(false);
const progress = ref(0);

const res = useApiRequest();

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
  ];

  if (!validTypes.includes(file.type)) {
    toasted(false, "Please upload a valid Excel (.xlsx, .xls) or CSV file", "");
    return;
  }

  selectedFile.value = file;
  fileName.value = file.name;
}

function clearFile() {
  selectedFile.value = null;
  fileName.value = "";
  if (fileInput.value) fileInput.value.value = "";
}

function buildFormData() {
  const fd = new FormData();
  fd.append("file", selectedFile.value);
  return fd;
}

function importNow() {
  if (!quotationUuid.value) {
    toasted(false, "quotationUuid not found in route", "");
    return;
  }

  if (!payerInstitutionContractUuid.value) {
    toasted(false, "payerInstitutionContractUuid not found in route", "");
    return;
  }

  if (!selectedFile.value) {
    toasted(false, "Please select a file first", "");
    return;
  }

  importing.value = true;
  progress.value = 0;

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
    () => {
      importing.value = false;
      toasted(true, "Import completed", "");
      closeModal();
    },
    (error) => {
      importing.value = false;
      const msg = error?.response?.data?.message || "Import failed";
      toasted(false, msg, "");
    }
  );
}
</script>

<template>
  <div class="grid place-items-center p-6 min-h-full bg-black/50">
    <ModalParent>
      <NewFormParent size="md" :title="'Import Quotation Insured'">
        <div class="p-6 space-y-6">
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-sm text-gray-700">
              <div class="font-semibold">Quotation UUID</div>
              <div class="mt-1 text-gray-600">{{ quotationUuid }}</div>
            </div>
            <div class="mt-3 text-sm text-gray-700">
              <div class="font-semibold">Contract UUID</div>
              <div class="mt-1 text-gray-600">{{ payerInstitutionContractUuid }}</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-sm font-semibold text-gray-800">Import type</div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <label class="flex gap-2 items-center p-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
                <input type="radio" value="main" v-model="importType" />
                <span class="text-sm">Import quoted main members</span>
              </label>
              <label class="flex gap-2 items-center p-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
                <input type="radio" value="dependant" v-model="importType" />
                <span class="text-sm">Import quoted dependants</span>
              </label>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-sm font-semibold text-gray-800">Upload file</div>
            <div
              class="p-4 rounded-lg border border-dashed border-gray-300 bg-white cursor-pointer hover:bg-gray-50"
              @click="triggerFileInput"
            >
              <div v-if="!selectedFile" class="text-sm text-gray-600">
                Click to choose Excel/CSV file
              </div>
              <div v-else class="flex justify-between items-center">
                <div class="text-sm text-gray-700 truncate">{{ fileName }}</div>
                <button class="text-sm text-red-600" @click.stop.prevent="clearFile">
                  Remove
                </button>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".csv, .xlsx, .xls"
              class="hidden"
              @change="handleFile"
            />
          </div>

          <div v-if="importing" class="space-y-2">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span class="font-semibold">{{ progress }}%</span>
            </div>
            <div class="overflow-hidden w-full h-2.5 bg-gray-200 rounded-full">
              <div
                class="h-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                :style="`width: ${progress}%`"
              />
            </div>
          </div>

          <div class="flex gap-3 justify-end">
            <Button class="px-4 py-2" @click.prevent="closeModal">Cancel</Button>
            <Button
              class="px-4 py-2 text-white bg-primary"
              :disabled="importing"
              @click.prevent="importNow"
            >
              Import
            </Button>
          </div>
        </div>
      </NewFormParent>
    </ModalParent>
  </div>
</template>
