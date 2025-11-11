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
const pending = ref(false);
const error = ref('');

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

  try {
    pending.value = true;
    error.value = '';
    
    const res = await approveClaimProcessedBy(claimUuid.value, body);
    
    if (res && res.status >= 200 && res.status < 300) {
      toasted(true, 'Claim processed successfully');
      closeModal({ success: true });
      
      // Call onSuccess callback if provided
      if (typeof props.data?.onSuccess === 'function') {
        props.data.onSuccess();
      }
      
      // Navigate to process_claims page
      router.push('/process_claims');
    } else {
      error.value = res?.data?.message || 'Failed to process claim';
    }
  } catch (e) {
    console.error('Error processing claim:', e);
    error.value = e?.response?.data?.message || e?.message || 'Something went wrong while processing the claim';
  } finally {
    pending.value = false;
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
      :title="props.data?.title || 'Process Claim'"
      subtitle="Provide details to process the claim."
      size="sm"
    >
      <Form id="process-claim-form" :inner="false" class="p-0 bg-white" @submit.prevent="submit">
        <div class="flex flex-col gap-4 py-2">
          <div v-if="error" class="p-3 text-sm text-red-700 bg-red-100 rounded">
            {{ error }}
          </div>

          <Input
            v-model="batchCode"
            name="batchCode"
            :attributes="{ type: 'text', placeholder: 'Enter batch code' , hidden }"
          
          />

          <Textarea
            v-model="comment"
            name="comment"
            validation="required"
            :attributes="{ rows: 3, placeholder: 'Add a comment', required: true }"
            label="Remark"
          />

          <div class="flex gap-3 justify-end items-center pt-2 border-t">
            <Button type="link" :disabled="pending" @click="() => !pending && closeModal(undefined)">Cancel</Button>
            <Button type="primary" :loading="pending" :disabled="pending" as="button" html-type="submit">Submit</Button>
          </div>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
