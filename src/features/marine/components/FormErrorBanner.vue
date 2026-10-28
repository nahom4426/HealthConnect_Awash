<script setup>
// Banner at the top of a form listing each field error as a link that focuses the field.
import { focusField } from "../composables/useForm";

defineProps({ items: { type: Array, required: true } });
</script>

<template>
  <div v-if="items.length" role="alert" class="p-3 mb-4 rounded-xl border bg-error-soft border-error/30">
    <p class="text-sm font-semibold text-error-strong">{{ items.length === 1 ? "1 field needs attention" : `${items.length} fields need attention` }}</p>
    <ul class="mt-1 space-y-0.5 text-sm">
      <li v-for="i in items" :key="i.field">
        <a :href="`#${i.field}`" class="text-error-strong underline-offset-2 hover:underline" @click.prevent="focusField(i.field)">{{ i.label }}: {{ i.message }}</a>
      </li>
    </ul>
  </div>
</template>
