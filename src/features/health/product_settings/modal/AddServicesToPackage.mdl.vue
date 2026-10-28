<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import ServiceListDataProvider from "@/features/provider_contracts/service/components/ServiceListDataProvider.vue";
import { ref } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { addEligibleServices } from "../api/coverageApi";
import { closeModal } from "@customizer/modal-x";
import { useToast } from "@/toast/store/toast";

const props = defineProps({
  packageUuid: {
    type: String,
    required: true
  },
  packageName: {
    type: String,
    default: 'This Package',
    required: true
  }
});

const { addToast } = useToast();
const api = useApiRequest();
const selectedServices = ref([]);

function handleSave() {
  if (selectedServices.value.length === 0) {
    addToast('Please select at least one service', '', 'warning');
    return;
  }

  api.send(
    () => addEligibleServices(props.packageUuid, selectedServices.value),
    (response) => {
      if (response.success) {
        addToast('Services added successfully', '', 'success');
        closeModal();
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      :title="`Add Services to ${packageName}`"
      subtitle="Select services to add to this package"
    >
      <div class="flex flex-col gap-6">
        <!-- Content Area -->
        <div class="bg-gray-50 p-6 rounded-lg min-h-[400px]">
          <ServiceListDataProvider v-slot="{ services, pending }">
            <div v-if="pending" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <div v-else class="space-y-2">
              <div 
                v-for="service in services" 
                :key="service.serviceUuid"
                class="flex items-center p-3 bg-white rounded border hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  :value="service.serviceUuid"
                  v-model="selectedServices"
                  class="mr-3 h-4 w-4 text-primary"
                />
                <div class="flex-1">
                  <h4 class="font-medium">{{ service.serviceName }}</h4>
                  <p class="text-sm text-gray-600">{{ service.serviceDescription }}</p>
                </div>
              </div>
            </div>
          </ServiceListDataProvider>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <button
            @click="closeModal"
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="api.pending.value"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {{ api.pending.value ? 'Saving...' : 'Save Services' }}
          </button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
