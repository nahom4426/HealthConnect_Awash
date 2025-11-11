<script setup lang="ts">
import { closeModal } from '@customizer/modal-x';
import { ref } from 'vue';
import type { PropType } from 'vue';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Form from '@/components/new_form_builder/Form.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';
import { updateServiceProvidedClaimStatus } from '../api/claimApi';
import { toasted } from '@/utils/utils';

const props = defineProps({
  data: {
    type: Object as PropType<{ 
      title?: string; 
      claimUuid?: string;
      selectedUuids?: string[];
      onSuccess?: () => void;
      onSubmit?: (payload: any) => Promise<any>;
    }>,
    default: () => ({})
  }
});

const remark = ref('');
const pending = ref(false);
const error = ref('');

async function submit(action: 'PROCESSED' | 'REJECTED') {
  const body = props.data?.selectedUuids || [];
  
  if (!body.length) {
    error.value = 'No items selected';
    return;
  }

  if (!props.data?.claimUuid) {
    error.value = 'Claim UUID is required';
    return;
  }

  const comment = remark.value?.trim() || undefined;

  try {
    pending.value = true;
    error.value = '';
    
    const res = await updateServiceProvidedClaimStatus(
      props.data.claimUuid,
      action,
      body,
      comment
    );
    
    if (res && res?.status && res.status >= 200 && res.status < 300) {
      const actionText = action === 'PROCESSED' ? 'PROCESSED' : 'REJECTED';
      toasted(true, `Selected services marked ${actionText}`);
      closeModal({ success: true, action, selectedUuids: body });
      
      // Call onSuccess callback if provided
      if (typeof props.data?.onSuccess === 'function') {
        props.data.onSuccess();
      }
    } else {
      error.value = (res as any)?.data?.message || 'Failed to process selected claims';
    }
  } catch (e: any) {
    console.error('Error processing selected claims:', e);
    error.value = e?.response?.data?.message || e?.message || 'Something went wrong';
  } finally {
    pending.value = false;
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
      <Form id="process-claim-form" :inner="false" class="p-0 bg-white">
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

          <div class="flex gap-3 justify-end items-center pt-2 border-t">
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
