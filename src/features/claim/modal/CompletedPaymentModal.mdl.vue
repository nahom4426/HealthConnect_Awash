<script>
import { ref, defineComponent, onMounted } from 'vue';
import { closeModal } from '@customizer/modal-x';

export default defineComponent({
  name: 'CompletedPaymentModal.mdl.vue',
  
  props: {
    claimUuid: {
      type: String,
      required: true
    },
    amount: {
      type: [Number, String],
      required: true
    },
    onSuccess: {
      type: Function,
      required: true
    },
    onClose: {
      type: Function,
      required: true
    }
  },

  setup(props) {
    // Close the modal when component is mounted to prevent slot warnings
    onMounted(() => {
      // This is a workaround for the modal system
      if (typeof closeModal === 'function') {
        closeModal();
      }
    });
    const receiptFile = ref(null);
    const receiptNumber = ref('');
    const paymentDate = ref(new Date().toISOString().split('T')[0]);
    const paymentMethod = ref('BANK_TRANSFER');
    const notes = ref('');
    const isLoading = ref(false);
    const error = ref(null);

    const paymentMethods = [
      { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
      { value: 'CASH', label: 'Cash' },
      { value: 'CHECK', label: 'Check' },
      { value: 'MOBILE_MONEY', label: 'Mobile Money' },
    ];

    const handleFileChange = (event) => {
      receiptFile.value = event.target.files[0];
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value);
    };

    const handleSubmit = async () => {
      if (!receiptNumber.value) {
        error.value = 'Please enter a receipt number';
        return;
      }

      const formData = new FormData();
      formData.append('claimUuid', props.claimUuid);
      formData.append('receiptNumber', receiptNumber.value);
      formData.append('paymentDate', paymentDate.value);
      formData.append('paymentMethod', paymentMethod.value);
      formData.append('notes', notes.value);
      
      if (receiptFile.value) {
        formData.append('receiptFile', receiptFile.value);
      }

      try {
        isLoading.value = true;
        error.value = null;
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        props.onSuccess({
          receiptNumber: receiptNumber.value,
          paymentDate: paymentDate.value,
          paymentMethod: paymentMethod.value,
          amount: props.amount
        });
        
        props.onClose();
      } catch (err) {
        console.error('Payment failed:', err);
        error.value = err.response?.data?.message || 'Failed to process payment. Please try again.';
      } finally {
        isLoading.value = false;
      }
    };

    return {
      receiptFile,
      receiptNumber,
      paymentDate,
      paymentMethod,
      notes,
      isLoading,
      error,
      paymentMethods,
      handleFileChange,
      handleSubmit,
      formatCurrency,
      // Emit close event
      closeModal: () => emit('close')
    };
  }
});
</script>

<template >
  
  <div class="fixed inset-0 z-50 overflow-y-auto" v-if="true">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" @click="onClose">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
      <div class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg">
        <div class="sm:flex sm:items-start">
          <div class="w-full mt-3 text-center sm:mt-0 sm:text-left">
            <h3 class="text-lg font-medium leading-6 text-gray-900">
              Confirm Payment
            </h3>
            <div class="mt-4">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Amount</label>
                  <div class="mt-1 text-gray-900">
                    {{ formatCurrency(amount) }}
                  </div>
                </div>

                <div>
                  <label for="receiptNumber" class="block text-sm font-medium text-gray-700">Receipt Number *</label>
                  <input
                    id="receiptNumber"
                    v-model="receiptNumber"
                    type="text"
                    class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter receipt number"
                    required
                  >
                </div>

                <div>
                  <label for="paymentDate" class="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    id="paymentDate"
                    v-model="paymentDate"
                    type="date"
                    class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                </div>

                <div>
                  <label for="paymentMethod" class="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    id="paymentMethod"
                    v-model="paymentMethod"
                    class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                      {{ method.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label for="receiptFile" class="block text-sm font-medium text-gray-700">Receipt (Optional)</label>
                  <input
                    id="receiptFile"
                    type="file"
                    accept="image/*,.pdf"
                    class="block w-full mt-1 border border-gray-300 rounded-md shadow-sm"
                    @change="handleFileChange($event)"
                  >
                  <p class="mt-1 text-xs text-gray-500">Upload receipt image or PDF (max 5MB)</p>
                </div>

                <div>
                  <label for="notes" class="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    v-model="notes"
                    rows="3"
                    class="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Additional notes about the payment"
                  ></textarea>
                </div>

                <div v-if="error" class="p-2 text-sm text-red-700 bg-red-100 rounded-md">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            :disabled="isLoading"
            @click="handleSubmit"
            class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Processing...</span>
            <span v-else>Confirm Payment</span>
          </button>
          <button
            type="button"
            :disabled="isLoading"
            @click="onClose"
            class="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
