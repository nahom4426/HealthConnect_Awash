<script setup>
import { ref } from "vue";
import { useService } from "../store/serviceStore";
import ServiceDataProvider from "./ServiceDataProvider.vue";

const props = defineProps({
  search: String,
});

const serviceStore = useService();

function handleAdd(service) {
  console.log("Adding service:", service);
}
</script>

<template>
  <ServiceDataProvider :search="search">
    <template #default="{ services, pending, error }">
      <div class="flex flex-col gap-2">
        <div v-if="pending" class="text-center py-4">Loading...</div>
        <div v-else-if="error" class="text-center text-error py-4">
          {{ error }}
        </div>
        <template v-else>
          <div
            v-for="service in services"
            :key="service.serviceUuid"
            class="flex justify-between items-center p-3 bg-white rounded shadow"
          >
            <span>{{ service.item }}</span>
            <button
              @click="handleAdd(service)"
              class="bg-primary text-white px-4 py-1 rounded"
            >
              Add
            </button>
          </div>
          <div v-if="services.length === 0" class="text-center py-4">
            No services found
          </div>
        </template>
      </div>
    </template>
  </ServiceDataProvider>
</template>
