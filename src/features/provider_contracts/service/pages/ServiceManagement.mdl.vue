<!-- Modal component -->
<script setup>
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { useRoute } from "vue-router";
import ServiceForm from "../components/form/ServiceForm.vue";
import { useServiceListStore } from "../store/serviceListStore";
import ModalParent from "@/components/ModalParent.vue";
import { ref, watchEffect } from "vue";
import { getServiceByid, updateService } from "../api/serviceApi.js";
import { closeModal } from "@customizer/modal-x";

const props = defineProps({
  data: Object,
});
console.log(props.data)

const route = useRoute();
const { submit } = useForm("serviceForm");
const serviceStore = useServiceListStore();
const req = useApiRequest();

const service = ref(
  serviceStore.serviceList.find((el) => el.serviceUuid == props.data) || {}
);

// Fetch service if not in store
watchEffect(() => {
  if (!Object.keys(service.value).length) {
    req.send(
      () => getServiceByid(props.data),
      (res) => {
        if (res.success) {
          service.value = res.data;
        }
      }
    );
  }
});

function updateServiceHandler({ values }) {
  // Prepare payload with only the price and required identifiers
  const payload = {
  itemCode: service.value.itemCode || '',
  item: service.value.item || '',
  subCategory: service.value.subCategory || '',
  category: service.value.category || '',
  price: values.price || 0,
  payerProviderContractUuid: service.value.payerProviderContractUuid || route.params.id  || '',
  status: service.value.status || 'ACTIVE',
  description: service.value.description || '',
  itemID: service.value.serviceId || '',
};


  req.send(
    () => updateService(service.value.eligibleServiceUuid, payload),
    (res) => {
      toasted(res.success, 
        "Service price updated successfully", 
        res.error || "Failed to update service price"
      );
      
      if (res.success) {
        // Update the store with new price
        serviceStore.update(service.value.eligibleServiceUuid, { 
          ...service.value, 
          price: values.price 
        });
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
      class="bg-white rounded-xl shadow-xl"
      title="Update Medical Service"
      subtitle="Modify service details as needed"
    >
      <template #header>
        <div class="px-6 pt-6">
          <h2 class="text-2xl font-bold text-gray-800">Update Service</h2>
          <p class="text-sm text-gray-500 mt-1">
            Review and modify the service information
          </p>
        </div>
      </template>

      <div class="px-6 py-4">
        <ServiceForm :services="service" />
      </div>

      <template #bottom>
        <div class="flex justify-end gap-4 p-6 bg-gray-50 rounded-b-xl">
          <Button
            type="secondary"
            class="px-6 py-2 border border-gray-300 rounded-lg"
            :disabled="req.pending.value"
          >
            Cancel
          </Button>
          
          <Button
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            :pending="req.pending.value"
            @click.prevent="submit(updateServiceHandler)"
          >
            <template v-if="!req.pending.value">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Update Service
            </template>
            <span v-else>Updating...</span>
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
/* Custom modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>