<script setup>
import { mdiEye, mdiTrashCan, mdiTextBoxEdit } from '@mdi/js';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseButtons from '../base/BaseButtons.vue';
import NoData from '@/assets/img/no-data-here.png';

defineProps({
  insuredPersons: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['delete']);

const handleDelete = (id) => {
  emit('delete', id);
};

// console.log('institutions', institutions);
</script>
<template>
  <!-- TODO: if no institutions -->

  <div class="h-[65vh] flex items-center justify-center" v-if="!insuredPersons.length">
    <img :src="NoData" alt="" height="4000" />
  </div>

  <div class="px-4 sm:px-6 lg:px-8" v-if="insuredPersons.length">
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle">
          <table class="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xl font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                  Name
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-xl font-semibold text-gray-900">
                  TIN
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-xl font-semibold text-gray-900">
                  Address
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-xl font-semibold text-gray-900">
                  Email
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-xl font-semibold text-gray-900">
                  Phone
                </th>

                <th scope="col" class="px-3 py-3.5 text-left text-xl font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8">
                  Actions
                </th>
              </tr>
            </thead>
            <!-- TODO: if no institutions -->

            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="institution in institutions" :key="institution.email">
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-xl font-medium text-gray-900 sm:pl-6 lg:pl-8">
                  {{ institution.institutionName }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-xl text-gray-500">
                  {{ institution.tinNumber }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-xl text-gray-500">
                  {{ institution?.address1 + ' , ' + institution?.address2 }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-xl text-gray-500">
                  {{ institution.email }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-xl text-gray-500">
                  {{ institution.telephone }}
                </td>

                <td class="whitespace-nowrap px-3 py-4 text-xl text-gray-500">
                  <span v-if="institution.status === 'Active' ||
                    institution.status === 'active'
                    "
                    class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {{ institution.status }}
                  </span>
                  <span v-if="institution.status === 'closed'"
                    class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                    {{ institution.status }}
                  </span>
                </td>
                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-xl font-medium sm:pr-6 lg:pr-8 flex items-center justify-center">
                  <BaseButtons type="justify-start lg:justify-end " no-wrap>
                    <BaseButton color="info" :icon="mdiTextBoxEdit" small @click="isModalActive = true" />
                    <BaseButton color="danger" :icon="mdiTrashCan" small
                      @click="handleDelete(institution.institutionUuid)" />
                  </BaseButtons>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
