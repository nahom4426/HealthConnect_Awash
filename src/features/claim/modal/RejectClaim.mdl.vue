<script setup>
import { closeModal } from '@customizer/modal-x';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import { ref } from 'vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';
import { rejectClaim } from '../api/claimApi';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const batchCode = ref(props.data?.batchCode || '2025');
const comment = ref('');
const error = ref('');
const apiRequest = useApiRequest();

async function submit() {
  const payload = {
    comment: comment.value?.trim() || '',
    batchCode: batchCode.value?.trim() || ''
  };
  
  if (!payload.comment) {
    error.value = 'Comment is required';
    return;
  }

  error.value = '';

  // If claimUuid is provided, make the API call directly
  if (props.data?.claimUuid) {
    const body = { comment: payload.comment, batchCode: payload.batchCode };
    
    apiRequest.send(
      () => rejectClaim(props.data.claimUuid, body),
      
      // success callback - check actual success flag
      (res) => {
        console.log('Reject Claim API Response:', res);
        
        if (res?.success === true) {
          // REAL SUCCESS
          toasted(true, 'Claim rejected successfully');
          
          // Close modal first
          closeModal({ success: true });

          // Call onSuccess callback if provided
          if (typeof props.data?.onSuccess === 'function') {
            props.data.onSuccess();
          }
          
          // Navigate back
          router.go(-1);
        } else {
          // API returned success: false (like 400 errors)
          const errorMessage = res?.error || 
                              res?.data?.detail || 
                              res?.data?.message || 
                              'Failed to reject claim';
          
          error.value = errorMessage;
          // DO NOT close modal on error
        }
      },
      
      // error callback - for network errors or thrown exceptions
      (err) => {
        const errorMessage = err?.response?.data?.detail ||
                            err?.response?.data?.message ||
                            err?.message ||
                            'An error occurred while rejecting the claim';
        
        error.value = errorMessage;
      }
    );
  } else {
    // Fallback: return payload to caller
    closeModal(payload);
  }
}

function onBatchCodeUpdate(v) {
  batchCode.value = v;
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
      class="w-[28rem]"
      :title="props.data?.title || 'Reject Claim'"
      subtitle="Provide a reason for rejecting this claim."
      size="sm"
    >
      <Form id="reject-claim-form" :inner="true" class="p-0 bg-white" @submit.prevent="submit">
        <div class="flex flex-col gap-4 py-2">
          <div v-if="error" class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            <div class="font-medium">Error:</div>
            <div>{{ error }}</div>
          </div>

            <Input
            v-model="batchCode"
            name="batchCode"
            :attributes="{ type: 'text', placeholder: 'Enter batch code', hidden }"
          />


          <Textarea
            v-model="comment"
            name="comment"
            validation="required"
            :attributes="{ 
              rows: 4, 
              placeholder: 'Enter reason for rejection...', 
              required: true,
            }"
            label="Rejection Reason"
          />

          <div class="flex gap-3 justify-end items-center pt-2 border-t">
            <Button 
              type="link" 
              :disabled="apiRequest.pending.value" 
              @click="handleManualClose"
            >
              Cancel
            </Button>
            <Button 
              type="danger" 
              :pending="apiRequest.pending.value" 
              :disabled="apiRequest.pending.value" 
              as="button" 
              html-type="submit"
            >
              Reject Claim
            </Button>
          </div>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>