<template>
  <div class="flex border-b border-gray-200" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      @click="select(tab)"
      :class="[
        'px-4 py-2 -mb-px text-sm font-medium transition-colors',
        active === tab
          ? 'border-b-2 border-primary text-primary'
          : 'text-gray-600 hover:text-primary',
      ]"
      role="tab"
      :aria-selected="active === tab"
    >
      {{ tab }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
  tabs: {
    type: Array as () => string[],
    required: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const active = ref(props.modelValue || (props.tabs.length > 0 ? props.tabs[0] : ''));

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) active.value = newVal;
  }
);

function select(tab: string) {
  active.value = tab;
  emit('update:modelValue', tab);
}
</script>

<style scoped>
/* Tailwind primary color is used via utility classes */
</style>
