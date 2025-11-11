<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import Button from "@/components/Button.vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['row']);

// Truncate long text
function truncateText(text, maxLength = 25) {
  if (!text) return '-';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function getServiceTypeStyle(itemType) {
  if (itemType === 'SERVICE') {
    return {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      dotColor: 'bg-blue-500',
      label: 'Credit Service'
    };
  }
  return {
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
    label: itemType || 'Service'
  };
}

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
}

function handleClickOutside(event) {
  if (!event.target.closest('.dropdown-container')) {
    closeAllDropdowns();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function handleViewDetails(row) {
  closeAllDropdowns();
  if (props.cells?.onView && typeof props.cells.onView === 'function') {
    props.cells.onView(row);
  }
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.serviceProvidedUuid"
    @click.self="emit('row', row)" 
    class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
  >  
    <td class="p-4 font-medium text-sm text-gray-600">{{ idx + 1 }}</td>
    
    <td class="p-4" v-for="key in rowKeys" :key="key">  
      <!-- Insured Name -->
      <div v-if="key === 'fullname'" class="max-w-[200px]">
        <span class="text-sm font-medium text-gray-900 truncate block">
          {{ row.insuredName || row.dependantName || '-' }}
        </span>
        <span v-if="row.dependantName" class="text-xs text-gray-500">
          (Dependant)
        </span>
      </div>

      <!-- Provider Name -->
      <div v-else-if="key === 'providerName'" class="max-w-[180px]">
        <span class="text-sm text-gray-900 truncate block">
          {{ truncateText(row.providerName, 25) }}
        </span>
      </div>

      <!-- Institution Name -->
      <div v-else-if="key === 'institutionName'" class="max-w-[150px]">
        <span class="text-sm text-gray-700 truncate block">
          {{ truncateText(row.institutionName, 20) }}
        </span>
      </div>

      <!-- Service Type / Item Type -->
      <div v-else-if="key === 'itemType'">
        <span 
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
            getServiceTypeStyle(row.itemType).bgColor,
            getServiceTypeStyle(row.itemType).textColor,
            getServiceTypeStyle(row.itemType).borderColor,
            'border'
          ]"
        >
          <span 
            class="w-1.5 h-1.5 rounded-full" 
            :class="getServiceTypeStyle(row.itemType).dotColor"
          ></span>
          {{ getServiceTypeStyle(row.itemType).label }}
        </span>
      </div>

      <!-- Provided Items Count with Hover Tooltip -->
      <div v-else-if="key === 'providedItems'" class="flex items-center justify-center relative group">
        <span 
          class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold border border-indigo-200 cursor-help"
          :title="`${row.providedItemResponses ? row.providedItemResponses.length : 0} service items`"
        >
          {{ row.providedItemResponses ? row.providedItemResponses.length : 0 }}
        </span>
        <div
          v-if="row.providedItemResponses && row.providedItemResponses.length"
          class="absolute z-50 hidden group-hover:block bottom-full mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-left"
        >
          <div class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Services ({{ row.providedItemResponses.length }})
          </div>
          <ul class="max-h-64 overflow-auto divide-y divide-gray-100">
            <li v-for="(item, i) in row.providedItemResponses" :key="i" class="py-2.5">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-gray-900 truncate" :title="item.itemName">
                    {{ item.itemName }}
                  </div>
                  <div class="text-[11px] text-gray-500 mt-0.5">
                    Code: <span class="font-mono">{{ item.itemCode }}</span>
                  </div>
                </div>
                <div class="text-xs font-semibold text-indigo-700 whitespace-nowrap">
                  ETB {{ formatCurrency(item.totalPrice) }}
                </div>
              </div>
              <div class="text-[11px] text-gray-500 mt-1 flex items-center gap-3">
                <span>Qty: <span class="font-medium text-gray-700">{{ item.quantity }}</span></span>
                <span>Unit: <span class="font-medium text-gray-700">ETB {{ formatCurrency(item.unitPrice) }}</span></span>
              </div>
            </li>
          </ul>
          <div class="mt-2 pt-2 border-t border-gray-200">
            <div class="flex justify-between items-center text-xs">
              <span class="font-semibold text-gray-700">Total Amount:</span>
              <span class="font-bold text-indigo-700">ETB {{ formatCurrency(row.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Amount -->
      <div v-else-if="key === 'amount'" class="text-right">
        <span class="text-sm font-semibold text-gray-900">
          ETB {{ formatCurrency(row.amount) }}
        </span>
      </div>

      <!-- Status -->
      <div v-else-if="key === 'status'">
        <span class="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Pending
        </span>
      </div>

      <!-- Provided Date -->
      <div v-else-if="key === 'providedDate'" class="text-sm text-gray-700">
        {{ secondDateFormat(row.providedDate) }}
      </div>

      <!-- Default case for other fields -->
      <span v-else class="text-sm text-gray-700">
        {{ row[key] || '-' }}
      </span>
    </td> 
 
    <!-- Actions Column -->
    <td class="p-3" v-if="headKeys.find((head) => head.toLowerCase() === 'actions')">
      <Button 
        type="link" 
        @click.stop="handleViewDetails(row)" 
        class="!text-blue-600 hover:!text-blue-800 font-medium transition-colors"
      >
        View Details
      </Button>
    </td>
  </tr>
</template>

<style scoped>
.dropdown-container {
  position: relative;
}

.dropdown-menu {
  transition: all 0.2s ease-out;
  transform-origin: top right;
}

.dropdown-menu.hidden {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1);
  animation: dropdownAppear 0.2s ease-out;
}

@keyframes dropdownAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

tr:hover {
  background-color: #f8fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

tr {
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

td {
  vertical-align: middle;
}

/* Smooth scroll for service items list */
ul {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

ul::-webkit-scrollbar {
  width: 6px;
}

ul::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

ul::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

ul::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
