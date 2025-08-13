<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { watch, onMounted, computed, ref } from "vue";
import { removeUndefined } from "@/utils/utils";
import { useFamily } from "../store/FamilyStore";
import { getGroup } from "../api/groupServiceApi";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";

const route = useRoute();
const authStore = useAuthStore();
const familyStore = useFamily();

// Define props with TypeScript types
const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  id: {
    type: String,
    required: true,
  },
  search: {
    type: String,
    default: "",
  },
});

// Local pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);
const totalPages = ref(1);
const totalItems = ref(0);

// Enhanced pagination setup
const pagination = usePagination({
  auto: props.auto,
  cb: async (data: any) => {
    const response = await getGroup(
      route.params.id || authStore.auth?.user?.payerUuid,
      removeUndefined({
        ...data,
        // search: props.search,
      })
    );

    const paginated = response?.data || response;

    if (paginated?.content) {
      familyStore.setFamilyBenefits(paginated.content);
      currentPage.value = paginated.page ?? 1;
      itemsPerPage.value = paginated.size ?? 25;
      totalPages.value = paginated.totalPages ?? 1;
      totalItems.value = paginated.totalElements ?? paginated.content.length;
    } else {
      familyStore.setFamilyBenefits(paginated);
    }

    return paginated;
  },
});

// Watch for search changes with debounce
watch(
  () => props.search,
  (newSearch) => {
    pagination.send();
  }
);

// Initialize on mount
onMounted(() => {
  if (props.search) {
    pagination.search.value = props.search;
  }

  if (props.auto) {
    pagination.send();
  }
});

// Expose refresh functionality to parent
defineExpose({
  refresh: pagination.send,
  setPage: (page: number) => {
    currentPage.value = page;
    pagination.send();
  },
  setLimit: (limit: number) => {
    itemsPerPage.value = limit;
    pagination.send();
  },
  currentPage: computed(() => currentPage.value),
  itemsPerPage: computed(() => itemsPerPage.value),
});
</script>

<template>
  <slot
    :group="familyStore.family"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="currentPage"
    :itemsPerPage="itemsPerPage"
    :totalPages="totalPages"
    :totalItems="totalItems"
  />
</template>