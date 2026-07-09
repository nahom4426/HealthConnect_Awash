<script setup>
import { computed } from 'vue';
import { getStatusMeta, getTransactionTypeMeta } from '../api/utils';

const props = defineProps({
  status: { type: String },
  type: { type: String } // e.g., 'TRANSACTION'
});

const meta = computed(() => {
  if (props.type === 'TRANSACTION') {
    return getTransactionTypeMeta(props.status);
  }
  return getStatusMeta(props.status);
});
</script>

<template>
  <span 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="meta.cls"
  >
    <span v-if="meta.color === 'green'" class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
    <span v-else-if="meta.color === 'red'" class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
    <span v-else-if="meta.color === 'orange' || meta.color === 'yellow'" class="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
    <span v-else class="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span>
    {{ meta.label }}
  </span>
</template>
