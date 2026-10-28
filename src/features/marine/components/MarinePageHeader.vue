<script setup>
// Title row of every marine page: breadcrumb, title with status, subtitle, actions.
// Also sets the browser title. While the mock backend is on it shows the "Viewing as" role switch.
import { watchEffect } from "vue";
import StatusBadge from "./StatusBadge.vue";
import DevRoleSwitch from "./DevRoleSwitch.vue";
import { marineMockEnabled } from "../api/mockMode";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  status: { type: String, default: "" },
  entity: { type: String, default: "" },
  /** [{ label, to? }] — the last item is the current page */
  crumbs: { type: Array, default: () => [] },
});

watchEffect(() => {
  document.title = `${props.title} · Marine & Cargo`;
});
</script>

<template>
  <header class="mb-5">
    <div class="flex flex-wrap gap-3 justify-between items-center mb-1">
      <nav v-if="crumbs.length" aria-label="Breadcrumb" class="text-xs font-medium text-ink-subtle">
        <ol class="flex flex-wrap gap-1 items-center">
          <li v-for="(c, i) in crumbs" :key="i" class="flex gap-1 items-center">
            <RouterLink v-if="c.to && i < crumbs.length - 1" :to="c.to" class="hover:text-primary">{{ c.label }}</RouterLink>
            <span v-else :aria-current="i === crumbs.length - 1 ? 'page' : undefined">{{ c.label }}</span>
            <span v-if="i < crumbs.length - 1" aria-hidden="true">/</span>
          </li>
        </ol>
      </nav>
      <span v-else />
      <DevRoleSwitch v-if="marineMockEnabled" />
    </div>
    <div class="flex flex-wrap gap-4 justify-between items-start">
      <div class="min-w-0">
        <div class="flex flex-wrap gap-2 items-center">
          <h1 class="text-xl font-semibold tracking-tight text-ink">{{ title }}</h1>
          <StatusBadge v-if="status && entity" :entity="entity" :status="status" />
          <slot name="badge" />
        </div>
        <p v-if="subtitle" class="mt-1 max-w-3xl text-sm text-ink-muted">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
