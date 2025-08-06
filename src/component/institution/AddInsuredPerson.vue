<script setup>
import BaseButton from "@/components/base/BaseButton.vue";
import { ref } from "vue";
import EditMember from "@/components/forms/EditMember.vue";
import Modal from "@/components/modal.vue";
import { mdiTextBoxEdit } from "@mdi/js";
import { useRowStore } from "../../../stores/piniaState";

const isOpen = ref(false);
const id = ref("");

const deleteInstitutionModalOpen = ref(false);
const useRow = useRowStore();

const openModal = async (modalId) => {
  isOpen.value = true;
  useRow.setinsuredUuid(modalId);
  if (modalId) {
    console.log(modalId);
  } else {
    console.log("id is undefined");
  }
};
const handleModalClose = async (modalValue) => {
  if (modalValue === "delete") {
    deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
  } else {
    isOpen.value = !isOpen.value;
  }
};

defineProps({
  filteredItems: {
    type: Array,
    default: () => [],
  },
});
const number = 0;

const emit = defineEmits(["delete"]);

const handleDelete = (id) => {
  emit("delete", id);
};

// console.log('institutions', institutions);
</script>
<template>
  <!-- edit institution -->
  <Modal :open="isOpen" @close="handleModalClose('Create')" title="Edit Member ">
    <EditMember @save="handleModalClose"></EditMember>
  </Modal>
  <!-- TODO: if no institutions -->
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle">
          <table class="min-w-full divide-gray-300">
            <thead class="bg-white">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                </th>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                  Full Name
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Effective Date
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Annual Premium
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Telephone
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Remaing Benefit
                </th>

                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-gray-200 bg-white">
              <tr v-for="(filtereditem, item) in filteredItems" :key="filtereditem.email"
                :class="item % 2 === 0 ? 'bg-gray-200' : 'bg-white'">
                <td class="whitespace-nowrap px-10 text-sm text-gray-500 hover:bg-gray-900 rounded-xl">
                  {{ item + 1 }}
                </td>
                <td class="whitespace-nowrap px-6 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">
                  {{ filtereditem.firstName }} {{ filtereditem.fatherName }}
                </td>

                <td class="whitespace-nowrap px-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">
                  {{ filtereditem.beginDate }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">
                  {{ filtereditem.premium }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">
                  {{ filtereditem.phone }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">
                  {{ filtereditem.address1 }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">
                  <span v-if="filtereditem.status === 'Active' ||
                    filtereditem.status === 'active'
                    "
                    class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-gray-100">
                    {{ filtereditem.status }}
                  </span>
                  <span v-if="filtereditem.status === 'closed'"
                    class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-gray-100">
                    {{ filtereditem.status }}
                  </span>
                </td>
                <td
                  class="relative whitespace-nowrap pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8 flex items-center justify-center">
                  <BaseButton @click="openModal(filtereditem)" color="info" :icon="mdiTextBoxEdit" small />

                  <!-- <div class="bg-primary py-1 rounded-lg text-white font-medium text-base">Edit</div> -->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
../../stores/piniaState