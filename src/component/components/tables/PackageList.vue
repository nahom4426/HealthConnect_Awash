<script setup>
import {
  mdiChevronDoubleLeft,
  mdiMenu,
  mdiChevronDoubleRight
} from "@mdi/js";
import SvgIcon from "@jamescoyle/vue-icon";
import BaseButton from "@/components/base/BaseButton.vue";
import { ref, onBeforeUnmount, onMounted } from "vue";
import CoverageModal from "../CoverageModal.vue";
import EditPackage from '../forms/EditPackage.vue';
import DeleteConfirmtion from "../forms/DeleteConfirmtion.vue";
import { useRouter } from 'vue-router';
import { usePackageStore } from '@stores/packageStore'
import { useToast } from "vue-toastification";


const packageStore = usePackageStore();
const router = useRouter();
const toast = useToast();
const emit = defineEmits(["delete", "save"]);


const props = defineProps({ packageRanges: { type: Array }, });

const totalPages = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(25);
const pageSizes = ref([25, 50, 75, 100, 125, 150]);
const openDeleteModal = ref(false);
const pUid = ref('')
const open = ref(false);
const item = ref({});

const openModal = (sItem) => {
  open.value = !open.value;
  dropdownIndex.value = null;
  item.value = sItem;
};
onBeforeUnmount(() => {
  window.removeEventListener("click", clickOutside);
});

onMounted(() => {
  window.addEventListener("click", clickOutside);
  console.log('props', props.value)
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

const handleDeleteModal = async (id, ite) => {
  pUid.value = id
  openDeleteModal.value = true
  item.value = ite
};

const deleteModalColse = async () => {
  openDeleteModal.value = false
};


const deletePackage = async () => {
  await packageStore.deletePackage(pUid.value)
  openDeleteModal.value = false
}
</script>

<template>
  <div class="">
    <div>
      <CoverageModal :open="open" @close="open = !open" title="Edit  for Coverage " :name="item">
        <EditPackage :item="item" />
      </CoverageModal>

      <CoverageModal :open="openDeleteModal" @close="deleteModalColse" title="Delete Coverage" :name="item">
        <DeleteConfirmtion :item="item" @confirmed="deletePackage" @canceled="deleteModalColse"></DeleteConfirmtion>
      </CoverageModal>
    </div>
  </div>

  <div class="px-4 sm:px-6 lg:px-8">
    <div class="mt-2 flow-root">
      <div class="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50 border-t-2 border-solid border-black">
              <tr>
                <th scope="col" class="py-3.5 pl-2 pr-1 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                </th>
                <th scope="col" class="py-3.5 pl-2 pr-1 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                  Coverage Name
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Minimum Limit
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Maximum Limit
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Gender
                </th>

                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="(packageRange, item) in packageRanges" :key="packageRange.packageUuid"
                class="even:bg-gray-100">
                <td class="whitespace-nowrap pl-4 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                  {{ item + 1 }}
                </td>
                <td class="whitespace-nowrap pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                  {{ packageRange.packageName }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500">
                  {{ packageRange.packageDescription }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500">
                  {{ packageRange.minLimit.toLocaleString('en-US') }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500">
                  {{ packageRange.maxLimit.toLocaleString('en-US') }}
                </td>
                <td class="whitespace-nowrap px-3 text-sm text-gray-500">
                  {{ packageRange.gender }}
                </td>

                <td
                  class="relative whitespace-nowrap pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8 flex items-center justify-end">
                <td class="mr-4"><a class="bg-indigo-600 text-center "><router-link :to="{
                  name: 'addpackage', params: { id: packageRange.packageUuid },
                  query: { packageName: packageRange.packageName }
                }">
                      <svg class="" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20"
                        viewBox="0 0 48 48">
                        <path fill="#3949AB"
                          d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"></path>
                        <path fill="#fff" d="M21,14h6v20h-6V14z"></path>
                        <path fill="#fff" d="M14,21h20v6H14V21z"></path>
                      </svg>
                    </router-link></a></td>
                <div class="relative inline-block text-left">
                  <button type="button" @click="displayMenu(item)"
                    class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                    id="options-menu" aria-haspopup="true" aria-expanded="true">
                    <svg-icon type="mdi" :path="mdiMenu"></svg-icon>
                  </button>

                  <div v-if="dropdownIndex === item"
                    class="cursor-pointer origin-top-right absolute left-0 mt-2 mb-8 w-32 rounded-md shadow-lg bg-gray-200 ring-1 ring-gary ring-opacity-5 z-10">
                    <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <span @click.prvent="openModal(packageRange)"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        role="menuitem">Edit</span>
                      <span class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"><a
                          class="">
                          <router-link :to="{
                            name: 'packagedetail', params: { id: packageRange.packageUuid },
                            query: { packageName: packageRange.packageName }
                          }">
                            Setting
                          </router-link></a> </span>

                      <span @click.prevent="handleDeleteModal(packageRange.packageUuid, packageRange)"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        role="menuitem">Delete</span>
                    </div>
                  </div>
                </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="w-full flex justify-end mt-2 p-2" v-if="packageRanges && packageRanges.length != 0">
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
