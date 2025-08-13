<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { openModal } from '@customizer/modal-x';
import { useApiRequest } from '@/composables/useApiRequest';
import { updatePackage } from '../api/coverageApi';
import { useCoverage } from '../store/coverageStore';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, default: () => [] },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} }
});

const coverageStore = useCoverage();
const { addToast } = useToast();
const statusApi = useApiRequest();

function getStatusStyle(status) {
  const base = "px-3 py-1 rounded-full text-xs font-medium";
  switch (status?.toUpperCase()) {
    case "ACTIVE": return `${base} bg-green-100 text-green-800`;
    case "INACTIVE": return `${base} bg-red-100 text-red-800`;
    default: return `${base} bg-gray-100 text-gray-800`;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB'
  }).format(amount);
}

function handleEdit(packageData) {
  openModal('EditPackage', { data: { ...packageData } });
}

function handleAddServices(packageData) {
  openModal('AddServicesToPackage', {
    packageUuid: packageData.packageUuid,
    packageName: packageData.packageName
  });
}

function toggleStatus(packageData) {
  const newStatus = packageData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  statusApi.send(
    () => updatePackage(packageData.packageUuid, { ...packageData, status: newStatus }),
    (response) => {
      if (response.success) {
        coverageStore.updatePackage(packageData.packageUuid, { status: newStatus });
        addToast(`Package ${newStatus.toLowerCase()} successfully`, '', 'success');
      }
    }
  );
}

function handleDelete(packageData) {
  openModal('DeletePackage', { ...packageData });
}

function getPackageCount(services) {
  if (Array.isArray(services)) return services.length;
  if (services && typeof services === 'object') return Object.keys(services).length;
  return 0;
}

function toggleDropdown(event, id) {
  event.stopPropagation();
  closeAllDropdowns();
  const el = document.getElementById(`dropdown-${id}`);
  if (el) el.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
}

onMounted(() => window.addEventListener('click', closeAllDropdowns));
onUnmounted(() => window.removeEventListener('click', closeAllDropdowns));
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row.packageUuid"
    class="bg-white border-b hover:bg-gray-50 transition-colors duration-150 ease-in-out"
    @click="props.onRowClick(row)"
  >
    <td class="p-4 font-medium text-gray-500">{{ idx + 1 }}</td>
    <td
      class="p-3 py-4"
      v-for="key in rowKeys.slice(1)"
      :key="key"
    >
      <div v-if="key === 'status'">
        <span :class="getStatusStyle(row.status)">{{ row.status }}</span>
      </div>
      <div v-else-if="key === 'minLimit' || key === 'maxLimit'">
        {{ formatCurrency(row[key]) }}
      </div>
      <div v-else-if="key === 'gender'">
        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {{ row[key] }}
        </span>
      </div>
      <div v-else-if="key === 'packageEligibleServices'">
        <span class="text-gray-700">
          {{ getPackageCount(row[key]) }} service(s)
        </span>
      </div>
      <div v-else>
        {{ row[key] }}
      </div>
    </td>

    <td class="p-3 py-4 relative text-left">
      <button
        @click.stop="toggleDropdown($event, row.packageUuid)"
        class="p-2 rounded-full hover:bg-gray-200"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      <div :id="`dropdown-${row.packageUuid}`" class="dropdown-menu hidden absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
        <div class="py-1">
          <button @click.stop="handleAddServices(row)" class="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700">
            <i v-html="icons.plus_circle || '➕'" class="w-5 h-5"></i> Add Services
          </button>
          <button @click.stop="handleEdit(row)" class="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700">
            <i v-html="icons.edit || '✏️'" class="w-5 h-5"></i> Edit
          </button>
          <button @click.stop="toggleStatus(row)" class="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-green-100 hover:text-green-700">
            <i v-html="row.status === 'ACTIVE' ? (icons.ban || '🚫') : (icons.check || '✅')" class="w-5 h-5"></i>
            {{ row.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
          </button>
          <button @click.stop="handleDelete(row)" class="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-100">
            <i v-html="icons.delete || '🗑️'" class="w-5 h-5"></i> Delete
          </button>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.dropdown-menu {
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
.dropdown-menu button:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}
.dropdown-menu button.text-red-600:hover {
  background-color: #fef2f2;
  color: #dc2626;
}
</style>