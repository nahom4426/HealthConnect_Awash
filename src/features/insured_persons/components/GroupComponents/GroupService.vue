<script setup>
import Table from "@/components/Table.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { openModal } from "@customizer/modal-x";
import { useAuthStore } from "@/stores/auth";
import { useServiceListStore } from "@/features/provider_contracts/service/store/serviceListStore";
import ServiceListDataProvider from "@/features/provider_contracts/service/components/ServiceListDataProvider.vue";
import { computed, ref } from "vue";
import { formatCurrency } from "@/utils/utils";
import { useSelectedServicesStore } from "../../store/selectedServicesStore";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
const api = useApiRequest();
const authStore = useAuthStore();
const serviceListStore = useServiceListStore();
const props = defineProps({
  search: String,
  id: String,
  groupId: String,
});

const search = ref("");

const useSelectedServices = useSelectedServicesStore();

const isSelected = computed(() => {
  return useSelectedServices.isAllSelected;
});

function handleSelectAll(checked, data) {
  console.log(data);

  useSelectedServices.SelectAll(checked, data);
}
function selectService(id, data = []) {
  const idx = useSelectedServices.selectedValues.findIndex((el) => el == id);
  if (idx > -1) {
    useSelectedServices.removeValue(id);
    useSelectedServices.setAllSelected(false);
  } else {
    useSelectedServices.addValue(id);
    if (useSelectedServices.selectedValues.length === data.length) {
      useSelectedServices.setAllSelected(true);
    }
  }
}
</script>
<template>
  <div>
    <ServiceListDataProvider
      :id="props.id"
      :search="search"
      :auto="false"
      v-slot="{ pending, serviceList }"
    >
      <div class="flex flex-col gap-4 bg-white p-3">
        <div class="flex w-full justify-between items-center">
          <h1 class="text-base-clr">Allowed Services</h1>
          <input
            v-model="search"
            placeholder="Search and Select Services"
            class="p-4 w-[36rem] bg-gray-100 rounded-md"
            type="text"
          />
        </div>
        <div class="h-60 overflow-auto scrollbar-hide">
          <Table
            :firstCol="true"
            :show-pagination="false"
            :pending="pending"
            :rows="serviceList"
            :headers="{
              head: ['Service ID', 'Provider', 'Services', 'Price'],
              row: ['serviceCode', 'providerName', 'serviceName', 'price'],
            }"
            :cells="{
              price: (price) => {
                return formatCurrency(price);
              },
            }"
          >
            <template #headerFirst="{ row }">
              <Button>
                <input
                  :checked="isSelected"
                  @change="handleSelectAll($event.target.checked, serviceList)"
                  class="size-4"
                  type="checkbox"
                />
              </Button>
            </template>
            <template #select="{ row }">
              <Button>
                <input
                  type="checkbox"
                  :checked="
                    useSelectedServices.selectedValues.includes(
                      row?.serviceUuid
                    )
                  "
                  @change="selectService(row?.serviceUuid, serviceList)"
                  class="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </Button>
            </template>
          </Table>
        </div>
        <div class="flex justify-end gap-4">
          <Button @click.prevent="closeModal()" class="border border-base-clr">
            Cancel
          </Button>

          <Button size="md" class="!text-white" type="primary">
            Add Service
          </Button>
        </div>
      </div>
    </ServiceListDataProvider>
  </div>
</template>
