<script setup>
import { closeModal } from '@customizer/modal-x';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import { ref, computed } from 'vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';
import { settleClaimPayment } from '../api/claimApi';
import { toasted, formatCurrency } from '@/utils/utils';
import { useApiRequest } from '@/composables/useApiRequest';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

// Data from parent
const claimUuid = props.data?.claimUuid || '';
const selectedServices = ref(props.data?.selectedServices || []);
const totalAmount = computed(() => {
  return selectedServices.value.reduce((sum, s) => sum + (s.amount || 0), 0);
});

// Form fields
const amount = ref(totalAmount.value);
const paymentType = ref('BANK_TRANSFER');
const checkNumber = ref('');
const receiptNumber = ref('');
const receiptDate = ref(new Date().toISOString().split('T')[0]);
const withHoldingTax = ref(0);
const revenueStamp = ref(0);
const recipientType = ref('INSTITUTION');
const recipientUuid = ref(props.data?.institutionUuid || '');
const recipientName = ref(props.data?.institutionName || '');
const attachment = ref(null);
const error = ref('');

const apiRequest = useApiRequest();

const paymentTypes = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CASH', label: 'Cash' },
];

const recipientTypes = [
  { value: 'INSTITUTION', label: 'Institution' },
  { value: 'PROVIDER', label: 'Provider' },
  { value: 'INSURED', label: 'Insured' },
];

function onFileChange(event) {
  const file = event.target.files?.[0];
  attachment.value = file || null;
}

function removeFile() {
  attachment.value = null;
  // Reset file input
  const fileInput = document.getElementById('settle-attachment-input');
  if (fileInput) fileInput.value = '';
}

async function submit() {
  // Validation
  if (!selectedServices.value.length) {
    error.value = 'No services selected for payment settlement.';
    return;
  }
  if (!amount.value || amount.value <= 0) {
    error.value = 'Amount must be greater than 0.';
    return;
  }
  if (!receiptNumber.value?.trim()) {
    error.value = 'Receipt number is required.';
    return;
  }
  if (!receiptDate.value) {
    error.value = 'Receipt date is required.';
    return;
  }

  error.value = '';

  const serviceProvidedUuids = selectedServices.value.map(s => s.serviceProvidedUuid);

  const claimPaymentRequest = {
    serviceProvidedUuids,
    amount: Number(amount.value),
    paymentType: paymentType.value,
    checkNumber: checkNumber.value?.trim() || '',
    receiptNumber: receiptNumber.value?.trim() || '',
    receiptDate: new Date(receiptDate.value).toISOString(),
    withHoldingTax: Number(withHoldingTax.value) || 0,
    revenueStamp: Number(revenueStamp.value) || 0,
    recipientType: recipientType.value,
    recipientUuid: recipientUuid.value?.trim() || '',
    recipientName: recipientName.value?.trim() || '',
  };

  const formData = new FormData();
  formData.append(
    'payClaimRequest',
    JSON.stringify(claimPaymentRequest)
  );

  if (attachment.value) {
    formData.append('attachment', attachment.value);
  }

  apiRequest.send(
    () => settleClaimPayment(claimUuid, formData),
    (res) => {
      if (res?.success === true || (res?.status >= 200 && res?.status < 300)) {
        toasted(true, 'Payment settled successfully');
        closeModal({ success: true });
        if (typeof props.data?.onSuccess === 'function') {
          props.data.onSuccess();
        }
      } else {
        const errorMessage = res?.error ||
                            res?.data?.detail ||
                            res?.data?.message ||
                            'Failed to settle payment';
        error.value = errorMessage;
      }
    },
    (err) => {
      error.value =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong while settling payment';
    }
  );
}

function handleManualClose() {
  if (!apiRequest.pending.value) {
    closeModal();
  }
}
</script>

<template>
  <ModalParent @close="handleManualClose">
    <NewFormParent
      class="w-[38rem]"
      :title="props.data?.title || 'Settle Payment'"
      subtitle="Fill in the payment details to settle the selected claims."
      size="md"
    >
      <Form id="settle-payment-form" :inner="true" class="p-0 bg-white" @submit.prevent="submit">
        <div class="flex flex-col gap-4 py-2">

          <!-- Error Banner -->
          <div v-if="error" class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            <div class="font-medium">Error:</div>
            <div>{{ error }}</div>
          </div>

          <!-- Selected Services Summary -->
          <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm font-semibold text-blue-800">
                  {{ selectedServices.length }} service{{ selectedServices.length > 1 ? 's' : '' }} selected
                </p>
                <p class="text-xs text-blue-600 mt-0.5">
                  Total claim amount: <span class="font-bold">ETB {{ formatCurrency(totalAmount) }}</span>
                </p>
              </div>
              <div class="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                {{ selectedServices.length }} items
              </div>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount (ETB) <span class="text-red-500">*</span></label>
              <input
                v-model.number="amount"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>

            <!-- Payment Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Type <span class="text-red-500">*</span></label>
              <select
                v-model="paymentType"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
              >
                <option v-for="pt in paymentTypes" :key="pt.value" :value="pt.value">{{ pt.label }}</option>
              </select>
            </div>

            <!-- Check Number (shown only for CHECK type) -->
            <div v-if="paymentType === 'CHECK'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
              <input
                v-model="checkNumber"
                type="text"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. CHK-12345"
              />
            </div>

            <!-- Receipt Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Receipt Number <span class="text-red-500">*</span></label>
              <input
                v-model="receiptNumber"
                type="text"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. REC-56789"
              />
            </div>

            <!-- Receipt Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Receipt Date <span class="text-red-500">*</span></label>
              <input
                v-model="receiptDate"
                type="date"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <!-- Withholding Tax -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Withholding Tax</label>
              <input
                v-model.number="withHoldingTax"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>

            <!-- Revenue Stamp -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Revenue Stamp</label>
              <input
                v-model.number="revenueStamp"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Recipient Section -->
          <div class="pt-3 border-t border-gray-200">
            <p class="text-sm font-semibold text-gray-800 mb-3">Recipient Information</p>
            <div class="grid grid-cols-2 gap-4">
              <!-- Recipient Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                <select
                  v-model="recipientType"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                >
                  <option v-for="rt in recipientTypes" :key="rt.value" :value="rt.value">{{ rt.label }}</option>
                </select>
              </div>

              <!-- Recipient Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                <input
                  v-model="recipientName"
                  type="text"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Recipient name"
                />
              </div>
            </div>
          </div>

          <!-- Attachment -->
          <div class="pt-3 border-t border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-2">Attachment (optional)</label>
            <div v-if="!attachment" class="relative">
              <input
                id="settle-attachment-input"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                @change="onFileChange"
                class="w-full px-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm cursor-pointer
                       file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0
                       file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
                       hover:border-blue-400 transition-all"
              />
            </div>
            <div v-else class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm text-green-800 font-medium">{{ attachment.name }}</span>
                <span class="text-xs text-green-600">({{ (attachment.size / 1024).toFixed(1) }} KB)</span>
              </div>
              <button
                type="button"
                @click="removeFile"
                class="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 justify-end items-center pt-3 border-t">
            <Button
              type="link"
              :disabled="apiRequest.pending.value"
              @click="handleManualClose"
            >
              Cancel
            </Button>

            <Button
              type="primary"
              :pending="apiRequest.pending.value"
              :disabled="apiRequest.pending.value"
              as="button"
              html-type="submit"
              class="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              Settle Payment
            </Button>
          </div>

        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
