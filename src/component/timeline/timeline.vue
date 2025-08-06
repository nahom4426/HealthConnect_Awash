<script setup>
import { onMounted, ref, toRefs } from 'vue';
import api from '@/scripts/api';
import { useClaimStore } from '@stores/claimStore';
import { Icon } from '@iconify/vue';

const loading = ref(false);
const claimLog = ref([]);

const props = defineProps({
  claimUuid: {
    type: String,
    default: '',
    required: true,
  },
});

const { claimUuid } = toRefs(props);

onMounted(async () => {
  await fetchClaimLog(claimUuid.value);
});

const fetchClaimLog = async (claimUuid) => {
  loading.value = true;
  await api.get(`/claim/logs?claimUuid=${claimUuid}`,).then((data) => {
    console.log('log for the claim is ', data);
    claimLog.value = data;
    loading.value = false;
  });
};
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center">
    <Icon icon="svg-spinners:clock" class="text-6xl text-primary" />
  </div>
  <!-- no log -->
  <div v-if="claimLog && claimLog.length === 0" class="flex items-center justify-center h-full text-sm text-primary/50">
    no claim history
  </div>

  <div v-if="!loading">
    <ol v-for="(log, i) in claimLog" :key="i" class="relative border-s border-gray-200 dark:border-gray-700">
      <li class="mb-10 ms-6">
        <span
          class="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
          <div class="w-3 h-3 bg-primary rounded-full"></div>
        </span>
        <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600">
          <div class="items-center justify-between mb-3 sm:flex">
            <time class="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">{{ log.actionDate }}</time>

            <div class="text-sm font-normal text-gray-500 lex dark:text-gray-300">
              <span class="font-bold">
                {{ log?.title }}
                {{
    log?.firstName +
    ' ' +
    log?.fatherName +
    ' ' +
    log?.grandFatherName
  }}
              </span>

              change status

              <span v-if="log.previousStatus" class="text-green-500 font-bold">from</span>

              <span v-if="log.previousStatus" class="font-bold">{{
    log.previousStatus
                }}</span>
              to
              <span class="font-bold">{{ log.status }}</span>
            </div>
          </div>
          <!-- comment -->
          <div
            class="p-3 text-xs italic font-normal text-gray-500 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300">
            {{ log.comment }}
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
