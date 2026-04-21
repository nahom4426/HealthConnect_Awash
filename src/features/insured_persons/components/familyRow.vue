<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  onRemove: { type: Function, default: () => {} },
  onRefetch: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
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
  openModal('EditGroup', row, (result) => {
    if (result?.success) props.onRefetch();
  });
}

function handleViewWithClose(row) {
  closeAllDropdowns();
  openModal('AddMembersToGroup', row, (result) => {
    if (result?.success) props.onRefetch();
  });
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
</script><template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.serviceQuotedUuid || idx"
    @click.self="props.onRowClick(row)"
    class="bg-white border-b border-gray-100 transition-all duration-200 cursor-pointer hover:bg-blue-50/30 group"
  >
    <!-- Index Number -->
    <td class="p-4">
      <div class="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
        <span class="text-sm font-bold text-blue-700 select-none">
          {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
        </span>
      </div>
    </td>

    <!-- Data cells -->
    <td 
      v-for="key in rowKeys" 
      :key="key" 
      class="p-4"
    >
      <!-- Plan Type -->
      <template v-if="key === 'planType'">
        <div class="inline-flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span class="text-sm font-semibold text-blue-700">
            {{ row.planType }}
          </span>
        </div>
      </template>

      <!-- Package Name -->
      <template v-else-if="key === 'packageName'">
        <div class="inline-flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
          <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span class="text-sm font-semibold text-gray-900">{{ row.packageName }}</span>
          <span class="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded">
            Benefit
          </span>
        </div>
      </template>

      <!-- Coverage & Premium (Currency) -->
      <template v-else-if="key === 'coverage' || key === 'premium'">
        <div class="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
          <span class="text-sm font-bold text-green-700">
            {{ formatCurrency(row[key]) }}
          </span>
        </div>
      </template>

      <!-- Rate -->
      <template v-else-if="key === 'rate'">
        <div class="inline-flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
          <span class="text-sm font-semibold text-amber-800">
            {{ Number(row.rate) || 0 }}
          </span>
          <span class="text-xs font-medium text-amber-600">rate</span>
        </div>
      </template>

      <!-- Number of Insured -->
      <template v-else-if="key === 'numberOfInsured'">
        <div class="relative">
          <div class="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full border border-indigo-100">
            <span class="text-base font-bold text-indigo-700">
              {{ Number(row.numberOfInsured) || 0 }}
            </span>
          </div>
          <!-- <div class="absolute -right-1 -bottom-1 px-2 py-0.5 bg-indigo-100 rounded-md">
            <span class="text-xs font-medium text-indigo-700">Insured</span>
          </div> -->
        </div>
      </template>

      <!-- Number of Dependants -->
      <template v-else-if="key === 'numberOfDependants'">
        <div class="relative">
          <div class="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-full border border-fuchsia-100">
            <span class="text-base font-bold text-fuchsia-700">
              {{ Number(row.numberOfDependants) || 0 }}
            </span>
          </div>
        </div>
      </template>

      <!-- Default cell content -->
      <template v-else>
        <div class="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <span class="text-sm text-gray-700">{{ row[key] }}</span>
        </div>
      </template>
    </td>

    <!-- Actions Dropdown -->
    <td class="p-4">
      <div class="relative">
        <!-- Action button -->
        <button 
          @click.stop="toggleDropdown($event, row.serviceQuotedUuid)"
          aria-label="Actions"
          class="p-2 rounded-lg transition-all hover:bg-blue-100 hover:scale-105"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-600 transition-colors hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div 
          :id="`dropdown-${row.serviceQuotedUuid}`"
          class="hidden absolute right-0 z-50 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl dropdown-menu"
        >
          <!-- Dropdown header -->
          <div class="px-4 py-3 border-b border-gray-100">
            <div class="flex gap-3 items-center">
              <div class="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <span class="text-xs font-bold text-white">P</span>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ row.planType || 'Plan' }}</p>
                <p class="text-xs text-gray-500">Action Menu</p>
              </div>
            </div>
          </div>

          <!-- Dropdown items -->
          <div class="py-2">
            <!-- Edit Button -->
            <button 
              @click.stop="handleEditWithClose(row)" 
              class="flex gap-3 items-center px-4 py-3 w-full text-gray-700 transition-colors hover:bg-blue-50 group/item"
            >
              <div class="p-1.5 bg-blue-100 rounded-md group-hover/item:bg-blue-200">
                <i v-html="icons.edits || '✏️'" class="w-4 h-4 text-blue-600" />
              </div>
              <div class="text-left">
                <span class="text-sm font-medium">Edit</span>
                <p class="text-xs text-gray-500">Modify plan details</p>
              </div>
              <svg class="ml-auto w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Add Insured Person -->
            <button 
              @click.stop="handleViewWithClose(row)" 
              class="flex gap-3 items-center px-4 py-3 w-full text-gray-700 transition-colors hover:bg-emerald-50 group/item"
            >
              <div class="p-1.5 bg-emerald-100 rounded-md group-hover/item:bg-emerald-200">
                <i v-html="icons.details || '➕'" class="w-4 h-4 text-emerald-600" />
              </div>
              <div class="text-left">
                <span class="text-sm font-medium">Add Insured</span>
                <p class="text-xs text-gray-500">Add new insured person</p>
              </div>
              <svg class="ml-auto w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <!-- Divider -->
            <div class="my-2 h-px bg-gray-200"></div>

            <!-- Deactivate Button -->
            <button 
              @click.stop="handleRemoveWithClose(row.serviceQuotedUuid)" 
              class="flex gap-3 items-center px-4 py-3 w-full text-red-600 transition-colors hover:bg-red-50 group/item"
            >
              <div class="p-1.5 bg-red-100 rounded-md group-hover/item:bg-red-200">
                <i v-html="icons.deactivate || '🚫'" class="w-4 h-4 text-red-600" />
              </div>
              <div class="text-left">
                <span class="text-sm font-semibold">Deactivate</span>
                <p class="text-xs text-red-500">Disable this plan</p>
              </div>
              <svg class="ml-auto w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Dropdown footer -->
          <div class="px-4 py-2 bg-gray-50 rounded-b-xl border-t border-gray-100">
            <p class="text-xs text-gray-500">ID: {{ row.serviceQuotedUuid?.slice(-8) || 'N/A' }}</p>
          </div>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.dropdown-menu {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top right;
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
  pointer-events: none;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

/* Subtle scale on button hover */
button {
  transition: all 0.2s ease;
}

/* Row hover effect */
tr {
  transition: all 0.2s ease;
}

tr:hover {
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

/* Smooth icon transitions */
i {
  transition: transform 0.2s ease;
}

.group:hover i {
  transform: scale(1.05);
}
</style>