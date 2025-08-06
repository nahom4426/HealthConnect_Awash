<script setup>
import { ref } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';

import {
  mdiListStatus,
  mdiFolderEye,
  mdiFountainPen,
  mdiCheckDecagram,
  mdiCashSync,
} from '@mdi/js';
const emit = defineEmits([
  'all-claims',
  'reviewed-claims',
  'audited-claims',
  'approved-claims',
  'paid-claims',
]);

const loading = ref(false);
const statuses = ref({
  All: [
    {
      name: 'All',
      Icon: mdiListStatus,
      emitVal: 'all-claims',
    },
  ],
  Reviewed: [
    {
      name: 'Reviewed',
      Icon: mdiFolderEye,
      emitVal: 'reviewed-claims',
    },
  ],
  Audited: [
    {
      name: 'Audited',
      Icon: mdiFountainPen,
      emitVal: 'audited-claims',
    },
  ],
  Approved: [
    {
      name: 'Approved',
      Icon: mdiCheckDecagram,
      emitVal: 'approved-claims',
    },
  ],
  Paid: [
    {
      name: 'Paid',
      Icon: mdiCashSync,
      emitVal: 'paid-claims',
    },
  ],
});
</script>

<template>
  <div class="w-full px-2 py-16 sm:px-0">
    <TabGroup>
      <TabList class="flex space-x-4 rounded-xl bg-blue-900/20 w-fit p-1">
        <Tab
          v-for="status in Object.keys(statuses)"
          as="template"
          :key="status"
          v-slot="{ selected }"
        >
          <button
            @click="emit(statuses[status][0].emitVal)"
            :class="[
              ' rounded-lg py-2.5 text-xl font-medium leading-5 text-blue-700  flex px-4 justify-center items-center gap-2',
              'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
              selected
                ? 'bg-white shadow'
                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
            ]"
          >
            <svg
              viewBox="0 0 24 24"
              :width="18"
              :height="18"
              class="inline-block"
            >
              <path fill="currentColor" :d="statuses[status][0].Icon" />
            </svg>
            {{ status }}
          </button>
        </Tab>
      </TabList>

      <TabPanels class="mt-2">
        <TabPanel
          v-for="(posts, idx) in Object.values(statuses)"
          :key="idx"
          :class="[
            'rounded-xl bg-white p-3',
            'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none',
          ]"
        >
          <slot />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>
