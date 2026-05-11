<template>
  <ModalParent>
    <NewFormParent
      size="md"
      title="🗑️ Remove Provider from Contract"
      subtitle="Are you sure you want to remove this provider mapping?"
    >
      <div class="space-y-4">
        <!-- Warning Message -->
        <div class="flex gap-3 items-start p-4 text-sm text-yellow-800 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 shadow-sm">
          <svg class="flex-shrink-0 mt-0.5 w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <div>
            <p class="font-semibold">Remove {{ props.data?.providerName  }} </p>
            <p class="mt-1">The provider will be removed from this contract mapping.</p>
          </div>
        </div>

        <!-- Contract Details -->
        <div class="p-4 space-y-2 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Provider:</span>
            <span class="font-medium text-gray-900">{{ props.data?.providerName || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Contract:</span>
            <span class="font-medium text-gray-900">{{ props.data?.contractName || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <template #bottom>
        <div class="flex gap-3 justify-end p-4 w-full border-t border-gray-200">
          <Button 
            @click="closeModal" 
            type="secondary"
            size="lg"
            class="border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            :pending="pending" 
            @click.prevent="handleConfirm"
            type="danger"
            size="lg"
            class="text-white bg-red-600 shadow-lg hover:bg-red-700 hover:shadow-xl"
          >
            <svg class="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            Remove Provider
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>

<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { ref } from "vue";
import { deleteMapContract } from "../api/providerApi";
import { toasted } from "@/utils/utils";

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});
console.log(props.data);

const pending = ref(false);

async function handleConfirm() {
  pending.value = true;

  try {
    const res = await deleteMapContract(props.data.mapContractUuid);
    toasted(res.success, "Provider removed successfully", res.error);
    if (res?.success) {
      window.dispatchEvent(new CustomEvent('provider-mapping-changed', { detail: { action: 'remove' } }));
    }
    if (res?.success && props.data?.onConfirm && typeof props.data.onConfirm === "function") {
      props.data.onConfirm(res);
    }
    if (res?.success) {
      closeModal({ success: true });
    }
  } finally {
    pending.value = false;
  }
}

</script>

<style scoped>
/* Custom styles if needed */
</style>
