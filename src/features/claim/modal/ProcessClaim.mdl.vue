<script setup>
import { closeModal } from '@customizer/modal-x';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import { ref } from 'vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';

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

async function submit() {
  const payload = {
    comment: comment.value?.trim() || '',
    batchCode: batchCode.value?.trim() || ''
  };
  if (!payload.comment) return;

  // If an async onSubmit is provided, call it and only close on success
  if (typeof props.data?.onSubmit === 'function') {
    try {
      pending.value = true;
      error.value = '';
      const res = await props.data.onSubmit(payload);
      if (res?.success) {
        closeModal(res);
      } else {
        error.value = res?.error || 'Failed to process claim';
      }
    } catch (e) {
      error.value = e?.message || 'Something went wrong while processing the claim';
    } finally {
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
      :title="props.data?.title || 'Process Claim'"
      subtitle="Provide details to process the claim."
      size="sm"
    >
      <Form id="process-claim-form" :inner="false" class="bg-white p-0" @submit.prevent="submit">
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

          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <Button type="link" :disabled="pending" @click="() => !pending && closeModal(undefined)">Cancel</Button>
            <Button type="primary" :loading="pending" :disabled="pending" as="button" html-type="submit">Submit</Button>
          </div>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
