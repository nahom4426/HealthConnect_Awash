<script setup>
// Mock-backend only: pick which Marine roles to act as, to try each permission path.
import { computed } from "vue";
import { ROLE_LABELS, ROLES } from "../constants";
import { setDevRoles, useCan } from "../composables/useCan";

const { devRoles } = useCan();
const value = computed({
  get: () => (devRoles.value?.length === 1 ? devRoles.value[0] : ""),
  set: (v) => setDevRoles(v ? [v] : null),
});
</script>

<template>
  <label class="inline-flex gap-2 items-center px-2 py-1 text-xs rounded-lg border border-dashed border-warning text-warning-strong bg-warning-soft/60" title="Mock backend: choose the role to try. Not shown with the real backend.">
    <span class="font-semibold">Mock · viewing as</span>
    <select v-model="value" class="bg-transparent outline-none font-medium" aria-label="Viewing as role">
      <option value="">All roles</option>
      <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
    </select>
  </label>
</template>
