<script setup>
import { closeModal } from '@customizer/modal-x';
import { ref } from 'vue';
import Button from '@/components/Button.vue';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Form from '@/components/new_form_builder/Form.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';
import { updateServiceProvidedClaimStatus } from '../api/claimApi';
import { toasted } from '@/utils/utils';
import { useApiRequest } from '@/composables/useApiRequest';
import { useClaimByInstitutionBatch } from '../store/claimByInstitutionBatchStore';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const remark = ref('');
const canResubmit = ref(true);
const req = useApiRequest();
const rejectReq = useApiRequest();
const error = ref('');
const store = useClaimByInstitutionBatch(); // Use the store directly
const selectedCount = ref((props.data?.selectedUuids || []).length);

function submit(action) {
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

  // Use appropriate request instance based on action
  const apiRequest = action === 'REJECTED' ? rejectReq : req;

  apiRequest.send(
    () =>
      updateServiceProvidedClaimStatus(
        props.data.claimUuid,
        action,
        body,
        comment,
        action === 'REJECTED' ? canResubmit.value : undefined
      ),
    (res) => {
      if (res && res?.status && res.status >= 200 && res.status < 300) {
        const actionText = action === 'PROCESSED' ? 'PROCESSED' : 'REJECTED';
        toasted(true, `${body.length} service${body.length !== 1 ? 's' : ''} marked ${actionText}`);
        
        // Update store with new status - SAME LOGIC AS INDIVIDUAL COMPONENT
        let updated;
        if (action === 'REJECTED') {
          // Remove rejected items from table
          updated = (store.claims || []).filter((claim) => !body.includes(claim.serviceProvidedUuid));
        } else {
          // Update status for processed items
          updated = (store.claims || []).map((claim) => {
            if (body.includes(claim.serviceProvidedUuid)) {
              return { ...claim, serviceClaimStatus: action };
            }
            return claim;
          });
        }
        
        // Update store using the same pattern
        if (store.set) {
          store.set(updated);
        } else {
          // fallback when set is not available
          store.claims = updated;
        }
        
        closeModal({ success: true, action, selectedUuids: body });
        
        // Call onSuccess callback if provided
        if (typeof props.data?.onSuccess === 'function') {
          props.data.onSuccess();
        }
      } else {
        error.value = (res?.data?.message) || 'Failed to process selected claims';
      }
    },
    (err) => {
      error.value = err?.message || 'An error occurred while processing';
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      class="w-[28rem]"
      :title="data?.title || 'Process Multiple Claims'"
      :subtitle="`Processing ${selectedCount} selected item${selectedCount !== 1 ? 's' : ''}. Provide details below.`"
      size="sm"
    >
      <Form id="process-claim-form" :inner="false" class="p-0 bg-white">
        <div class="flex flex-col gap-4 py-2">

          <div v-if="error" class="p-3 text-sm text-red-700 bg-red-100 rounded">
            {{ error }}
          </div>

          <div class="p-3 text-sm text-blue-700 bg-blue-50 rounded">
            <div class="font-medium">Selected Items:</div>
            <div class="mt-1 text-xs text-blue-600">
              {{ selectedCount }} item{{ selectedCount !== 1 ? 's' : '' }} selected
            </div>
            <!-- <div v-if="selectedCount > 0" class="mt-2 font-mono text-xs text-blue-500 break-all">
              First UUID: {{ data?.selectedUuids[0]?.substring(0, 8) }}...
            </div> -->
          </div>

          <Textarea
            v-model="remark"
            name="remark"
            :attributes="{ rows: 4, placeholder: 'Add a remark (optional)' }"
            label="Remark"
          />

          <div class="p-3 bg-gray-50 rounded border">
            <label class="flex gap-3 items-center text-sm text-gray-700">
              <input v-model="canResubmit" type="checkbox" class="w-4 h-4" />
              <span>Allow resubmission after rejection</span>
            </label>
          </div>

          <div class="flex gap-3 justify-end items-center pt-4 border-t">
            <Button 
              type="danger" 
              @click.prevent="() => submit('REJECTED')" 
              :pending="rejectReq.pending.value" 
              :disabled="req.pending.value"
              size="md"
            >
              Reject All
            </Button>
            <Button 
              type="primary" 
              @click.prevent="() => submit('PROCESSED')" 
              :pending="req.pending.value" 
              :disabled="rejectReq.pending.value"
              size="md"
            >
              Process All
            </Button>
          </div>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>