<script setup>
// Standard loading / empty / error / not-found / forbidden blocks (plan section 3, "UI states").
import { useI18n } from "vue-i18n";
import Button from "@/components/Button.vue";

const props = defineProps({
  kind: { type: String, default: "empty" }, // loading | empty | error | notFound | forbidden
  title: { type: String, default: "" },
  message: { type: String, default: "" },
  correlationId: { type: String, default: "" },
});
defineEmits(["retry"]);

const { t } = useI18n();
</script>

<template>
  <div v-if="kind === 'loading'" class="grid gap-4 p-6 animate-pulse" aria-busy="true" :aria-label="t('common.loading')">
    <div class="w-1/3 h-5 rounded bg-surface-raised"></div>
    <div class="grid gap-3 sm:grid-cols-3">
      <div v-for="i in 6" :key="i" class="h-12 rounded-lg bg-surface-raised"></div>
    </div>
    <div class="h-40 rounded-lg bg-surface-raised"></div>
  </div>
  <div v-else class="flex flex-col gap-3 items-center px-6 py-14 text-center" :role="kind === 'error' ? 'alert' : undefined">
    <span
      :class="[
        'grid place-items-center w-11 h-11 rounded-full',
        kind === 'error' ? 'bg-error-soft text-error' : kind === 'forbidden' ? 'bg-warning-soft text-warning-strong' : 'bg-surface-raised text-ink-subtle',
      ]"
      aria-hidden="true"
    >
      <svg v-if="kind === 'error' || kind === 'forbidden'" class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 6.5v4.5M10 14h.01" /><circle cx="10" cy="10" r="7.5" /></svg>
      <svg v-else class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h14v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm0 0 2-4h10l2 4M8 11h4" /></svg>
    </span>
    <p class="text-sm font-semibold text-ink">{{ title || t(`pageState.${kind}`) }}</p>
    <p v-if="message" class="max-w-md text-sm text-ink-muted">{{ message }}</p>
    <p v-if="correlationId" class="text-xs text-ink-subtle">{{ t("common.reference", { id: correlationId }) }}</p>
    <div class="flex flex-wrap gap-2 justify-center">
      <Button v-if="kind === 'error'" variant="outline" size="sm" @click="$emit('retry')">{{ t("common.tryAgain") }}</Button>
      <slot />
    </div>
  </div>
</template>
