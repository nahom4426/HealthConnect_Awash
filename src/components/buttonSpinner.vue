<template>
  <svg
    :class="['animate-spin', baseSize, baseColor, customClass]"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
</template>

<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
  },
  color: {
    type: String,
    default: 'white', // tailwind color like 'white', 'gray-500', 'blue-500'
  },
  customClass: {
    type: String,
    default: '',
  },
});

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const baseSize = sizeMap[props.size] || sizeMap.md;
const baseColor = `text-${props.color}`;
</script>
