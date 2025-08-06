<script setup>
import { computed } from 'vue';
const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const classForBadge = computed(() => {
  switch (props.status) {
    case 'Requested':
      return 'bg-gray-500 ';
    case 'Reviewed':
      return 'bg-yellow-500 ';
    case 'Audited':
      return 'bg-green-500 ';
    case 'Approved':
      return 'bg-indigo-500 ';
    case 'Paid':
      return 'bg-blue-500 ';
    case 'Denied':
      return 'bg-red-500 ';
    default:
      return 'bg-gray-100 ';
  }
});
</script>

<template>
  <span
    :class="
      classForBadge +
      ' inline-flex items-center text-white rounded-sm font-normal capitalize  px-1.5 py-0.5 text-xs  '
    "
    >{{ status }}</span
  >
</template>
