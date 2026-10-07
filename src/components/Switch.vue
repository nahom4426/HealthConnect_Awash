<!-- Switch.vue -->
<script setup>
defineProps({
  name: String,
  label: String,
  description: String,
  modelValue: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="flex gap-4 justify-between items-center">
    <div class="flex flex-col">
      <label :for="name" class="text-sm font-medium text-ink">{{ label }}</label>
      <span v-if="description" :id="name ? `${name}-description` : undefined" class="text-sm text-ink-muted">
        {{ description }}
      </span>
    </div>

    <button
      :id="name"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-describedby="description && name ? `${name}-description` : undefined"
      class="inline-flex relative items-center w-11 h-6 rounded-full transition-colors shrink-0"
      :class="modelValue ? 'bg-primary' : 'bg-gray-300'"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span
        class="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform"
        :class="modelValue ? 'translate-x-[22px]' : 'translate-x-0.5'"
      />
    </button>
  </div>
</template>
