<script setup>
import { closeModal } from '@customizer/modal-x';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import { ref } from 'vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';
import { approveClaimProcessedBy } from '../api/claimApi';
import { toasted } from '@/utils/utils';
import { useRouter } from 'vue-router';
import { useApiRequest } from "@/composables/useApiRequest";

const router = useRouter();

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const batchCode = ref(props.data?.batchCode || '2025');
const claimUuid = ref(props.data?.claimUuid || '');
const comment = ref('');
const error = ref('');

// Use the composable
const req = useApiRequest();

async function submit() {
  const commentValue = comment.value?.trim();
  if (!commentValue) {
    error.value = 'Comment is required';
    return;
  }

  const body = {
    comment: commentValue,
    batchCode: batchCode.value?.trim() || ''
  };

  error.value = '';

  req.send(
    () => approveClaimProcessedBy(claimUuid.value, body),

    // success callback - but check actual success flag
    (res) => {
      if (res?.success === true) {
        toasted(true, 'Claim processed successfully');
        closeModal({ success: true });

        if (typeof props.data?.onSuccess === 'function') {
          props.data.onSuccess();
        }
        router.go(-1);
      } else {
        const errorMessage = res?.error || 
                            res?.data?.detail || 
                            res?.data?.message || 
                            'Something went wrong while processing the claim';
        
        error.value = errorMessage;
        
      }
    },

    // error callback - for network errors or thrown exceptions
    (err) => {
      error.value =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong while processing the claim';
      
      // DO NOT close modal here
    }
  );
}

function onBatchCodeUpdate(v) {
  batchCode.value = v;
}

function handleManualClose() {
  if (!req.pending.value) {
    closeModal();
  }
}
</script>

<template>
  <ModalParent @close="handleManualClose">
    <NewFormParent
      class="w-[28rem]"
      :title="props.data?.title || 'Process Claim'"
      subtitle="Provide details to process the claim."
      size="sm"
    >
      <Form id="process-claim-form" :inner="true" class="p-0 bg-white" @submit.prevent="submit">
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
              :disabled="req.pending.value" 
              @click="handleManualClose"
            >
              Cancel
            </Button>

            <Button
              type="primary"
              :pending="req.pending.value"
              :disabled="req.pending.value"
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