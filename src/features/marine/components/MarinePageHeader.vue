<script setup>
// Title row of every marine page: breadcrumb, title with status, subtitle, actions.
// Also sets the browser title. While the mock backend is on it shows the "Viewing as" role switch.
// Drawn as a card with the section's icon and a faint wave (theme.css), the module's look.
import { computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { LOCALES, setLocale } from "../i18n";
import StatusBadge from "./StatusBadge.vue";
import DevRoleSwitch from "./DevRoleSwitch.vue";
import AlertsBell from "./AlertsBell.vue";
import { marineMockEnabled } from "../api/mockMode";
import { iconFor } from "./marineIcons";
import "../print.css";
import "../theme.css";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  status: { type: String, default: "" },
  entity: { type: String, default: "" },
  /** [{ label, to? }] — the last item is the current page */
  crumbs: { type: Array, default: () => [] },
  /** The public verify page and other bare pages leave the bell out */
  bell: { type: Boolean, default: true },
  /** Path data of a 24×24 outline icon; defaults to the icon of the URL's section */
  icon: { type: String, default: "" },
});
const route = useRoute();
const iconPath = computed(() => props.icon || iconFor(route.path));

const { t, locale } = useI18n();

watchEffect(() => {
  document.title = `${props.title} · Marine & Cargo`;
});
</script>

<template>
  <header class="mb-5 marine-header marine-hero">
    <svg class="marine-waves" viewBox="0 0 520 140" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M0 96c43 0 65-22 108-22s65 22 108 22 65-22 108-22 65 22 108 22 65-22 88-22v68H0V96Z" fill="currentColor" opacity=".06" />
      <path d="M0 114c43 0 65-18 108-18s65 18 108 18 65-18 108-18 65 18 108 18 65-18 88-18v44H0v-26Z" fill="currentColor" opacity=".08" />
      <path d="M0 78c43 0 65-20 108-20s65 20 108 20 65-20 108-20 65 20 108 20 65-20 88-20" stroke="currentColor" stroke-opacity=".18" stroke-width="1.5" />
    </svg>
    <div class="flex flex-wrap gap-3 justify-between items-center mb-3">
      <nav v-if="crumbs.length" aria-label="Breadcrumb" class="text-xs font-medium text-ink-muted">
        <ol class="flex flex-wrap gap-1 items-center">
          <li v-for="(c, i) in crumbs" :key="i" class="flex gap-1 items-center">
            <RouterLink v-if="c.to && i < crumbs.length - 1" :to="c.to" class="hover:text-primary">{{ c.label }}</RouterLink>
            <span v-else :aria-current="i === crumbs.length - 1 ? 'page' : undefined" :class="i === crumbs.length - 1 ? 'text-ink' : ''">{{ c.label }}</span>
            <svg v-if="i < crumbs.length - 1" class="w-3 h-3 text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m8 5 5 5-5 5" /></svg>
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
    <div class="flex flex-wrap gap-4 justify-between items-center">
      <div class="flex gap-3.5 items-center min-w-0">
        <span class="marine-hero-icon" aria-hidden="true">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path :d="iconPath" /></svg>
        </span>
        <div class="min-w-0">
          <div class="flex flex-wrap gap-2 items-center">
            <h1 class="text-xl font-bold tracking-tight md:text-2xl text-ink">{{ title }}</h1>
            <StatusBadge v-if="status && entity" :entity="entity" :status="status" />
            <slot name="badge" />
          </div>
          <p v-if="subtitle" class="mt-0.5 max-w-3xl text-sm text-ink-muted">{{ subtitle }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
