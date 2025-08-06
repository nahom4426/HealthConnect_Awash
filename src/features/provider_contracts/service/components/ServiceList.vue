<script setup>
import Table from "@/components/Table.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { usePagination } from "@/composables/usePagination";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
import Button from "@/components/Button.vue";
import { useAuthStore } from "@/stores/auth";
import ServiceListDataProvider from "../components/ServiceListDataProvider.vue";
import { removeService } from "../api/serviceApi";
import { useServiceListStore } from "../store/serviceListStore";
import Dropdown from "@/components/Dropdown.vue";
const api = useApiRequest();
const authStore = useAuthStore();
const serviceListStore = useServiceListStore();
const props = defineProps({
  search: String,
});
function remove(id) {
  openModal(
    "Confirmation",
    {
      title: "Remove service",
      message: "Are you sure you want to delete this service?",
    },
    (res) => {
      if (res) {
        api.send(
          () => removeService(id),
          (res) => {
            if (res.success) {
              serviceListStore.remove(id);
            }
            toasted(res.success, "Service Removed Successfully", res.error);
          }
        );
      }
    }
  );
}
</script>
<template>
  <div>
    <ServiceListDataProvider
      :search="props.search"
      v-slot="{ pending, serviceList }"
    >
      <Table
        :pending="pending"
        :rows="serviceList"
        :headers="{
          head: ['Code', 'Service Name', 'Price (ETB)', 'Status', 'actions'],
          row: ['serviceCode', 'serviceName', 'price', 'status'],
        }"
      >
        <template #actions="{ row }">
          <Dropdown v-slot="{ setRef, toggleDropdown }">
            <div
              @click.prevent="toggleDropdown"
              class="flex items-center gap-2 px-5 py-3 rounded-lg cursor-pointer"
            >
              <button>
                <i v-html="icons.threeDots"></i>
              </button>
            </div>
            <div
              class="flex shadow-lg text-base p-2 mt-2 rounded-lg flex-col gap-2 w-60 bg-white"
              :ref="setRef"
            >
              <button
                @click="openModal('ServiceManagement', row?.serviceUuid)"
                class="p-2 flex text-base-clr items-center gap-2 rounded-lg hover:bg-gray-100"
              >
                <i v-html="icons.edits" />
                <span>Edit</span>
              </button>
              <button
                @click="openModal('ServiceManagement', row?.serviceUuid)"
                class="p-2 flex text-base-clr items-center gap-2 rounded-lg hover:bg-gray-100"
              >
                <i v-html="icons.details" />
                <span>Detail</span>
              </button>
              <button
                @click="remove(row?.serviceUuid)"
                class="p-2 flex items-center text-red-500 gap-2 rounded-lg hover:bg-gray-100"
              >
                <i v-html="icons.deactivate" />
                <span>Mark as unavailable</span>
              </button>
            </div>
          </Dropdown>
          <!-- <div class="flex gap-4 items-center">
            <button
              class="size-8 shadow-md rounded-full bg-accent flex justify-center items-center"
              @click="openModal('ServiceManagement', row?.serviceUuid)"
            >
              <i v-html="icons.edit" />
            </button>
            <button @click="remove(row?.serviceUuid)">delete</button>
          </div> -->
        </template>
      </Table>
    </ServiceListDataProvider>
  </div>
</template>
