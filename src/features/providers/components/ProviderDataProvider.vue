<script setup>
import { usePagination } from "@/composables/usePagination";
import { useAddProviders } from "../store/AddprovidersStore";
import { getProviders } from "../api/providerApi"; // external providers (from other system)
import { watch } from "vue";
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
  cells: Array,
  isMobile: Boolean, 
});

const store = useAddProviders();

const pagination = usePagination({
  store: store,
  cb: async (data) => {
    const extRes = await getProviders(
      removeUndefined({
        page: data.page,
        size: data.limit,
        status: props.status,
        search: props.search.trim(),
      })
    );

    return extRes;
  },
});

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

// onMounted(() => {
//   if (props.auto) pagination.send();
// });
</script>

<template>
  <slot
    :providers="pagination.data.value"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>
