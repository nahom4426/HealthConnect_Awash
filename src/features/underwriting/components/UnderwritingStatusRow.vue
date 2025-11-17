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
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'history':
      return 'bg-gray-100 text-gray-800';
    case 'issued':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
</script>

<template>
  <tr class="border-b hover:bg-gray-50">
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
          class="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View
        </button>
        <button 
          @click="onEdit?.(rowData.id)"
          class="text-green-600 hover:text-green-800 text-sm font-medium">
          Edit
        </button>
        <button 
          @click="onDelete?.(rowData.id)"
          class="text-red-600 hover:text-red-800 text-sm font-medium">
          Delete
        </button>
      </div>
    </td>
  </tr>
</template>