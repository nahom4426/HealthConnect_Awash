<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  onRemove: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} }
});

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0
  }).format(amount);
}

function getPackageCount(packagesObj, packageUuids) {
  if (Array.isArray(packageUuids) && packageUuids.length) {
    return packageUuids.length;
  }
  if (packagesObj && typeof packagesObj === 'object') {
    return Object.keys(packagesObj).length;
  }
  return 0;
}

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

function handleEditWithClose(row) {
  closeAllDropdowns();
  openModal('EditGroup', row);
}

function handleViewWithClose(row) {
  closeAllDropdowns();
  openModal('AddMembersToGroup', row);
}

function handleRemoveWithClose(rowId) {
  closeAllDropdowns();
  props.onRemove(rowId);
}

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});
onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.allowedUuid || idx"
    @click.self="props.onRowClick(row)"
    class="bg-white border-b hover:bg-blue-50 transition-colors cursor-pointer"
  >
    <!-- Index Number -->
    <td class="p-4 font-semibold text-gray-600 select-none">
      {{ idx + 1 }}
    </td>

    <!-- Data cells -->
    <td 
      v-for="key in rowKeys" 
      :key="key" 
      class="p-4 text-gray-700 whitespace-nowrap"
    >
     <template v-if="key === 'planType'">
        <span class="font-medium text-gray-700">
          {{row.planType }}
        </span>
      </template>
      <template v-else-if="key === 'packages'">
        <span class="font-medium text-blue-700">
          {{ getPackageCount(row.packages, row.packageUuids) }} package<span v-if="getPackageCount(row.packages, row.packageUuids) !== 1">s</span>
        </span>
      </template>

      <template v-else-if="key.includes('Benefit')">
        <span class="text-green-600 font-semibold">
          {{ formatCurrency(row[key]) }}
        </span>
      </template>

      <template v-else>
        {{ row[key] }}
      </template>
    </td>

    <!-- Actions Dropdown -->
    <td class="p-4 relative text-left">
      <button 
        @click.stop="toggleDropdown($event, row.allowedUuid)"
        aria-label="Actions"
        class="p-2 rounded-full hover:bg-gray-200 transition-colors"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor" >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      <div 
        :id="`dropdown-${row.allowedUuid}`"
        class="dropdown-menu hidden absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20"
      >
        <div class="py-1">
          <button 
            @click.stop="handleEditWithClose(row)" 
            class="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
          >
            <i v-html="icons.edits || '✏️'" class="w-5 h-5" />
            Edit
          </button>
          <button 
            @click.stop="handleViewWithClose(row)" 
            class="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
          >
            <i v-html="icons.details || '➕'" class="w-5 h-5" />
            Add Insured Person
          </button>
          <button 
            @click.stop="handleRemoveWithClose(row.allowedUuid)" 
            class="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-100 transition-colors font-semibold"
          >
            <i v-html="icons.deactivate || '🚫'" class="w-5 h-5" />
            Deactivate
          </button>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>.dropdown-menu {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top right;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  border-radius: 0.375rem;
  overflow: hidden;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* Dropdown Items */
.dropdown-menu button {
  padding: 0.5rem 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: white;
  text-align: left;
  transition: background-color 0.15s ease;
  border: none;
}

/* Hover */
.dropdown-menu button:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.dropdown-menu button.text-red-600:hover {
  background-color: #fef2f2;
  color: #dc2626;
}
</style>
