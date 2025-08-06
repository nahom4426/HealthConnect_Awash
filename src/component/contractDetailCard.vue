<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { ref } from 'vue';
import ContractDetailModal from '@/components/contract/contractDetailModal.vue';
import Modal from '@/components/modal.vue';

import { mdiDotsHorizontal } from '@mdi/js';
import BaseIcon from './base/BaseIcon.vue';

const emit = defineEmits(['contract-detail']);
const openDetailModal = ref(false);
const contractDetail = ref({});

const statuses = {
  Active: 'text-green-700 bg-green-50 ring-green-600/20',
  Expired: 'text-red-600 bg-red-200 ring-red-500/10',
  'In Active': 'text-red-700 bg-red-50 ring-red-600/10',
};

const props = defineProps({
  contracts: {
    type: Array,
    default: () => [],
  },
});

const handleModalState = (modalValue) => {
  const filteredContract = props.contracts.filter((contract) => {
    return contract.payerInstitutionContractUuid === modalValue;
  });
  contractDetail.value = filteredContract[0];
  openDetailModal.value = !openDetailModal.value;
};
</script>

<template>
  <div>
    <!-- modal for contract detail -->
    <Modal
      :open="openDetailModal"
      @close="handleModalState('close')"
      title="Contract Information"
    >
      <ContractDetailModal :contract="contractDetail" />
    </Modal>

    <ul
      role="list"
      class="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8"
    >
      <li
        v-for="contract in contracts"
        :key="contract.payerInstitutionContractUuid"
        @click="handleModalState(contract.payerInstitutionContractUuid)"
        class="overflow-hidden rounded-xl relative border border-gray-200 hover:shadow-lg cursor-pointer"
      >
        <div
          class="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6"
        >
          <div class="text-lg font-medium leading-6 text-gray-900">
            {{ contract.institutionName }}
          </div>
          <Menu as="div" class="relative ml-auto">
            <MenuButton
              class="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500"
            >
              <span class="sr-only">Open options</span>
              <!-- <EllipsisHorizontalIcon class="h-5 w-5" aria-hidden="true" /> -->
            </MenuButton>
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <MenuItems
                class="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
              >
                <MenuItem v-slot="{ active }">
                  <a
                    href="#"
                    :class="[
                      active ? 'bg-gray-50' : '',
                      'block px-3 py-1 text-xl leading-6 text-gray-900',
                    ]"
                    >View<span class="sr-only"
                      >, {{ contract.institutionName }}</span
                    ></a
                  >
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a
                    href="#"
                    :class="[
                      active ? 'bg-gray-50' : '',
                      'block px-3 py-1 text-xl leading-6 text-gray-900',
                    ]"
                    >Edit<span class="sr-only"
                      >, {{ contract.institutionName }}</span
                    ></a
                  >
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
        </div>
        <dl class="-my-3 divide-y divide-gray-100 px-6 py-4 text-xl leading-6">
          <div class="flex justify-between gap-x-4 py-3">
            <dt class="text-gray-500">Date</dt>

            <dd class="text-gray-700">
              <div class="">
                <span class="font-semibold">
                  <time :datetime="contract.beginDate">{{
                    contract.beginDate
                  }}</time>
                </span>
                <span> - </span>
                <span class="font-semibold">
                  <time :datetime="contract.endDate">{{
                    contract.endDate
                  }}</time>
                </span>
              </div>
            </dd>
          </div>
          <div class="flex justify-between gap-x-4 py-3" v-if="contract.status">
            <dt class="text-gray-500">Status</dt>
            <dd class="flex items-start gap-x-2">
              <div
                :class="[
                  statuses[contract.status],
                  'rounded-md py-1 px-2 text-xs font-medium ring-1 ring-inset',
                ]"
              >
                {{ contract.status }}
              </div>
            </dd>
          </div>
        </dl>
      </li>
    </ul>
  </div>
</template>
