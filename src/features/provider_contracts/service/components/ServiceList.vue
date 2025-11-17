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
import ServiceStatusCell from "../components/ServiceStatusCell.vue";
import ServiceRow from "./ServiceRow.vue";
// import Dropdown from "@/components/Dropdown.vue";
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
          row: ['itemCode', 'item', 'price', 'status'],
        }"
        :rowCom="ServiceRow"
      >
      </Table>
    </ServiceListDataProvider>
  </div>
</template>
