<!-- Switch.vue -->
<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-col">
      <label :for="name" class="text-sm font-medium text-gray-900">
        {{ label }}
      </label>
      <span v-if="description" class="text-sm text-gray-500">
        {{ description }}
      </span>
    </div>

    <!-- Switch Button -->
    <button
      type="button"
      :id="name"
      :aria-pressed="modelValue"
      @click="$emit('update:modelValue', !modelValue)"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      :class="modelValue ? 'bg-indigo-600' : 'bg-gray-200'"
    >
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        :class="modelValue ? 'translate-x-6' : 'translate-x-1'"
      />
    </button>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  label: String,
  description: String,
  modelValue: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
</script>
