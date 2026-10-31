<script setup>
// Label, control, hint and error for one form field. The control goes in the default slot and
// gets `id` from the slot props so the label and error are wired to it.
import { useId } from "../utils/useId";

const props = defineProps({
  label: { type: String, default: "" },
  error: { type: String, default: "" },
  hint: { type: String, default: "" },
  required: { type: Boolean, default: false },
  name: { type: String, default: "" },
});
const id = useId(props.name || "f");
</script>

<template>
  <div class="flex flex-col gap-1 min-w-0" :data-field="name || undefined">
    <label v-if="label" :for="id" class="text-sm font-medium text-ink">
      {{ label }}<span v-if="required" class="ml-0.5 text-error" aria-hidden="true">*</span>
    </label>
    <slot :id="id" :invalid="!!error" :describedby="error ? `${id}-err` : hint ? `${id}-hint` : undefined" />
    <p v-if="error" :id="`${id}-err`" class="text-xs text-error">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-xs text-ink-subtle">{{ hint }}</p>
  </div>
</template>
