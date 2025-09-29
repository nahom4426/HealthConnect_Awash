<script setup lang="ts">
import { closeModal } from '@customizer/modal-x';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import { ref } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
  data: {
    type: Object as PropType<{ title?: string; batchCode?: string }>,
    default: () => ({})
  }
});

const batchCode = ref<string>(props.data?.batchCode || '');
const comment = ref<string>('');

function submit() {
  const payload = { comment: comment.value?.trim() || '', batchCode: batchCode.value?.trim() || '' };
  // require both fields
  if (!payload.batchCode) return;
  if (!payload.comment) return;
  closeModal(payload);
}
</script>

<template>
  <ModalParent>
    <NewFormParent class="w-[28rem]" :title="props.data?.title || 'Process Claim'" size="sm">
      <div class="flex flex-col gap-4 py-2">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Batch Code<span class="text-red-500">*</span></label>
          <input
            v-model="batchCode"
            type="text"
            class="w-full p-2 border rounded text-sm"
            placeholder="Enter batch code"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1">Comment<span class="text-red-500">*</span></label>
          <textarea
            v-model="comment"
            rows="3"
            class="w-full p-2 border rounded text-sm"
            placeholder="Add a comment"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t">
          <Button type="link" @click="() => closeModal(undefined)">Cancel</Button>
          <Button type="primary" @click="submit">Submit</Button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
