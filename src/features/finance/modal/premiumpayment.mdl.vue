<script setup lang="ts">
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { computed, reactive, watch, ref, onUnmounted } from "vue";
import { paypremium } from "@/features/finance/api/FinanceApi";

// Types
interface Props {
  data?: {
    totalPremium?: number;
    quotationUuid?: string;
    id?: string;
  };
}

const props = defineProps<Props>();

// Constants
const DEFAULT_TAX_PERCENTAGE = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/svg+xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet'
];

const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  'xlsx', 'xls', 'csv', 'odt', 'ods'
];

const FILE_TYPE_DISPLAY: Record<string, string> = {
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

// Composables
const { submit } = useForm("premiumPaymentForm");
const req = useApiRequest();

// State
const attachmentFile = ref<File | null>(null);
const fileName = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const hasAttemptedSubmit = ref(false);
const receiptNumber = ref("");
const receiptDate = ref(getTodayDate());

// Event handler for payment success
const paymentSuccessHandler = () => {
  // Handle any cleanup or additional logic
  console.log('Payment successful');
};

// Lifecycle
onUnmounted(() => {
  window.removeEventListener('paymentSuccess', paymentSuccessHandler);
});

// Helper functions
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateWithholdingTax(premium: number, percentage: number): number {
  return parseFloat((premium * (percentage / 100)).toFixed(2));
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getFileTypeDisplay(extension: string | undefined): string {
  if (!extension) return 'File';
  return FILE_TYPE_DISPLAY[extension] || extension.toUpperCase();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// State with validation
const num = Math.max(0, Number(props.data?.totalPremium || 0));

const state = reactive({
  requestedPremium: num,
  revenueStamp: 0,
  taxPercentage: DEFAULT_TAX_PERCENTAGE,
  withHoldingTax: calculateWithholdingTax(num, DEFAULT_TAX_PERCENTAGE),
  calculateTax: true,
});

// Computed properties
const netPremium = computed(() => {
  const reqAmt = Number(state.requestedPremium || 0);
  const rs = Number(state.revenueStamp || 0);
  const wht = Number(state.withHoldingTax || 0);
  return Math.max(0, reqAmt + rs - wht);
});

// Watchers
watch(
  () => state.taxPercentage,
  (newVal) => {
    if (state.calculateTax && state.requestedPremium > 0) {
      state.withHoldingTax = calculateWithholdingTax(state.requestedPremium, newVal);
    }
  }
);

// File validation
function validateFile(file: File): boolean {
  // Check file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
    toasted(false, null, 'Please upload a valid file (PDF, Image, Word, Excel, or text files)');
    return false;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    toasted(false, null, 'File size must be less than 10MB');
    return false;
  }

  // Check MIME type (if available)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    // Some browsers might not provide MIME type, so we don't strictly enforce this
    console.warn('Unusual MIME type:', file.type);
  }

  return true;
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (validateFile(file)) {
      attachmentFile.value = file;
      fileName.value = file.name;
      hasAttemptedSubmit.value = false; // Reset error state
    } else {
      // Reset the input
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
      }
    }
  }
}

function removeFile() {
  attachmentFile.value = null;
  fileName.value = "";
  hasAttemptedSubmit.value = false;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function triggerFileUpload() {
  if (fileInputRef.value && !req.pending.value) {
    fileInputRef.value.click();
  }
}

function recalcTax() {
  state.calculateTax = true;
  if (state.requestedPremium > 0) {
    state.withHoldingTax = calculateWithholdingTax(state.requestedPremium, state.taxPercentage);
  }
}

function handleWithholdingTaxInput(value: string) {
  state.withHoldingTax = parseFloat(value) || 0;
  state.calculateTax = false;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  if (req.pending.value) return;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (validateFile(file)) {
      attachmentFile.value = file;
      fileName.value = file.name;
      hasAttemptedSubmit.value = false;
    }
  }
}

// Payment validation
function validatePaymentForm(): boolean {
  hasAttemptedSubmit.value = true;
  
  if (!receiptNumber.value?.trim()) {
    toasted(false, null, "Receipt Number is required");
    return false;
  }
  
  if (!receiptDate.value) {
    toasted(false, null, "Receipt Date is required");
    return false;
  }
  
  if (!attachmentFile.value) {
    toasted(false, null, "Payment attachment is required");
    return false;
  }

  return true;
}

// Payment processing
function pay(): Promise<any> {
  if (!validatePaymentForm()) {
    return Promise.reject(new Error("Validation failed"));
  }

  const quotationUuid = props.data?.quotationUuid || props.data?.id;

  if (!quotationUuid) {
    toasted(false, null, "Missing quotation information");
    return Promise.reject(new Error("Missing quotation information"));
  }

  const quotationPaymentRequest = {
    receiptNumber: receiptNumber.value.trim(),
    receiptDate: receiptDate.value,
    requestedPremium: Number(state.requestedPremium || 0),
    revenueStamp: Number(state.revenueStamp || 0),
    withHoldingTax: Number(state.withHoldingTax || 0),
    netPremium: Number(netPremium.value || 0),
  };

  const formData = new FormData();
  formData.append("quotationPaymentRequest", JSON.stringify(quotationPaymentRequest));
  formData.append("attachment", attachmentFile.value as Blob);
  
  return new Promise((resolve, reject) => {
    req.send(
      () => paypremium(quotationUuid, formData),
      (res) => {
        if (res.success) {
          toasted(true, "Payment recorded successfully");
          window.dispatchEvent(new CustomEvent('paymentSuccess'));
          setTimeout(() => {
            closeModal();
          }, 100);
          resolve(res);
        } else {
          const errorMsg = res?.error || res?.message || 'Payment failed';
          reject(new Error(errorMsg));
        }
      },
      (error) => {
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Payment failed. Please try again.';
        reject(error);
      }
    );
  });
}

async function processPayment() {
  try {
    // Validate form first
    if (!validatePaymentForm()) {
      return;
    }

    // Use the form's submit mechanism
    const result = await submit(pay);
    
    // If submit returns false, it means validation failed within the form
    if (result === false) {
      // The form validation already handles the error messages
      return;
    }
    
    // Success path
    console.log('Payment processed successfully');
  } catch (error) {
    // Error already handled in pay function
    console.error('Payment processing failed:', error);
  }
}

function handleCancel() {
  closeModal();
}
</script>

<template>
  <div 
    class="grid place-items-center p-4 min-h-full bg-black/50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="payment-dialog-title"
  >
    <NewFormParent
      size="md"
      class="flex justify-center bg-white"
      title="Premium Payment"
      subtitle="Fill in the details below to process payment"
    >
      <form 
        id="premiumPaymentForm" 
        @submit.prevent="processPayment"
        novalidate
      >
        <div class="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2">
          <!-- Receipt Number -->
          <div class="flex flex-col gap-1.5">
            <label 
              for="receiptNumber"
              class="text-sm font-semibold text-gray-700"
            >
              Receipt Number <span class="text-red-500" aria-hidden="true">*</span>
              <span class="sr-only">Required</span>
            </label>
            <input
              id="receiptNumber"
              v-model="receiptNumber"
              type="text"
              class="px-4 py-3 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :class="{ 'border-red-500 ring-2 ring-red-200': hasAttemptedSubmit && !receiptNumber.trim() }"
              placeholder="Enter receipt number"
              :disabled="req.pending.value"
              aria-required="true"
              aria-describedby="receiptNumber-error"
              maxlength="50"
            />
            <p 
              v-if="hasAttemptedSubmit && !receiptNumber.trim()" 
              id="receiptNumber-error"
              class="text-xs text-red-500"
            >
              Receipt number is required
            </p>
          </div>

          <!-- Receipt Date -->
          <div class="flex flex-col gap-1.5">
            <label 
              for="receiptDate"
              class="text-sm font-semibold text-gray-700"
            >
              Receipt Date <span class="text-red-500" aria-hidden="true">*</span>
              <span class="sr-only">Required</span>
            </label>
            <input
              id="receiptDate"
              v-model="receiptDate"
              type="date"
              class="px-4 py-3 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :class="{ 'border-red-500 ring-2 ring-red-200': hasAttemptedSubmit && !receiptDate }"
              :disabled="req.pending.value"
              aria-required="true"
              max="2100-12-31"
            />
            <p 
              v-if="hasAttemptedSubmit && !receiptDate" 
              class="text-xs text-red-500"
            >
              Receipt date is required
            </p>
          </div>

          <!-- Requested Premium (Disabled) -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-gray-700">Requested Premium</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 text-sm font-medium text-gray-400 -translate-y-1/2">ETB</span>
              <input
                :value="state.requestedPremium"
                type="number"
                class="py-3 pr-4 pl-12 w-full text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100 cursor-not-allowed"
                disabled
                aria-readonly="true"
              />
            </div>
          </div>

          <!-- Revenue Stamp -->
          <div class="flex flex-col gap-1.5">
            <label 
              for="revenueStamp"
              class="text-sm font-semibold text-gray-700"
            >
              Revenue Stamp
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 text-sm font-medium text-gray-400 -translate-y-1/2">ETB</span>
              <input
                id="revenueStamp"
                v-model.number="state.revenueStamp"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="py-3 pr-4 pl-12 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                :disabled="req.pending.value"
                aria-label="Revenue Stamp amount in ETB"
              />
            </div>
          </div>

          <!-- Tax Percentage -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
              <label 
                for="taxPercentage"
                class="text-sm font-semibold text-gray-700"
              >
                Tax Percentage
              </label>
              <span class="px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded-full">Default: 3%</span>
            </div>
            <div class="relative">
              <input
                id="taxPercentage"
                v-model.number="state.taxPercentage"
                @input="recalcTax"
                type="number"
                step="0.5"
                min="0"
                max="100"
                class="px-4 py-3 pr-10 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                :disabled="req.pending.value"
                aria-label="Tax percentage"
              />
              <span class="absolute right-4 top-1/2 text-sm font-semibold text-gray-400 -translate-y-1/2">%</span>
            </div>
          </div>

          <!-- Withholding Tax -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
              <label 
                for="withholdingTax"
                class="text-sm font-semibold text-gray-700"
              >
                Withholding Tax
              </label>
              <button
                v-if="!state.calculateTax"
                @click="recalcTax"
                type="button"
                class="text-xs font-semibold text-green-600 transition-colors duration-200 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg px-2 py-1"
                :disabled="req.pending.value"
                aria-label="Auto-calculate withholding tax"
              >
                Auto-calculate
              </button>
            </div>
            <div class="relative">
              <span class="absolute left-4 top-1/2 text-sm font-medium text-gray-400 -translate-y-1/2">ETB</span>
              <input
                id="withholdingTax"
                :value="state.withHoldingTax"
                @input="(e) => handleWithholdingTaxInput((e.target as HTMLInputElement).value)"
                type="number"
                step="0.01"
                min="0"
                :disabled="state.calculateTax || req.pending.value"
                class="py-3 pr-4 pl-12 w-full text-sm rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                :class="{ 'bg-gray-50 text-gray-500 cursor-not-allowed': state.calculateTax }"
                :aria-readonly="state.calculateTax"
                aria-label="Withholding tax amount in ETB"
              />
            </div>
          </div>

          <!-- Net Premium Display -->
          <div class="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 sm:col-span-2">
            <div>
              <p class="text-xs font-medium text-green-700">Net Premium</p>
              <p class="text-xs text-green-600 opacity-70">Requested + Stamp − WHT</p>
            </div>
            <span class="text-2xl font-bold tracking-tight text-green-700" aria-live="polite">
              ETB {{ formatCurrency(netPremium) }}
            </span>
          </div>

          <!-- File Upload -->
          <div class="flex flex-col gap-2 sm:col-span-2">
            <label class="text-sm font-semibold text-gray-700">
              Attachment <span class="text-red-500" aria-hidden="true">*</span>
              <span class="sr-only">Required</span>
              <span class="ml-1 text-xs font-normal text-gray-400">(PDF, Image, Word, Excel, or text files, max 10MB)</span>
            </label>

            <div
              class="relative p-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer group"
              :class="{
                'border-green-400 bg-green-50': attachmentFile,
                'border-gray-300 bg-gray-50': !attachmentFile && !hasAttemptedSubmit && !req.pending.value,
                'border-red-300 bg-red-50': !attachmentFile && hasAttemptedSubmit && !req.pending.value,
                'opacity-50 cursor-not-allowed': req.pending.value
              }"
              @click="!attachmentFile && !req.pending.value && triggerFileUpload()"
              @dragover="handleDragOver"
              @drop="handleDrop"
              role="button"
              tabindex="0"
              :aria-label="attachmentFile ? `File selected: ${fileName}` : 'Upload payment attachment'"
              @keydown.enter="!attachmentFile && !req.pending.value && triggerFileUpload()"
              @keydown.space="!attachmentFile && !req.pending.value && triggerFileUpload()"
            >
              <input
                ref="fileInputRef"
                type="file"
                :accept="ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')"
                class="hidden"
                @change="handleFileUpload"
                :disabled="req.pending.value"
                aria-label="Choose payment attachment file"
              />

              <div v-if="!attachmentFile" class="flex flex-col gap-3 items-center py-2">
                <div class="flex justify-center items-center w-12 h-12 bg-green-100 rounded-2xl transition-colors duration-200 group-hover:bg-green-200">
                  <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div class="text-center">
                  <p class="text-sm font-medium text-gray-700">
                    <span class="text-green-600">Click to upload</span> or drag and drop
                  </p>
                  <p class="mt-0.5 text-xs text-gray-500">
                    {{ hasAttemptedSubmit ? 'Attachment is required' : 'Supported files: PDF, Image, Word, Excel' }}
                  </p>
                </div>
              </div>

              <div v-else class="flex gap-4 justify-between items-center">
                <div class="flex gap-4 items-center min-w-0">
                  <div class="flex justify-center items-center w-12 h-12 rounded-xl shrink-0"
                    :class="{
                      'bg-red-100': fileName.endsWith('.pdf'),
                      'bg-green-100': fileName.match(/\.(xlsx|xls|csv)$/i),
                      'bg-blue-100': fileName.match(/\.(doc|docx|txt|rtf)$/i),
                      'bg-purple-100': fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i),
                      'bg-gray-100': !fileName.match(/\.(pdf|xlsx|xls|csv|doc|docx|txt|rtf|jpg|jpeg|png|gif|bmp|webp|svg)$/i)
                    }"
                  >
                    <!-- File type icons -->
                    <svg v-if="fileName.endsWith('.pdf')" class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <svg v-else-if="fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)" class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <svg v-else-if="fileName.match(/\.(doc|docx|txt|rtf)$/i)" class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <svg v-else-if="fileName.match(/\.(xlsx|xls|csv)$/i)" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <svg v-else class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate" :title="fileName">{{ fileName }}</p>
                    <p class="mt-0.5 text-xs text-gray-400">
                      {{ formatFileSize(attachmentFile.size) }} · 
                      {{ getFileTypeDisplay(fileName.split('.').pop()?.toLowerCase()) }}
                    </p>
                  </div>
                </div>
                <button
                  @click.stop="removeFile"
                  class="flex justify-center items-center w-8 h-8 text-gray-400 rounded-lg transition-all duration-200 hover:text-red-500 hover:bg-red-50 shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500"
                  type="button"
                  :disabled="req.pending.value"
                  aria-label="Remove file"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p 
              v-if="hasAttemptedSubmit && !attachmentFile" 
              class="text-xs text-red-500"
              role="alert"
            >
              Payment attachment is required
            </p>
          </div>
        </div>
      </form>

      <template #bottom>
        <div class="flex gap-3 justify-end p-2 px-4 w-full">
          <Button 
            class="!text-white bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-500" 
            @click.prevent="handleCancel"
            :disabled="req.pending.value"
            aria-label="Cancel payment"
          >
            Cancel
          </Button>
          <Button
            class="flex items-center gap-3 bg-primary !text-white min-w-[160px] justify-center hover:bg-primary-dark focus:ring-2 focus:ring-primary"
            :pending="req.pending.value"
            type="primary"
            @click.prevent="processPayment"
            :disabled="req.pending.value"
            aria-label="Process payment"
          >
            <template v-if="!req.pending.value">Process Payment</template>
            <template v-else>
              <span class="sr-only">Processing payment</span>
              Processing…
            </template>
          </Button>
        </div>
      </template>   
    </NewFormParent>
  </div>
</template>