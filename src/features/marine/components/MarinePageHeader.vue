<script setup>
// Title row of every marine page: breadcrumb, title with status, subtitle, actions.
// Also sets the browser title. While the mock backend is on it shows the "Viewing as" role switch.
import { watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { LOCALES, setLocale } from "../i18n";
import StatusBadge from "./StatusBadge.vue";
import DevRoleSwitch from "./DevRoleSwitch.vue";
import AlertsBell from "./AlertsBell.vue";
import { marineMockEnabled } from "../api/mockMode";
import "../print.css";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  status: { type: String, default: "" },
  entity: { type: String, default: "" },
  /** [{ label, to? }] — the last item is the current page */
  crumbs: { type: Array, default: () => [] },
  /** The public verify page and other bare pages leave the bell out */
  bell: { type: Boolean, default: true },
});

const { t, locale } = useI18n();

watchEffect(() => {
  document.title = `${props.title} · Marine & Cargo`;
});
</script>

<template>
  <header class="mb-5 marine-header">
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
      <div class="flex gap-2 items-center" data-print-hide>
        <label v-if="LOCALES.length > 1" class="inline-flex gap-1 items-center text-xs text-ink-muted">
          <span class="sr-only">{{ t("common.language") }}</span>
          <select :value="locale" :aria-label="t('common.language')" class="px-1 h-8 rounded-lg border border-line bg-surface" @change="setLocale($event.target.value)">
            <option v-for="l in LOCALES" :key="l.code" :value="l.code">{{ l.label }}</option>
          </select>
        </label>
        <DevRoleSwitch v-if="marineMockEnabled" />
        <AlertsBell v-if="bell" />
      </div>
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
