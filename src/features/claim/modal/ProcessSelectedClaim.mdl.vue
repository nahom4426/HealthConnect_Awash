<script setup lang="ts">
import { closeModal } from '@customizer/modal-x';
import { ref } from 'vue';
import type { PropType } from 'vue';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Form from '@/components/new_form_builder/Form.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';

const props = defineProps({
  data: {
    type: Object as PropType<{ title?: string; onSubmit?: (payload: any) => Promise<any> }>,
    default: () => ({})
  }
});

const remark = ref('');
const pending = ref(false);
const error = ref('');

async function submit(action: 'PROCESSED' | 'REJECTED') {
  const payload = { action, comment: remark.value?.trim() || undefined };

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
    } catch (e: any) {
      error.value = e?.message || 'Something went wrong';
    } finally {
      pending.value = false;
    }
  } else {
    closeModal(payload);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      class="w-[28rem]"
      :title="data?.title || 'Process Claim'"
      subtitle="Provide details to process the claim."
      size="sm"
    >
      <Form id="process-claim-form" :inner="false" class="bg-white p-0">
        <div class="flex flex-col gap-4 py-2">

          <div v-if="error" class="p-3 text-sm text-red-700 bg-red-100 rounded">
            {{ error }}
          </div>

          <Textarea
            v-model="remark"
            name="remark"
            :attributes="{ rows: 3, placeholder: 'Add a remark (optional)' }"
            label="Remark"
          />

          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <Button type="danger" :disabled="pending" @click="() => submit('REJECTED')">
              Reject
            </Button>
            <Button type="primary" :loading="pending" :disabled="pending" @click="() => submit('PROCESSED')">
              Process
            </Button>
          </div>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
