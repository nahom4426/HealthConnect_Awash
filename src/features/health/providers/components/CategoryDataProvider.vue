<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { usePagination } from "@/composables/usePagination";
import { getAllServiceCategories, getNotEligibleCategories } from "../api/categoryApi";
import { useServiceCategoriesStore } from "../store/serviceCategoriesStore";

const props = defineProps({
  auto: { type: Boolean, default: true },
  search: { type: String, default: "" },
});

const route = useRoute();
const policyUuid = route.params.id; // from /removeServiceCatagories/:id/:institutionUuid/:contractUuid
const contractUuid = route.params.contractUuid;

const store = useServiceCategoriesStore();
const notEligibleByCategory = ref({});
const notEligiblePending = ref(false);
const notEligibleError = ref("");

const pagination = usePagination({
  store,
  cb: async (data) => {
    const response = await getAllServiceCategories(contractUuid, data);
    return response;
  },
});

async function loadNotEligible() {
  try {
    notEligiblePending.value = true;
    notEligibleError.value = "";
    
    const res = await getNotEligibleCategories(contractUuid, policyUuid);
    
    // Handle both array and object responses for not-eligible
    let notEligibleList = [];
    if (Array.isArray(res)) {
      notEligibleList = res;
    } else if (Array.isArray(res?.data)) {
      notEligibleList = res.data;
    } else if (Array.isArray(res?.content)) {
      notEligibleList = res.content;
    }
    
    
    // Create a map of not-eligible categories by categoryUuid
    const notEligibleMap = {};
    notEligibleList.forEach(item => {
      if (item?.categoryUuid) {
        notEligibleMap[item.categoryUuid] = item;
      }
    });
    
    notEligibleByCategory.value = notEligibleMap;
  } catch (e) {
    console.error('[CategoryDataProvider] Error loading not-eligible categories:', e);
    notEligibleError.value = e?.message || "Failed to load not-eligible categories";
  } finally {
    notEligiblePending.value = false;
  }
}

watch(
  () => props.search,
  () => {
    pagination.send();
  },
  { immediate: false }
);

function refresh() {
  pagination.send();
  loadNotEligible();
}

onMounted(() => {
  if (props.auto) {
    refresh();
  } else {
    // Even if auto is false, we need to load not-eligible categories
    loadNotEligible();
  }
});

defineExpose({
  refresh,
  send: refresh,
});
</script>
<template>
  <slot
    :categories="store.categories"
    :not-eligible-by-category="notEligibleByCategory"
    :contract-uuid="contractUuid"
    :policy-uuid="policyUuid"
    :refresh="refresh"
    :loading="pagination.pending.value || notEligiblePending"
    :error="pagination.error || notEligibleError"
  />
</template>
