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

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const batchCode = ref(props.data?.batchCode || '2025');
const comment = ref('');
const pending = ref(false);
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

  // If claimUuid is provided, make the API call directly
  if (props.data?.claimUuid) {
    try {
      pending.value = true;
      error.value = '';
      
      const body = { comment: payload.comment, batchCode: payload.batchCode };
      
      apiRequest.send(
        () => rejectClaim(props.data.claimUuid, body),
        (res) => {
          if (res && res.status >= 200 && res.status < 300) {
            // Call onSuccess callback if provided
            if (typeof props.data?.onSuccess === 'function') {
              props.data.onSuccess();
            }
            closeModal(res);
          } else {
            error.value = res?.message || 'Failed to reject claim';
            pending.value = false;
          }
        },
        (err) => {
          error.value = err?.message || 'An error occurred while rejecting the claim';
          pending.value = false;
        }
      );
    } catch (e) {
      error.value = e?.message || 'Something went wrong while processing the claim';
      pending.value = false;
    }
  } else {
    // Fallback: return payload to caller
    closeModal(payload);
  }
}

function onBatchCodeUpdate(v) {
  batchCode.value = v;
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      class="w-[28rem]"
      :title="props.data?.title || 'Reject Claim'"
      subtitle="Provide a reason for rejecting this claim."
      size="sm"
    >
      <Form id="reject-claim-form" :inner="false" class="bg-white p-0" @submit.prevent="submit">
        <div class="flex flex-col gap-4 py-2">
          <div v-if="error" class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            {{ error }}
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
            :attributes="{ rows: 4, placeholder: 'Enter reason for rejection...', required: true }"
            label="Rejection Reason"
          />

          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <Button type="link" :disabled="pending" @click="() => !pending && closeModal(undefined)">Cancel</Button>
            <Button type="danger" :pending="pending" :disabled="pending" as="button" html-type="submit">
              Reject Claim
            </Button>
          </div>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
