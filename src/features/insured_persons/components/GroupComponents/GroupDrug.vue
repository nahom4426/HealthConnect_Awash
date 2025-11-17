<script setup>
import Table from "@/components/Table.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { closeModal, openModal } from "@customizer/modal-x";
import { useAuthStore } from "@/stores/auth";
import { toasted } from "@/utils/utils";
 import { useDrugStore } from "@/features/provider_contracts/service/store/drugStore";
// import DrugDataprovider from "@/features/service/components/DrugDataprovider.vue";
import { useSelectedDrugStore } from "../../store/selectedDrugStore";
import { computed, ref } from "vue";
import Button from "@/components/Button.vue";
import { addServiceToGroup } from "../../api/groupServiceApi";
import DrugDataprovider from "@/features/provider_contracts/service/components/DrugDataprovider.vue";
const api = useApiRequest();
const props = defineProps({
  id: String,
  groupId: String,
});

const useSelectedDrug = useSelectedDrugStore();

const isSelected = computed(() => {
  return useSelectedDrug.isAllSelected;
});

function handleSelectAll(checked, data) {
  useSelectedDrug.SelectAll(checked, data);
}
function selectService(id, data = []) {
  const idx = useSelectedDrug.selectedValues.findIndex((el) => el == id);
  if (idx > -1) {
    useSelectedDrug.removeValue(id);
    useSelectedDrug.setAllSelected(false);
  } else {
    useSelectedDrug.addValue(id);
    if (useSelectedDrug.selectedValues.length === data.length) {
      useSelectedDrug.setAllSelected(true);
    }
  }
}
const search = ref("");

function handleAddDrugsToGroup() {
  if (useSelectedDrug.selectedValues.length === 0) {
    toasted(false, "", "Please Select Drugs");
    return;
  }
  console.log(useSelectedDrug.selectedValues);

  api.send(
    () => addServiceToGroup(props.groupId, useSelectedDrug.selectedValues),
    (res) => {
      if (res.success) {
        closeModal();
      }
      toasted(res.success, "Members Added To GroupSuccessfully", res.error);
    }
  );
}
</script>
<template>
  <div>
    <DrugDataprovider
      :id="props.id"
      :search="search"
      :auto="false"
      v-slot="{ pending, drugs }"
    >
      <div class="flex flex-col gap-4 bg-white p-3">
        <div class="flex w-full justify-between items-center">
          <h1 class="text-base-clr">Allowed Drugs</h1>
          <input
            v-model="search"
            placeholder="Search and Select Drugs"
            class="p-4 w-[36rem] bg-gray-100 rounded-md"
            type="text"
          />
        </div>
        <div class="h-60 overflow-auto scrollbar-hide">
          <Table
            :first-col="true"
            :show-pagination="false"
            :pending="pending"
            :rows="drugs"
            :headers="{
              head: ['Code', 'Drug Name', 'Price (ETB)', 'Status', 'actions'],
              row: ['drugCode', 'drugName', 'price', 'status'],
            }"
          >
            <template #headerFirst="{ row }">
              <Button>
                <input
                  :checked="isSelected"
                  @change="handleSelectAll($event.target.checked, drugs)"
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
                    useSelectedDrug.selectedValues.includes(row?.drugUuid)
                  "
                  @change="selectService(row?.drugUuid, drugs)"
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

          <Button
            :pending="api.pending.value"
            @click.prevent="handleAddDrugsToGroup"
            size="md"
            class="!text-white"
            type="primary"
          >
            Add Drugs
          </Button>
        </div>
      </div>
    </DrugDataprovider>
  </div>
</template>
