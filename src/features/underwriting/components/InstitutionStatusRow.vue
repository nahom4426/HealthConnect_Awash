<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onStatusChange: { type: Function, default: () => {} }, // new for activate/deactivate
});

const router = useRouter();

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-green-100 text-green-800`;
    case "INACTIVE":
      return `${base} bg-red-100 text-red-800`;
    case "PENDING":
    case "SUSPENDED":
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function handleEdit(row) {
  openModal('EditInstitution', {
    institutionUuid: row.institutionUuid,
    institution: row,
  });
}

function handleStatusChange(row) {
  const newStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  openModal('ChangeInstitutionStatus', {
    institutionUuid: row.institutionUuid,
    newStatus,
    currentStatus: row.status
  });
}

function toggleDropdown(event, uuid) {
  event.stopPropagation();
  closeAllDropdowns();
  document.getElementById(`dropdown-${uuid}`)?.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.add('hidden');
  });
}

onMounted(() => window.addEventListener("click", closeAllDropdowns));
onUnmounted(() => window.removeEventListener("click", closeAllDropdowns));
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row.institutionUuid || idx"
    class="bg-white border-b hover:bg-blue-50 transition-colors cursor-pointer"
  >
    <!-- Index -->
    <td class="p-4 font-semibold text-gray-600 select-none">{{ idx + 1 }}</td>

    <!-- Data Columns -->
    <td v-for="key in rowKeys" :key="key" class="p-4 text-gray-700 whitespace-nowrap">
      <span v-if="key === 'status'" :class="getStatusStyle(row.status)">
        {{ row.status }}
      </span>
      <span v-else>
        {{ row[key] || '—' }}
      </span>
    </td>

    <!-- Action Dropdown -->
    <td class="p-4 relative">
      <button
        @click.stop="toggleDropdown($event, row.institutionUuid)"
        aria-label="Actions"
        class="p-2 rounded-full hover:bg-gray-200 transition-colors"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
        </svg>
      </button>

      <div
        :id="`dropdown-${row.institutionUuid}`"
        class="dropdown-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20"
      >
        <div class="py-1">
          <!-- View Policy -->
          <button
            @click.stop="$router.push('/institution_contracts/' + row.institutionUuid)"
            class="dropdown-item"
          >
            <i v-html="icons.eye || '👁️'" class="w-4 h-4" /> View Policy
          </button>

          <!-- Edit Institution -->
          <button
            @click.stop="handleEdit(row)"
            class="dropdown-item"
          >
            <i v-html="icons.edit || '✏️'" class="w-4 h-4" /> Edit Institution
          </button>

          <!-- Activate / Deactivate -->
          <button
            @click.stop="handleStatusChange(row)"
            class="dropdown-item"
            :class="row.status === 'ACTIVE' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'"
          >
            <i v-html="row.status === 'ACTIVE' ? (icons.delete || '🛑') : (icons.add || '✅')" class="w-4 h-4" />
            {{ row.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
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
