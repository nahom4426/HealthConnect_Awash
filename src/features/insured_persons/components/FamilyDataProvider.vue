<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch, onMounted, computed, ref } from "vue";
import { removeUndefined } from "@/utils/utils";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";
import { useFamily } from "../store/FamilyStore";
import { getAllServiceQuoted } from "../api/groupServiceApi";

const route = useRoute();
const authStore = useAuthStore();
const familyStore = useFamily();

// Define props
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

const loadingMore = ref(false);
const hasMore = computed(() => currentPage.value < totalPages.value);

// Enhanced pagination setup
const pagination = usePagination({
  auto: false,
  cb: async (data) => {
    const payerInstitutionContractUuid = route.params.id || props.id;
    const response = await getAllServiceQuoted(
      payerInstitutionContractUuid,
      removeUndefined({
        ...data,
        sortBy: 'id',
        sortDirection: 'desc',
      })
    );

    const paginated = response?.data || response;

    if (paginated?.content) {
      familyStore.setFamilyBenefits(paginated.content);
      currentPage.value = (paginated.page ?? 0) + 1;
      itemsPerPage.value = paginated.size ?? 25;
      totalPages.value = paginated.totalPages ?? 1;
      totalItems.value = paginated.totalElements ?? paginated.content.length;
    } else {
      familyStore.setFamilyBenefits(paginated);
    }

    return paginated;
  },
});

watch(
  () => pagination.pending.value,
  (isPending) => {
    if (!isPending && loadingMore.value) {
      loadingMore.value = false;
    }
  }
);

// Watch for search changes with debounce
watch(
  () => props.search,
  (newSearch) => {
    pagination.send();
  }
);

function loadMore() {
  if (loadingMore.value) return;
  if (!hasMore.value) return;

  loadingMore.value = true;
  pagination.next();
}

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
  loadMore,
  setPage: (page) => {
    currentPage.value = page;
    pagination.send();
  },
  setLimit: (limit) => {
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
    :loadingMore="loadingMore"
    :hasMore="hasMore"
    :currentPage="currentPage"
    :itemsPerPage="itemsPerPage"
    :totalPages="totalPages"
    :totalItems="totalItems"
  />
</template>