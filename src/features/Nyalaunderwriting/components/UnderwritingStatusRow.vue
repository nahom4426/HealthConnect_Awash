<script setup>
import { defineProps } from 'vue';
import icons from '@/utils/icons';

const props = defineProps({
  rowData: Object,
  rowKeys: Array,
  onDelete: Function,
  onEdit: Function,
  onView: Function,
});

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-success-soft text-success-strong';
    case 'pending':
      return 'bg-warning-soft text-warning-strong';
    case 'history':
      return 'bg-surface-muted text-ink';
    case 'issued':
      return 'bg-primary/10 text-primary-hover';
    default:
      return 'bg-surface-muted text-ink';
  }
};
</script>

<template>
  <tr class="border-b hover:bg-surface-muted">
    <td v-for="key in rowKeys" :key="key" class="px-4 py-3">
      <span v-if="key === 'status'" 
            :class="getStatusClass(rowData[key])"
            class="px-2 py-1 rounded-full text-xs font-medium">
        {{ rowData[key] }}
      </span>
      <span v-else>{{ rowData[key] }}</span>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center gap-2">
        <button 
          @click="onView?.(rowData.id)"
          class="text-primary hover:text-primary-hover text-sm font-medium">
          View
        </button>
        <button 
          @click="onEdit?.(rowData.id)"
          class="text-success hover:text-success-strong text-sm font-medium">
          Edit
        </button>
        <button 
          @click="onDelete?.(rowData.id)"
          class="text-error hover:text-error-strong text-sm font-medium">
          Delete
        </button>
      </div>
    </td>
  </tr>
</template>