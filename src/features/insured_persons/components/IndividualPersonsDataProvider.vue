<script setup lang="ts">
import { searchActiveInsured } from "../api/insuredPersonsApi";
import { usePagination } from "@/composables/usePagination";
import type { PropType } from "vue";
import { Status } from "@/types/interface";
import { insuredMembers } from "../store/insuredPersonsStore";
import { ref, watch, onMounted, computed } from "vue";
import { removeUndefined } from "@/utils/utils";

// Props
const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String as PropType<Status>,
  },
  search: {
    type: String,
    default: "",
  },
});

const insuredStore = insuredMembers();
const currentPage = ref(1);
const itemsPerPage = ref(25);
const totalPages = ref(1);
const totalItems = ref(0);

const pagination = usePagination({
  auto: false,
  cb: async (data: any) => {
    const response = await searchActiveInsured(
      removeUndefined({
        ...data,
        status: props.status,
        search: props.search,
        hasInstitution: false
      })
    );

    const paginated = response?.data || response;

    if (paginated?.content) {
      insuredStore.set(paginated.content);
      currentPage.value = paginated.page ?? 1;
      itemsPerPage.value = paginated.size ?? 25;
      totalPages.value = paginated.totalPages ?? 1;
      totalItems.value = paginated.totalElements ?? paginated.content.length;
    } else {
      insuredStore.set(paginated);
    }

    return paginated;
  },
});

watch(
  () => props.search,
  (newSearch) => {
    pagination.send();
  }
);

onMounted(() => {
  if (props.search) {
    pagination.search.value = props.search;
  }

  if (props.auto) {
    pagination.send();
  }
});

defineExpose({
  refresh: pagination.send,
  currentPage: computed(() => currentPage.value),
  itemsPerPage: computed(() => itemsPerPage.value),
});
</script>

<template>
  <slot
    :insuredMembers="insuredStore.insuredMembers"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :search="pagination.search"
    :currentPage="currentPage"
    :itemsPerPage="itemsPerPage"
    :totalPages="totalPages"
    :totalItems="totalItems"
  />
</template>
