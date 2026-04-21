<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { removeUndefined } from "@/utils/utils";
import { useGroupInsuredStore } from "../../store/groupInsuredStore";
import { getGroup, getGroupInsured } from "../../api/groupServiceApi";
import { useRoute } from "vue-router";
const route = useRoute();

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },

  search: {
    type: String,
    default: "",
  },
  id: {
    type: String,
  },
});

const insuredStore = useGroupInsuredStore();

const pagination = usePagination({
  store: insuredStore,
  cb: (data) =>
    getGroupInsured(
      route.params.id ||props.id,
      removeUndefined({ searchKey: props.search, ...data })
    ),
});
watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

if (insuredStore.insured.length == 0) {
  pagination.send();
}
</script>
<template>
  <slot
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :insured="insuredStore.insured"
  />
</template>
