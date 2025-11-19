<script setup>
import { defineProps, ref } from 'vue';
import { closeModal } from '@customizer/modal-x';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import ApiService from '@/service/ApiService';

const api = new ApiService();
const isLoading = ref(false);
const error = ref('');

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      claimUuid: '',
      batchCode: '',
      comment: '',
      claimStatus: 'PAYMENT_REQUESTED'
    })
  }
});

const message = props.data?.message || 'Are you sure you want to request payment for this claim?';
const confirmText = props.data?.confirmText || 'Confirm';
const cancelText = props.data?.cancelText || 'Cancel';

async function confirm() {
  try {
    isLoading.value = true;
    error.value = '';
    
    const payload = {
      comment: props.data.comment || 'Payment requested',
      batchCode: props.data.batchCode || '',
      claimStatus: props.data.claimStatus || 'PAYMENT_REQUESTED'
    };

    // Make the API call
    await api.addAuthenticationHeader().put(
      `/api/payer/claimconnect/claim/approve/changeStatus/${props.data.claimUuid}?claimStatus=PAYMENT_REQUESTED`,
      {
        comment: payload.comment,
        batchCode: payload.batchCode
      }
    );

    // Call the onConfirm callback if provided
    if (typeof props.data?.onConfirm === 'function') {
      await props.data.onConfirm();
    }
    
    closeModal();
  } catch (err) {
    console.error('Error updating claim status:', err);
    error.value = 'Failed to update claim status. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

function cancel() {
  if (typeof props.data?.onCancel === 'function') {
    props.data.onCancel();
  }
  closeModal();
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      class="w-[28rem]"
      :title="props.data?.title || 'Confirm Payment'"
      subtitle=""
      size="sm"
    >
      <div class="bg-white p-0">
        <div class="py-6">
          <p class="text-gray-700 text-center">
            {{ message }}
          </p>
          
          <!-- Error message -->
          <p v-if="error" class="mt-4 text-red-500 text-sm text-center">
            {{ error }}
          </p>
        </div>
        
        <div class="flex justify-center gap-4 pb-6">
          <Button
            type="secondary"
            @click="cancel"
            class="px-6 py-2"
            :disabled="isLoading"
          >
            {{ cancelText }}
          </Button>
          <Button
            type="primary"
            @click="confirm"
            class="px-6 py-2"
            :loading="isLoading"
            :disabled="isLoading"
          >
            {{ confirmText }}
          </Button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
