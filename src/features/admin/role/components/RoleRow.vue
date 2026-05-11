<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import icons from '@/utils/icons';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  cells: { type: Object, default: () => ({}) },
  rowData: { type: Array, required: true, default: () => [] },
  rowKeys: { type: Array, required: true, default: () => ['roleName', 'roleDescription', 'rolePrivileges'] },
  headKeys: { type: Array, required: false, default: () => ['#', 'Role Name', 'Description', 'Privileges', 'Actions'] },
  isMobile: { type: Boolean, default: false },
  onRowClick: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onDetail: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

function getPrivilegeCount(row) {
  // Handle both array and number cases
  if (typeof row.rolePrivileges === 'number') {
    return row.rolePrivileges;
  }
  return row.rolePrivileges?.length || 0;
}

function getPrivilegeList(row) {
  // Handle both array and number cases
  if (typeof row.rolePrivileges === 'number') {
    return [];
  }
  return row.rolePrivileges || [];
}

function handleEditWithClose(row) {
  closeAllDropdowns();
  handleEdit(row);
}

function handleDeleteWithClose(row) {
  closeAllDropdowns();
  handleDelete(row);
}

function handleDetailWithClose(row) {
  closeAllDropdowns();
  handleDetail(row);
}

function handleEdit(row) {
  const fn = props.cells?.onEdit || props.onEdit;
  fn(row);
}

function handleDelete(row) {
  const fn = props.cells?.onDelete || props.onDelete;
  fn(row);
}

function handleDetail(row) {
  const fn = props.cells?.onDetail || props.onDetail;
  fn(row);
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});

function getCategoryColor(category) {
  const colors = {
    claim_attachment: 'from-blue-500 to-cyan-600',
    dependent: 'from-purple-500 to-pink-600',
    insured: 'from-green-500 to-emerald-600',
    payer: 'from-orange-500 to-red-600',
    provider_contract: 'from-indigo-500 to-blue-600',
    package: 'from-violet-500 to-purple-600',
    default: 'from-gray-500 to-slate-600'
  };
  return colors[category] || colors.default;
}
</script>

<template>
  <!-- Desktop Table Rows -->
  <template v-if="!isMobile">
    <template v-for="(row, idx) in rowData.filter(r => r !== null)" :key="row?.roleUuid || idx">
      <!-- Desktop Table Row -->
      <tr
        @click.self="onRowClick(row)"
        class="bg-white border-b transition-all duration-150 ease-in-out hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
      >
      <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

      <!-- Role Name -->
      <td class="px-4 py-4">
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-900">{{ row.roleName }}</span>
          <!-- <span class="text-xs text-gray-500">{{ row.roleUuid }}</span> -->
        </div>
      </td>

      <!-- Role Description -->
      <td class="px-4 py-4">
        <span class="text-sm text-gray-700 line-clamp-2">{{ row.roleDescription || '—' }}</span>
      </td>

      <!-- Privileges Count with Tooltip -->
      <td class="relative px-4 py-4">
        <div class="inline-block relative group">
          <span class="inline-flex gap-2 items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md transition-shadow cursor-help hover:shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {{ getPrivilegeCount(row) }}
          </span>

          <!-- Hover Tooltip - Attractive design with animations -->
          <div v-if="getPrivilegeList(row).length > 0" class="hidden absolute top-full left-1/2 z-[9999] p-5 mt-3 w-96 text-left bg-white rounded-2xl border border-gray-200 shadow-2xl transform -translate-x-1/2 group-hover:block pointer-events-auto backdrop-blur-sm">
            <!-- Tooltip Header -->
            <div class="flex justify-between items-center pb-3 mb-4 border-b-2 border-gray-100">
              <div class="flex gap-2 items-center">
                <div class="p-2 bg-indigo-100 rounded-lg">
                  <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-gray-900">Assigned Privileges</h4>
                  <p class="text-xs text-gray-500">{{ getPrivilegeCount(row) }} permission{{ getPrivilegeCount(row) !== 1 ? 's' : '' }}</p>
                </div>
              </div>
              <span class="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full">{{ getPrivilegeCount(row) }}</span>
            </div>
            
            <!-- Privileges List -->
            <div class="overflow-y-auto space-y-2 max-h-72">
              <div
                v-for="(privilege, i) in getPrivilegeList(row)"
                :key="privilege.privilegeUuid || i"
                class="p-3 bg-gradient-to-r rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-md hover:border-indigo-300"
                :class="getCategoryColor(privilege.privilegeCategory)"
              >
                <div class="flex gap-3 items-start">
                  <div class="flex-shrink-0 mt-1">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-white truncate">{{ privilege.privilegeName }}</div>
                    <div class="text-[11px] text-white/90 line-clamp-2 mt-1">{{ privilege.privilegeDescription }}</div>
                    <div class="text-[10px] text-white/70 mt-2 uppercase tracking-wider font-semibold inline-block bg-white/20 px-2 py-0.5 rounded">{{ privilege.privilegeCategory }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty State Tooltip -->
          <div v-else class="hidden absolute top-full left-1/2 z-[9999] p-4 mt-3 w-80 text-left bg-white rounded-2xl border border-gray-200 shadow-2xl transform -translate-x-1/2 group-hover:block pointer-events-auto">
            <div class="py-4 text-center">
              <div class="flex justify-center items-center p-3 mx-auto mb-3 w-12 h-12 bg-gray-100 rounded-full">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <p class="text-sm font-semibold text-gray-600">No privileges assigned</p>
              <p class="mt-1 text-xs text-gray-500">This role has no permissions yet</p>
            </div>
          </div>
        </div>
      </td>

      <!-- Actions -->
      <td class="px-4 py-4">
        <div class="flex flex-wrap gap-2 justify-start items-center">
          <!-- <button
            @click.stop.prevent="handleDetailWithClose(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm"
            title="View Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Detail</span>
          </button> -->

          <button
            @click.stop.prevent="handleEditWithClose(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-200 transition-all duration-200 hover:bg-indigo-100 hover:shadow-sm"
            title="Edit Role"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
            <span>Edit</span>
          </button>
<!-- 
          <button
            @click.stop.prevent="handleDeleteWithClose(row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl border border-red-200 transition-all duration-200 hover:bg-red-100 hover:shadow-sm"
            title="Delete Role"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span>Delete</span>
          </button> -->
        </div>
      </td>
      </tr>
    </template>
  </template>

  <!-- Mobile Card Layout -->
  <template v-else>
    <template v-for="(row, idx) in rowData.filter(r => r !== null)" :key="row?.roleUuid || idx">
      <!-- Mobile Card View -->
      <div
        class="p-2 mx-1 mb-2 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md"
        @click="onRowClick(row)"
      >
      <div class="space-y-2">
        <!-- Header with Role Name -->
        <div class="flex gap-2 justify-between items-start">
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-gray-900 truncate">{{ row.roleName }}</h3>
            <!-- <p class="mt-0.5 text-xs text-gray-500 truncate">{{ row.roleUuid }}</p> -->
          </div>
          <span class="inline-flex flex-shrink-0 gap-1 items-center px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {{ getPrivilegeCount(row) }}
          </span>
        </div>

        <!-- Description -->
        <div>
          <p class="mb-1 text-xs font-semibold tracking-wide text-gray-600 uppercase">Description</p>
          <p class="text-sm text-gray-700 line-clamp-2">{{ row.roleDescription || '—' }}</p>
        </div>

        <!-- Privileges Preview -->
        <div>
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase">Privileges</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="(privilege, i) in getPrivilegeList(row).slice(0, 3)"
              :key="privilege.privilegeUuid || i"
              class="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r rounded-full shadow-sm"
              :class="getCategoryColor(privilege.privilegeCategory)"
            >
              {{ privilege.privilegeName }}
            </span>
            <span
              v-if="getPrivilegeCount(row) > 3"
              class="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full"
            >
              +{{ getPrivilegeCount(row) - 3 }} more
            </span>
          </div>
        </div>

        <!-- Mobile Actions -->
        <div class="flex flex-col gap-1 pt-2 border-t border-gray-100 sm:flex-row">
          <!-- Detail Button -->
          <button
            @click.stop.prevent="handleDetailWithClose(row)"
            class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-200 transition-all duration-200 hover:bg-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Detail</span>
          </button>

          <!-- Edit Button -->
          <button
            @click.stop.prevent="handleEditWithClose(row)"
            class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md border border-indigo-200 transition-all duration-200 hover:bg-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
            <span>Edit</span>
          </button>

          <!-- Delete Button -->
          <button
            @click.stop.prevent="handleDeleteWithClose(row)"
            class="flex flex-1 gap-1 justify-center items-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md border border-red-200 transition-all duration-200 hover:bg-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
      </div>
    </template>
  </template>
</template>

<style scoped>
/* Smooth scrollbar for privilege tooltip */
div::-webkit-scrollbar {
  width: 6px;
}

div::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

div::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

div::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Line clamp for older browsers */
.line-clamp-2 {
  display: -webkit-box;
  display: -moz-box; /* For Firefox */
  -webkit-line-clamp: 2;
  line-clamp: 2; /* Standard property */
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical; /* For Firefox */
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
