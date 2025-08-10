<script setup>
import Table from "@/components/Table.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { computed, ref } from "vue";
import InsuredPersonsDataProvider from "../components/InsuredPersonsDataProvider.vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { addMembersToGroup } from "../api/groupServiceApi";
import { useRoute } from "vue-router";
import { toasted } from "@/utils/utils";
const api = useApiRequest();

const props = defineProps({
  data: String,
});
console.log("props.data", props.data);

const auth = useAuthStore();
const institutionId = ref(auth.auth?.user?.payerUuid || "");

const search = ref("");

const isSelected = ref(false);
const selected = ref([]);
function handleSelectAll(checked, data = []) {
  if (checked) {
    selected.value = [];
    data.forEach((el) => {
      if (el?.insuredUuid) {
        selected.value.push(el.insuredUuid);
      }
    });
    // selected.value.push(...data.map((el) => el?.insuredUuid).filter(Boolean));

    isSelected.value = true;
  } else {
    isSelected.value = false;
    selected.value = [];
  }
}
function selectService(id, data = []) {
  const idx = selected.value.findIndex((el) => el == id);
  if (idx > -1) {
    selected.value = selected.value.filter((el) => el != id);
    isSelected.value = false;
  } else {
    selected.value.push(id);
    if (selected.value.length === data.length) {
      isSelected.value = true;
    }
  }
}
function handleAddMembersToGroup() {
  if (selected.value.length === 0) {
    toasted(false, "", "Please Select Member");
    return;
  }
  api.send(
    () =>
      addMembersToGroup(props.data.allowedUuid, {
        insuredUuids: selected.value,
        insured: true,
      }),
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
  <ModalParent>
    <NewFormParent
      class=""
      size="lg"
      title="Add Members To Group"
      subtitle="Insured Mmembers"
    >
      <InsuredPersonsDataProvider
        :institutionId="institutionId"
        :search="search"
        v-slot="{ insuredMembers, pending }"
      >
        <div class="flex flex-col gap-4 bg-white p-3">
          <div class="flex w-full justify-between items-center">
            <h1 class="text-base-clr">
              Selected Members ({{ selected.length }})
            </h1>
            <input
              v-model="search"
              placeholder="Search and Select Services"
              class="p-4 w-[36rem] bg-gray-100 rounded-md"
              type="text"
            />
          </div>
          <Table
            :firstCol="true"
            :pending="pending"
            :rows="insuredMembers"
            :headers="{
              head: [
                'Full Name',
                'ID Number',
                'Phone',
                'Position',
                'Status',
                
              ],
              row: ['fullName', 'idNumber', 'phone', 'position', 'status'],
            }"
            :cells="{
              fullName: (_, row) => {
                return row?.firstName + ' ' + row?.fatherName;
              },
            }"
          >
            <template #headerFirst="{ row }">
              <Button>
                <input
                  :checked="isSelected"
                  @change="
                    handleSelectAll($event.target.checked, insuredMembers)
                  "
                  class="size-4"
                  type="checkbox"
                />
              </Button>
            </template>
            <template #select="{ row }">
              <Button>
                <input
                  type="checkbox"
                  :checked="selected.includes(row?.insuredUuid)"
                  @change="selectService(row?.insuredUuid, insuredMembers)"
                  class="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </Button>
            </template>
          </Table>

          <div class="flex justify-end gap-4">
            <Button
              @click.prevent="closeModal()"
              class="border border-base-clr"
            >
              Cancel
            </Button>

            <Button
              :pending="api.pending.value"
              size="md"
              class="!text-white"
              type="primary"
              @click.prevent="handleAddMembersToGroup"
            >
              Create Group
            </Button>
          </div>
        </div>
      </InsuredPersonsDataProvider>
    </NewFormParent>
  </ModalParent>
</template>
