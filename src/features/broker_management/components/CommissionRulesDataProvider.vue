<script setup lang="ts">
import { getRules } from '../api/rulesApi';
import { usePagination } from '@/composables/usePagination';
import { ref, watch, onMounted, computed } from 'vue';
import { removeUndefined } from '@/utils/utils';
import { useRulesStore } from '../stores/rulesStore';

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  stakeholderType: {
    type: String,
    default: '',
  },
  policyType: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'ALL',
  },
  search: {
    type: String,
    default: '',
  },
});

const rulesStore = useRulesStore();
const currentPage = ref(1);
const itemsPerPage = ref(25);
const totalPages = ref(1);
const totalItems = ref(0);
const isFetching = ref(false);

const pagination = usePagination({
  auto: false,
  cb: async (data: any) => {
    isFetching.value = true;
    try {
      const params = removeUndefined({
        page: data.page,
        size: data.limit,
        sortBy: 'createdAt',
        sortDir: 'desc',
        ...(props.stakeholderType ? { stakeholderType: props.stakeholderType } : {}),
        ...(props.policyType ? { policyType: props.policyType } : {}),
        ...(props.status && props.status !== 'ALL' ? { status: props.status } : {}),
        ...(props.search ? { search: props.search } : {}),
      });

      const response = await getRules(params);
      const paginated = response?.data || response;

      if (paginated?.content) {
        rulesStore.rules = paginated.content;
        currentPage.value = paginated.page ?? 1;
        itemsPerPage.value = paginated.size ?? 25;
        totalPages.value = paginated.totalPages ?? 1;
        totalItems.value = paginated.totalElements ?? paginated.content.length;
      } else {
        rulesStore.rules = paginated;
      }

      return paginated;
    } finally {
      isFetching.value = false;
    }
  },
});

// Watch for filter changes
watch(
  () => [props.stakeholderType, props.policyType, props.status, props.search],
  () => {
    if (props.auto) {
      pagination.send();
    }
  },
  { deep: true }
);

// Initial load
onMounted(() => {
  if (props.auto) {
    pagination.send();
  }
});

// Expose methods and data
defineExpose({
  refresh: pagination.send,
  currentPage: computed(() => currentPage.value),
  itemsPerPage: computed(() => itemsPerPage.value),
  totalPages: computed(() => totalPages.value),
  totalItems: computed(() => totalItems.value),
});
</script>

<template>
  <slot
    :rules="rulesStore.rules"
    :pending="pagination.pending.value || isFetching || rulesStore.loading"
    :error="pagination.error.value || rulesStore.error"
    :search="pagination.search"
    :currentPage="currentPage"
    :itemsPerPage="itemsPerPage"
    :totalPages="totalPages"
    :totalItems="totalItems"
    :refresh="pagination.send"
  />
</template>