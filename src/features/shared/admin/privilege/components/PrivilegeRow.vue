<script setup>
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import icons from "@/utils/icons";

const router = useRouter();

const emit = defineEmits(['edit', 'detail', 'rowClick']);

const props = defineProps({
  rowData: {
    type: Array,
    required: true
  },
  rowKeys: {
    type: Array,
    required: true
  },
  headKeys: {
    type: Array,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get category style
function getCategoryStyle(category) {
  const base = "inline-flex justify-center items-center px-3 py-1 rounded-full text-xs font-semibold";
  
  switch (category?.toLowerCase()) {
    case 'provider':
      return `${base} bg-blue-100 text-blue-800`;
    case 'payer':
      return `${base} bg-green-100 text-green-800`;
    case 'admin':
      return `${base} bg-purple-100 text-purple-800`;
    case 'user':
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

// Truncate text
function truncateText(text, length = 60) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function handleEdit(row) {
  router.push(`/edit_privilege/${row?.privilegeUuid}`);
}

function handleDetail(row) {
  router.push(`/privilege_detail/${row?.privilegeUuid}`);
}

</script>

<template>
  <!-- Desktop Table Rows -->
  <template v-if="!isMobile">
    <tr 
      v-for="(row, idx) in rowData.filter(r => r !== null)" 
      :key="idx"
      @click.self="onRowClick(row)" 
      class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50" 
    >
      <!-- Index -->
      <td class="p-4 py-4">
        <span class="font-medium text-gray-500">
          {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
        </span>
      </td>

      <!-- Privilege Name -->
      <td class="p-4 py-4">
        <span class="font-semibold text-gray-900">
          {{ capitalizeFirstLetter(row?.privilegeName) }}
        </span>
      </td>

      <!-- Description -->
      <td class="p-4 py-4">
        <span class="text-sm text-gray-600">
          {{ truncateText(row?.privilegeDescription, 80) }}
        </span>
      </td>

      <!-- Category -->
      <td class="p-4 py-4">
        <span :class="getCategoryStyle(row?.privilegeCategory)">
          {{ capitalizeFirstLetter(row?.privilegeCategory) }}
        </span>
      </td>

      <!-- Actions -->
      <td class="p-4 py-4">
        <div class="flex flex-wrap gap-2 justify-start items-center">
          <!-- ✏️ Edit -->
          <button
            @click.stop.prevent="handleEdit(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm"
          >
            <!-- <i v-html="icons.edit" class="text-blue-500" /> -->
            <span>✏️ Edit</span>
          </button>

          <!-- 👁️ Detail -->
          <!-- <button
            @click.stop="handleDetail(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-200 transition-all duration-200 hover:bg-indigo-100 hover:shadow-sm"
          >
            <i v-html="icons.details" class="text-indigo-500" />
            <span>Detail</span>
          </button> -->
        </div>
      </td>
    </tr>
  </template>

  <!-- Mobile Card Layout -->
  <template v-else>
    <div 
      v-for="(row, idx) in rowData.filter(r => r !== null)" 
      :key="idx"
      @click="onRowClick(row)"
      class="p-2 mx-0.5 mb-2 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer sm:p-3 hover:shadow-md sm:mb-3 sm:mx-2"
    >
      <!-- Header with privilege name and category -->
      <div class="flex flex-col mb-2 space-y-1 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 sm:mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-xs font-semibold text-gray-900 truncate sm:text-sm">
            {{ capitalizeFirstLetter(row?.privilegeName) }}
          </h3>
          <p class="text-xs text-gray-500 line-clamp-1 sm:line-clamp-2">
            {{ row?.privilegeDescription }}
          </p>
        </div>
        <div class="flex-shrink-0 mt-1 sm:mt-0">
          <span :class="getCategoryStyle(row?.privilegeCategory)" class="px-2 py-0.5 text-xs">
            {{ capitalizeFirstLetter(row?.privilegeCategory) }}
          </span>
        </div>
      </div>

      <!-- Privilege Details -->
      <div class="py-2 mb-2 space-y-1 border-t border-gray-100 sm:py-2 sm:mb-2">
        <div class="flex justify-between items-start py-0.5">
          <span class="flex-shrink-0 text-xs font-medium text-gray-500">UUID:</span>
          <span class="ml-2 font-mono text-xs text-right text-gray-900 truncate">
            {{ row?.privilegeUuid?.substring(0, 8) }}...
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-100 sm:flex-row sm:gap-2 sm:pt-2">
        <!-- ✏️ Edit -->
        <button
          @click.stop.prevent="handleEdit(row)"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-200 transition-all duration-200 hover:bg-blue-100"
        >
          <i v-html="icons.edit" class="w-3 h-3 text-blue-500" />
          <span>Edit</span>
        </button>

        <!-- 👁️ Detail -->
        <button
          @click.stop="handleDetail(row)"
          class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md border border-indigo-200 transition-all duration-200 hover:bg-indigo-100"
        >
          <i v-html="icons.details" class="w-3 h-3 text-indigo-500" />
          <span>Detail</span>
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Mobile responsive improvements */
@media (max-width: 640px) {
  .mobile-card {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    padding: 0.75rem;
  }
  
  .mobile-card h3 {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  .mobile-card .action-buttons {
    gap: 0.5rem;
  }
  
  .mobile-card .action-buttons button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
