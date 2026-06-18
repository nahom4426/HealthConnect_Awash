<!-- premiumpayment.mdl.vue -->
<script setup>
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { computed, reactive, watch, ref, onMounted, nextTick } from "vue";
import { paypremium } from "@/features/finance/api/FinanceApi";

const props = defineProps({
  data: Object,
});

console.log("🔵 Modal mounted with props:", props.data);

const DEFAULT_TAX_PERCENTAGE = 3;

const { submit } = useForm("premiumPaymentForm");
const req = useApiRequest();

const num = Number(props.data?.totalPremium || 0);

// File attachment state
const attachmentFile = ref(null);
const fileName = ref("");
const fileInputRef = ref(null);

// Form values
const receiptNumber = ref("");
const receiptDate = ref(getTodayDate());

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const state = reactive({
  requestedPremium: num,
  revenueStamp: 0,
  taxPercentage: DEFAULT_TAX_PERCENTAGE,
  withHoldingTax: num * (DEFAULT_TAX_PERCENTAGE / 100),
  calculateTax: true,
});

function calculateWithholdingTax(premium, percentage) {
  return parseFloat((premium * (percentage / 100)).toFixed(2));
}

watch(
  () => state.taxPercentage,
  (newVal) => {
    if (state.calculateTax && state.requestedPremium > 0) {
      state.withHoldingTax = calculateWithholdingTax(state.requestedPremium, newVal);
    }
  }
);

watch(
  () => state.withHoldingTax,
  (newVal, oldVal) => {
    if (newVal !== oldVal && state.calculateTax) {
      state.calculateTax = false;
    }
  }
);

const netPremium = computed(() => {
  const reqAmt = Number(state.requestedPremium || 0);
  const rs = Number(state.revenueStamp || 0);
  const wht = Number(state.withHoldingTax || 0);
  return Math.max(0, reqAmt + rs - wht);
});

function recalcTax() {
  state.calculateTax = true;
  if (state.requestedPremium > 0) {
    state.withHoldingTax = calculateWithholdingTax(state.requestedPremium, state.taxPercentage);
  }
}

function formatCurrency(value) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ALLOWED FILE TYPES - Updated to include images, PDFs, and documents
const ALLOWED_FILE_TYPES = [
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
  // Documents
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  // Spreadsheets (keeping these too)
  'xlsx', 'xls',
  // Other common types
  'csv', 'odt', 'ods'
];

// Optional: Map extensions to human-readable names for display
const FILE_TYPE_DISPLAY = {
  'jpg': 'JPEG Image',
  'jpeg': 'JPEG Image',
  'png': 'PNG Image',
  'gif': 'GIF Image',
  'pdf': 'PDF Document',
  'doc': 'Word Document',
  'docx': 'Word Document',
  'xlsx': 'Excel Spreadsheet',
  'xls': 'Excel Spreadsheet',
  'txt': 'Text File',
  'csv': 'CSV File'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function handleFileUpload(event) {
  const target = event.target;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Check if file type is allowed
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      toasted(false, null, 'Please upload a valid file (PDF, Image, Word, Excel, or text files)');
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
      }
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toasted(false, null, 'File size must be less than 10MB');
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
      }
      return;
    }
    
    attachmentFile.value = file;
    fileName.value = file.name;
  }
}

function removeFile() {
  attachmentFile.value = null;
  fileName.value = "";
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function triggerFileUpload() {
  if (fileInputRef.value && !req.pending.value) {
    fileInputRef.value.click();
  }
}

// Get file type display name
function getFileTypeDisplay(extension) {
  return FILE_TYPE_DISPLAY[extension] || extension?.toUpperCase() || 'File';
}

// Main pay function - this is what should process the payment
function pay() {
  console.log("🟢🟢🟢 PAY FUNCTION CALLED 🟢🟢🟢");
  
  // Validate required fields
  if (!receiptNumber.value?.trim()) {
    toasted(false, null, "Receipt Number is required");
    return;
  }
  
  if (!receiptDate.value) {
    toasted(false, null, "Receipt Date is required");
    return;
  }
  
  // Attachment is now optional - removed the validation check

  const quotationUuid = props.data?.quotationUuid || props.data?.id;

  const quotationPaymentRequest = {
    receiptNumber: receiptNumber.value,
    receiptDate: receiptDate.value,
    requestedPremium: Number(state.requestedPremium || 0),
    revenueStamp: Number(state.revenueStamp || 0),
    withHoldingTax: Number(state.withHoldingTax || 0),
    netPremium: Number(netPremium.value || 0),
  };

  const formData = new FormData();
  formData.append("quotationPaymentRequest", JSON.stringify(quotationPaymentRequest));
  
  // Only append attachment if a file was selected
  if (attachmentFile.value) {
    formData.append("attachment", attachmentFile.value);
  }
  
  req.send(
    () => paypremium(quotationUuid, formData),
    (res) => {
      toasted(res.success, "Payment recorded successfully", res.error);
      if (res.success) {
        closeModal();
      }
    }
  );
}

// Process payment - handles both submit flow and direct call
async function processPayment() {
  console.log("🟣🟣🟣 PROCESS PAYMENT CLICKED 🟣🟣🟣");
  
  // Try submit first (like drug modal)
  try {
    const result = await submit(pay);
    console.log("🟣 Submit completed with result:", result);
    
    // If submit returns false or doesn't call pay, call pay directly
    if (result === false) {
      console.log("🟣 Submit returned false, calling pay directly");
      pay();
    }
  } catch (error) {
    console.log("🔴 Submit error:", error);
    // If submit fails, call pay directly
    pay();
  }
}
</script>

<template>
  <div class="grid place-items-center p-4 min-h-full bg-black/50">
    <NewFormParent
      size="md"
      class="flex justify-center bg-white"
      title="Premium Payment"
      subtitle="Fill in the details below to process payment"
    >
      <form id="premiumPaymentForm" @submit.prevent="processPayment">
        <div class="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-gray-700">
              Receipt Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="receiptNumber"
              class="px-4 py-3 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter receipt number"
              :disabled="req.pending.value"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-gray-700">
              Receipt Date <span class="text-red-500">*</span>
            </label>
            <input
              v-model="receiptDate"
              type="date"
              class="px-4 py-3 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="req.pending.value"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-gray-700">Requested Premium</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 text-sm font-medium text-gray-400 -translate-y-1/2">ETB</span>
              <input
                v-model.number="state.requestedPremium"
                type="number"
                class="py-3 pr-4 pl-12 w-full text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-gray-700">Revenue Stamp</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 text-sm font-medium text-gray-400 -translate-y-1/2">ETB</span>
              <input
                v-model.number="state.revenueStamp"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="py-3 pr-4 pl-12 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                :disabled="req.pending.value"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
              <label class="text-sm font-semibold text-gray-700">Tax Percentage</label>
              <span class="px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded-full">Default: 3%</span>
            </div>
            <div class="relative">
              <input
                v-model.number="state.taxPercentage"
                @input="recalcTax"
                type="number"
                step="0.5"
                min="0"
                max="100"
                class="px-4 py-3 pr-10 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                :disabled="req.pending.value"
              />
              <span class="absolute right-4 top-1/2 text-sm font-semibold text-gray-400 -translate-y-1/2">%</span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
              <label class="text-sm font-semibold text-gray-700">Withholding Tax</label>
              <button
                v-if="!state.calculateTax"
                @click="recalcTax"
                type="button"
                class="text-xs font-semibold text-green-600 transition-colors duration-200 hover:text-green-700"
                :disabled="req.pending.value"
              >
                Auto-calculate
              </button>
            </div>
            <div class="relative">
              <span class="absolute left-4 top-1/2 text-sm font-medium text-gray-400 -translate-y-1/2">ETB</span>
              <input
                :value="state.withHoldingTax"
                @input="(e) => { state.withHoldingTax = parseFloat(e.target.value) || 0; state.calculateTax = false; }"
                type="number"
                step="0.01"
                min="0"
                :disabled="state.calculateTax || req.pending.value"
                class="py-3 pr-4 pl-12 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                :class="{ 'bg-gray-50 text-gray-500 cursor-not-allowed': state.calculateTax }"
              />
            </div>
          </div>

          <div class="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 sm:col-span-2">
            <div>
              <p class="text-xs font-medium text-green-700">Net Premium</p>
              <p class="text-xs text-green-600 opacity-70">Requested + Stamp − WHT</p>
            </div>
            <span class="text-2xl font-bold tracking-tight text-green-700">
              ETB {{ formatCurrency(netPremium) }}
            </span>
          </div>

          <!-- Custom File Attachment - Optional -->
          <div class="flex flex-col gap-2 sm:col-span-2">
            <label class="text-sm font-semibold text-gray-700">
              Attachment 
              <span class="ml-1 text-xs font-normal text-gray-400">(Optional - PDF, Image, Word, Excel, or text files, max 10MB)</span>
            </label>

            <div
              class="relative p-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer group"
              :class="{
                'border-green-400 bg-green-50': attachmentFile,
                'border-gray-200 hover:border-green-400 hover:bg-green-50/40': !attachmentFile && !req.pending.value,
                'opacity-50 cursor-not-allowed': req.pending.value
              }"
              @click="!attachmentFile && !req.pending.value && triggerFileUpload()"
              @dragover.prevent
              @drop.prevent="(e) => {
                if (req.pending.value) return;
                const files = e.dataTransfer?.files;
                if (files && files.length > 0) {
                  const file = files[0];
                  const fileExtension = file.name.split('.').pop()?.toLowerCase();
                  if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
                    toasted(false, null, 'Please upload a valid file (PDF, Image, Word, Excel, or text files)');
                    return;
                  }
                  if (file.size > MAX_FILE_SIZE) {
                    toasted(false, null, 'File size must be less than 10MB');
                    return;
                  }
                  attachmentFile = file;
                  fileName = file.name;
                }
              }"
            >
              <input
                ref="fileInputRef"
                type="file"
                :accept="ALLOWED_FILE_TYPES.map(ext => `.${ext}`).join(',')"
                class="hidden"
                @change="handleFileUpload"
                :disabled="req.pending.value"
              />

              <!-- Empty state -->
              <div v-if="!attachmentFile" class="flex flex-col gap-3 items-center py-2">
                <div class="flex justify-center items-center w-12 h-12 bg-gray-100 rounded-2xl transition-colors duration-200 group-hover:bg-green-100">
                  <svg class="w-6 h-6 text-gray-400 transition-colors duration-200 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div class="text-center">
                  <p class="text-sm font-medium text-gray-600">
                    <span class="text-green-600">Click to upload</span> or drag and drop
                  </p>
                  <p class="mt-0.5 text-xs text-gray-400">PDF, Images, Word, Excel, or text files (optional)</p>
                </div>
              </div>

              <!-- File attached state -->
              <div v-else class="flex gap-4 justify-between items-center">
                <div class="flex gap-4 items-center">
                  <!-- Dynamic icon based on file type -->
                  <div class="flex justify-center items-center w-12 h-12 rounded-xl shrink-0"
                    :class="{
                      'bg-red-100': fileName.endsWith('.pdf'),
                      'bg-green-100': fileName.match(/\.(xlsx|xls|csv)$/i),
                      'bg-blue-100': fileName.match(/\.(doc|docx|txt|rtf)$/i),
                      'bg-purple-100': fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i),
                      'bg-gray-100': !fileName.match(/\.(pdf|xlsx|xls|csv|doc|docx|txt|rtf|jpg|jpeg|png|gif|bmp|webp|svg)$/i)
                    }"
                  >
                    <!-- PDF Icon -->
                    <svg v-if="fileName.endsWith('.pdf')" class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <!-- Image Icon -->
                    <svg v-else-if="fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)" class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <!-- Word/Text Icon -->
                    <svg v-else-if="fileName.match(/\.(doc|docx|txt|rtf)$/i)" class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <!-- Excel Icon -->
                    <svg v-else-if="fileName.match(/\.(xlsx|xls|csv)$/i)" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <!-- Generic file icon -->
                    <svg v-else class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{{ fileName }}</p>
                    <p class="mt-0.5 text-xs text-gray-400">
                      {{ (attachmentFile.size / 1024).toFixed(2) }} KB · 
                      {{ getFileTypeDisplay(fileName.split('.').pop()?.toLowerCase()) }}
                    </p>
                  </div>
                </div>
                <button
                  @click.stop="removeFile"
                  class="flex justify-center items-center w-8 h-8 text-gray-400 rounded-lg transition-all duration-200 hover:text-red-500 hover:bg-red-50 shrink-0"
                  type="button"
                  :disabled="req.pending.value"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <template #bottom>
        <div class="flex gap-3 justify-end p-2 px-4 w-full">
          <Button 
            class="!text-gray-600" 
            type="secondary" 
            @click.prevent="closeModal"
            :disabled="req.pending.value"
          >
            Cancel
          </Button>
          <Button
            class="flex items-center gap-3 bg-primary !text-white min-w-[160px] justify-center"
            :pending="req.pending.value"
            type="primary"
            @click.prevent="processPayment"
          >
            <template v-if="!req.pending.value">Process Payment</template>
            <template v-else>Processing…</template>
          </Button>
        </div>
      </template>   
    </NewFormParent>
  </div>
</template>