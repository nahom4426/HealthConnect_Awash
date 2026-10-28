<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { deletePackage } from "../api/coverageApi";
import { useCoverage } from "../store/coverageStore";
import { closeModal } from "@customizer/modal-x";
import { useToast } from "@/toast/store/toast";

const props = defineProps({
  packageUuid: {
    type: String,
    required: true
  },
  packageName: {
    type: String,
    required: true
  }
});

const { addToast } = useToast();
const api = useApiRequest();
const coverageStore = useCoverage();

function handleDelete() {
  api.send(
    () => deletePackage(props.packageUuid),
    (response) => {
      if (response.success) {
        coverageStore.removePackage(props.packageUuid);
        addToast('Package deleted successfully', '', 'success');
        closeModal();
      } else {
        addToast('Failed to delete package', response.error || '', 'error');
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="sm"
      title="Delete Package"
      subtitle="Are you sure you want to delete this package?"
    >
      <div class="p-6 text-center">
        <div class="mb-4">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Delete "{{ packageName }}"</h3>
        <p class="text-sm text-gray-500">
          This action cannot be undone. This will permanently delete the package and all associated data.
        </p>
      </div>

      <template #bottom>
        <div class="flex justify-end gap-3 w-full p-4">
          <Button
            @click="closeModal"
            class="flex items-center border border-gray-300 text-gray-700"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            :pending="api.pending.value"
            @click="handleDelete"
            class="flex items-center bg-red-600 hover:bg-red-700 !text-white"
            size="lg"
          >
            {{ api.pending.value ? 'Deleting...' : 'Delete Package' }}
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>