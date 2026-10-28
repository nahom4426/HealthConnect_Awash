<script setup>
// Banner at the top of a form listing each field error as a link that focuses the field.
import { useI18n } from "vue-i18n";
import { focusField } from "../composables/useForm";

defineProps({ items: { type: Array, required: true } });
const { t } = useI18n();
</script>

<template>
  <div v-if="items.length" role="alert" class="p-3 mb-4 rounded-xl border bg-error-soft border-error/30">
    <p class="text-sm font-semibold text-error-strong">{{ t("form.fieldsNeedAttention", { n: items.length }, items.length) }}</p>
    <ul class="mt-1 space-y-0.5 text-sm">
      <li v-for="i in items" :key="i.field">
        <a :href="`#${i.field}`" class="text-error-strong underline-offset-2 hover:underline" @click.prevent="focusField(i.field)">{{ i.label }}: {{ i.message }}</a>
      </li>
    </ul>
  </div>
</template>
