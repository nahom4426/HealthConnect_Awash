<script setup>
// Mock-backend only: pick which Marine roles to act as, to try each permission path.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ROLE_LABELS, ROLES } from "../constants";
import { setDevRoles, useCan } from "../composables/useCan";

const { t } = useI18n();
const { devRoles } = useCan();
const value = computed({
  get: () => (devRoles.value?.length === 1 ? devRoles.value[0] : ""),
  set: (v) => setDevRoles(v ? [v] : null),
});
</script>

<template>
  <label class="inline-flex gap-2 items-center px-2 py-1 text-xs rounded-lg border border-dashed border-warning text-warning-strong bg-warning-soft/60" :title="t('mock.hint')">
    <span class="font-semibold">{{ t("mock.viewingAs") }}</span>
    <select v-model="value" class="bg-transparent outline-none font-medium" aria-label="Viewing as role">
      <option value="">{{ t("mock.allRoles") }}</option>
      <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
    </select>
  </label>
</template>
