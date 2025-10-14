<script setup>
import { usePagination } from "@/composables/usePagination";
import { useAddProviders } from "../store/AddprovidersStore";
import { getProviders } from "../api/providerApi"; // external providers (from other system)
import { getInactiveProviders } from "../api/providerApi"; // or getActiveProviders if it’s a different endpoint
import { watch, onMounted, ref } from "vue";
import { removeUndefined } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
  },
  search: {
    type: String,
    default: "",
  },
});

const store = useAddProviders();
const filteredProviders = ref([]);
const activeProviders = ref([]);

async function fetchActiveProviders() {
  try {
    const res = await getInactiveProviders(
      removeUndefined({
        status: "ACTIVE",
        page: 0,
        size: 1000, // adjust as needed
      })
    );
    if (res?.data?.content) {
      activeProviders.value = res.data.content;
    } else if (Array.isArray(res?.data)) {
      activeProviders.value = res.data;
    }
  } catch (err) {
    console.error("Failed to fetch active providers", err);
  }
}

const pagination = usePagination({
  store: store,
  cb: async (data) => {
    // Fetch external (other system) providers
    const extRes = await getProviders(
      removeUndefined({
        ...data,
        status: props.status,
        search: props.search.trim(),
      })
    );

    // Fetch active providers before filtering
    if (activeProviders.value.length === 0) {
      await fetchActiveProviders();
    }

    const activeUuids = new Set(
      activeProviders.value.map((p) => p.providerUuid)
    );

    // Filter external list to exclude already-added ones
    const uniqueProviders = Array.isArray(extRes?.data)
      ? extRes.data.filter((p) => !activeUuids.has(p.providerUuid))
      : [];

    filteredProviders.value = uniqueProviders;
    store.providers = uniqueProviders;

    return extRes;
  },
});

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

onMounted(() => {
  if (props.auto) pagination.send();
});
</script>

<template>
  <slot
    :providers="filteredProviders"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>
