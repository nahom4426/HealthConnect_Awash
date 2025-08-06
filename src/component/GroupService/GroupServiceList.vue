<script setup>
import {
  mdiEye,
  mdiTrashCan,
  mdiTextBoxEdit,
  mdiDotsHorizontal,
  mdiMenu,
} from "@mdi/js";
import SvgIcon from "@jamescoyle/vue-icon";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseButtons from "../base/BaseButtons.vue";
import { ref, onBeforeUnmount, onMounted } from "vue";
import EditGroupService from "../forms/EditGroupService.vue";
import Modal from "@/components/modal.vue";
import deleteGroupService from "@/components/actions/deleteGroupService.vue";
import { useToast } from "vue-toastification";
import { makeAuthenticatedRequest } from "@/scripts/api";

const toast = useToast();
const isOpen = ref(false);
const deleteInstitutionModalOpen = ref(false);
const deleteloading = ref(false);
const serviceGroupUuid = ref("");
const emit = defineEmits(["delete", "save"]);

defineProps({
  ServiceGroup: {
    type: Array,
    default: () => [],
  },
});

onBeforeUnmount(() => {
  window.removeEventListener("click", clickOutside);
});

onMounted(() => {
  window.addEventListener("click", clickOutside);
});

const clickOutside = (e) => {
  if (
    e.target.tagName !== "BUTTON" &&
    e.target.tagName !== "svg" &&
    e.target.tagName !== "path"
  ) {
    dropdownIndex.value = null;
  }
};

const dropdownIndex = ref({});
const displayMenu = (index) => {
  dropdownIndex.value = dropdownIndex.value === index ? null : index;
};

const handleModalClose = async (modalValue) => {
  if (modalValue === "delete") {
    deleteInstitutionModalOpen.value = !deleteInstitutionModalOpen.value;
  } else {
    isOpen.value = !isOpen.value;
    emit("save");
  }
};

const openModal = async (ServiceGroup) => {
  isOpen.value = true;
  dropdownIndex.value = null;
  serviceGroupUuid.value = ServiceGroup.serviceGroupUuid;
};

const deleteservice = async (servicegroup) => {
  deleteInstitutionModalOpen.value = true;
  dropdownIndex.value = null;
  serviceGroupUuid.value = servicegroup.serviceGroupUuid;
};

const handleServiceGroupeDelete = async () => {
  deleteloading.value = false;
  const id = serviceGroupUuid.value;
  try {
    await makeAuthenticatedRequest({
      method: "DELETE",
      url: `api/payer/claimconnect/service-group/${id}`,
    }).then((data) => {
      deleteloading.value = false;
      deleteInstitutionModalOpen.value = false;
      emit("save");
      toast.success(data.message);
    });
  } catch (error) {
    deleteloading.value = false;
    toast.error(error);
  }
};
</script>

<template>
  <!-- edit group service -->
  <Modal
    :open="isOpen"
    @close="handleModalClose('Create')"
    title="Edit Service Group "
  >
    <EditGroupService
      :serviceGroupUuid="serviceGroupUuid"
      @save="handleModalClose"
    >
    </EditGroupService>
  </Modal>
  <!-- delete group service -->
  <Modal
    :open="deleteInstitutionModalOpen"
    @close="handleModalClose('delete')"
    title=" Delete Service Group "
  >
    <deleteGroupService
      @confirmed="handleServiceGroupeDelete"
      @canceled="handleModalClose('delete')"
      :loading="deleteLoading"
    ></deleteGroupService>
  </Modal>

  <div class="px-4 sm:px-6 lg:px-8">
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-white">
              <tr>
                <th
                  scope="col"
                  class="py-3.5 pl-2 pr-1 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
                ></th>
                <th
                  scope="col"
                  class="py-3.5 pl-2 pr-1 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
                >
                  Services
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Description
                </th>

                <th
                  scope="col"
                  class="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8"
                ></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="(ServiceGroups, item) in ServiceGroup"
                :key="ServiceGroups.serviceGroupUuid"
                :class="item % 2 === 0 ? 'bg-gray-200 ' : 'bg-white '"
              >
                <td
                  class="whitespace-nowrap pl-4 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8"
                >
                  {{ item + 1 }}
                </td>
                <td
                  class="whitespace-nowrap pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8"
                >
                  {{ ServiceGroups.item }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500">
                  {{ ServiceGroups.description }}
                </td>

                <td
                  class="relative whitespace-nowrap pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8 flex items-center justify-end"
                >
                  <div class="relative inline-block text-left">
                    <button
                      type="button"
                      @click="displayMenu(item)"
                      class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                      id="options-menu"
                      aria-haspopup="true"
                      aria-expanded="true"
                    >
                      <svg-icon type="mdi" :path="mdiMenu"></svg-icon>
                    </button>

                    <div
                      v-if="dropdownIndex === item"
                      class="cursor-pointer origin-top-right absolute left-0 mt-2 mb-8 w-32 rounded-md shadow-lg bg-gray-200 ring-1 ring-gary ring-opacity-5 z-10"
                    >
                      <div
                        class="py-1"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        <span
                          @click.prevent="openModal(ServiceGroups, item)"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                          >Edit</span
                        >
                        <span
                          @click.prevent="deleteservice(ServiceGroups)"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                          >Delete</span
                        >
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
