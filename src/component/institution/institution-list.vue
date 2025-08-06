<script setup>
import {
  mdiMenu, mdiChevronDoubleLeft, mdiChevronDoubleRight
} from "@mdi/js";
import SvgIcon from "@jamescoyle/vue-icon";
import { ref, onMounted, onBeforeUnmount } from "vue";
import editInstitution from "../forms/editinstitution.vue";
import Modal from "@/components/modal.vue";
import deleteInstitution from "@/components/actions/deleteInstitution.vue";
import { useToast } from "vue-toastification";
import BaseButton from '@/components/base/BaseButton.vue';
import api from "@/scripts/api";

const toast = useToast();
const emit = defineEmits(["delete", "save"]);

const totalPages = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(25);
const pageSizes = ref([25, 50, 75, 100, 125, 150]);
const isOpen = ref(false);
const deleteInstitutionModalOpen = ref(false);
const deleteLoading = ref(false);
const dropdownIndex = ref({});
const institutionId = ref([]);

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

const openModal = async (modalId) => {
  isOpen.value = true;

  institutionId.value = modalId.institutionUuid;
};

const deleteService = async (servicegroup) => {
  deleteInstitutionModalOpen.value = true;
  institutionId.value = servicegroup.institutionUuid;
};

const HandleInstitutionDelete = async () => {
  deleteLoading.value = false;
  const id = institutionId.value;
  try {
    await api.delete(`/institution/${id}`).then((data) => {
      deleteLoading.value = false;
      deleteInstitutionModalOpen.value = false;
      emit("save");
      toast.success(data.message);
    });
  } catch (error) {
    deleteLoading.value = false;
    toast.error(error.message);
  }
};

defineProps({
  institutions: {
    type: Array,
    default: () => [],
  },
});
</script>
<template>
  <Modal :open="isOpen" @close="handleModalClose('Create')" title="Edit Institution ">
    <editInstitution :institutionId="institutionId" @save="handleModalClose('Create')"></editInstitution>
  </Modal>

  <Modal :open="deleteInstitutionModalOpen" @close="handleModalClose('delete')" title=" Delete Institution Group ">
    <deleteInstitution @confirmed="HandleInstitutionDelete" @canceled="handleModalClose('delete')"
      :loading="deleteLoading"></deleteInstitution>
  </Modal>

  <div class="flow-root">
    <div class="">
      <div class="inline-block min-w-full py-2 align-middle">
        <div class="shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50 border-t-2 border-solid border-black">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                  #
                </th>
                <th scope="col" class="py-3.5 pl-2 pr-1 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                  Institution Name
                </th>

                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:block">
                  Address
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Phone Number
                </th>

                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="(institution, item) in institutions" :key="institution.email" class="even:bg-gray-100">
                <td class="whitespace-nowrap text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                  {{ item + 1 }}
                </td>
                <td class="whitespace-wrap pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                  {{ institution.institutionName }}
                </td>

                <td class="whitespace-wrap px-3 text-sm text-gray-500 hidden lg:block">
                  {{ institution.address1 }}, {{ institution.address2 }},
                  {{ institution.address3 }}
                </td>
                <td class="whitespace-wrap px-3 text-sm text-gray-500">
                  {{ institution.telephone }}
                </td>

                <td class="whitespace-wrap px-3 text-sm text-gray-500">
                  <span v-if="institution.status === 'ACTIVE'"
                    class="inline-flex items-center rounded-md bg-green-200 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {{ institution.status }}
                  </span>
                  <span v-if="institution.status === 'SUSPENDED'"
                    class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                    {{ institution.status }}
                  </span>
                </td>
                <td
                  class="relative whitespace-wrap pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8 flex items-center justify-center">
                  <div class="relative inline-block text-left">
                    <button type="button" @click="displayMenu(item)"
                      class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                      id="options-menu" aria-haspopup="true" aria-expanded="true">
                      <svg-icon type="mdi" :path="mdiMenu"></svg-icon>
                    </button>

                    <div v-if="dropdownIndex === item"
                      class="cursor-pointer origin-top-right absolute left-0 mt-2 mb-8 w-32 rounded-md shadow-lg bg-gray-200 ring-1 ring-gray ring-opacity-5 z-10">
                      <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <span @click.prevent="openModal(institution)"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem">Edit</span>

                        <span @click.prevent="deleteService(institution)"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem">Delete</span>
                      </div>
                    </div>
                  </div>


                </td>
              </tr>
            </tbody>
          </table>
          <div class="w-full flex justify-end mt-2 p-2" v-if="institutions && institutions.length != 0">
            <div class="flex items-center space-x-2">
              <div class="bg-white">
                <BaseButton :icon="mdiChevronDoubleLeft" label="Previous" title="previous page" color="whiteDark"
                  @click="previousPage" :disabled="currentPage === 1" />
              </div>
              <div>
                <div>
                  Items per page:
                  <select v-model="itemsPerPage" @change="handleItemsPerPageChange">
                    <option v-for="size in pageSizes" :key="size" :value="size">
                      {{ size }}
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <BaseButton :icon="mdiChevronDoubleRight" label="Next" title="next page" color="whiteDark"
                  @click="nextPage" :disabled="currentPage === totalPages" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
