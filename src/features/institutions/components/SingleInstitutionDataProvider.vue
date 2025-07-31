<script setup lang="ts">
import { useApiRequest } from "@/composables/useApiRequest";
import { useSingleInstitution } from "../store/singleInstitutionStore";
import { getInstitutionsById } from "../api/institutionsApi";
import { useRoute } from "vue-router";
import type { Institution } from "../store/institutionsStore";

const req = useApiRequest<Institution>();
const route = useRoute();

const institutionStore = useSingleInstitution();

const institutionUuid = route.params.institutionUuid;

if (!institutionStore.get(institutionUuid as string)) {
  req.send(
    () => getInstitutionsById(institutionUuid as string),
    (res) => {
      if (res.success) {
        institutionStore.add(res.data as Institution);
      }
    }
  );
}

</script>
<template>
  <slot
    :instituton="institutionStore.get(institutionUuid as string)"
    :pending="req.pending.value"
    :error="req.error.value"
  />
</template>
