<script setup>
import { closeModal } from '@customizer/modal-x';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import { ref } from 'vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';
import { checkClaimConfirmedBy } from '../api/claimApi';
import { toasted } from '@/utils/utils';
import { useRouter } from 'vue-router';
import { useApiRequest } from '@/composables/useApiRequest';

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
    error.value = "Comment is required";
    return;
  }

  error.value = '';

  // Case 1: Claim UUID exists → Direct API call
  if (props.data?.claimUuid) {
    apiRequest.send(
      () => checkClaimConfirmedBy(props.data.claimUuid, payload),

      // success callback - check actual success flag
      (res) => {
        console.log('Check Claim API Response:', res);
        
        if (res?.success === true) {
          // REAL SUCCESS
          toasted(true, 'Claim checked successfully');
          
          // Close modal first
          closeModal({ success: true });

          if (typeof props.data?.onSuccess === "function") {
            props.data.onSuccess();
          }
          
          // Navigate back
          router.go(-1);
        } else {
          // API returned success: false (like 400 errors)
          const errorMessage = res?.error || 
                              res?.data?.detail || 
                              res?.data?.message || 
                              "An error occurred while checking the claim";
          
          error.value = errorMessage;
        }
      },

      // error callback - for network errors or thrown exceptions
      (err) => {
        const errorMessage = err?.response?.data?.detail ||
                            err?.response?.data?.message ||
                            err?.message ||
                            "An error occurred while checking the claim";
        
        error.value = errorMessage;
      }
    );
    return;
  }

  // Case 2: Custom onSubmit handler from parent
  if (typeof props.data?.onSubmit === "function") {
    apiRequest.send(
      () => props.data.onSubmit(payload),
      (res) => {
        if (res?.success === true) {
          toasted(true, 'Operation completed successfully');
          closeModal(res);
          router.go(-1);
        } else {
          error.value = res?.error || "Failed to check claim";
          toasted(false, error.value);
          // DO NOT close modal on error
        }
      },
      (err) => {
        error.value = err?.message || "Something went wrong";
        toasted(false, error.value);
        // DO NOT close modal on error
      }
    );
    return;
  }

  // Case 3: Fallback → simply return payload
  closeModal(payload);
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
      :title="props.data?.title || 'Check Claim'"
      subtitle="Provide details to Complete the claim."
      size="sm"
    >
      <Form id="check-claim-form" :inner="true" class="p-0 bg-white" @submit.prevent="submit">
        <div class="flex flex-col gap-4 py-2">

          <div v-if="error" class="p-3 text-sm text-red-700 bg-red-100 rounded">
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
              rows: 3, 
              placeholder: 'Add a comment', 
              required: true,
            }"
            label="Remark"
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
              type="primary"
              :pending="apiRequest.pending.value"
              :disabled="apiRequest.pending.value"
              as="button"
              html-type="submit"
            >
              Submit
            </Button>
          </div>

        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>