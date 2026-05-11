<script setup>
import { useApiRequest } from "@/composables/useApiRequest";
import { useSingleInstitution } from "../store/singleInstitutionStore";
import { getInstitutionsById } from "../api/institutionApi";
import { computed, watch } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  institutionUuid: {
    type: [String, Number],
    default: undefined,
  },
});

const req = useApiRequest();
const route = useRoute();

const institutionStore = useSingleInstitution();

const institutionUuid = computed(() => {
  return (
    props.institutionUuid ||
    route.params.institutionUuid ||
    route.params.instutionId ||
    route.params.institutionId
  );
});

function load(id) {
  if (!id) return;
  if (institutionStore.get(String(id))) return;

  req.send(
    () => getInstitutionsById(String(id)),
    (res) => {
      if (res?.success) {
        institutionStore.add(res.data);
      }
    }
  );
}

watch(
  () => institutionUuid.value,
  (id) => {
    load(id);
  },
  { immediate: true }
);
</script>
<template>
  <div>
    <slot
      :instituton="institutionUuid ? institutionStore.get(String(institutionUuid)) : undefined"
      :pending="req.pending.value"
      :error="req.error.value"
    />
  </div>
</template>
