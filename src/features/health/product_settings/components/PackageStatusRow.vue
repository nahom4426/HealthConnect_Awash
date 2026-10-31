<script setup>
import { defineProps, onMounted, onUnmounted, computed } from 'vue';
import { openModal } from '@customizer/modal-x';
import { useApiRequest } from '@/composables/useApiRequest';
import { updatePackage } from '../api/coverageApi';
import { useCoverage } from '../store/coverageStore';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
const router = useRouter();
const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, default: () => [] },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onDelete: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

const coverageStore = useCoverage();
const { addToast } = useToast();
const statusApi = useApiRequest();
const authStore = useAuthStore();

const canManageQuotation = computed(() => {
  const user = authStore.auth?.user;
  const roleName = user?.roleName;
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  const effectivePrivileges = privileges
    .filter(Boolean)
    .map((p) => String(p).trim());

  return (
    roleName === 'Super Admin' ||
    effectivePrivileges.includes('All Privileges') ||
    effectivePrivileges.includes('ROLE_Manages_Quotation') ||
    effectivePrivileges.includes('Manages_Quotation')
  );
});

const packageNameByUuid = computed(() => {
  const map = new Map();
  for (const p of (props.rowData || [])) {
    if (p?.packageUuid) {
      map.set(p.packageUuid, p.packageName);
    }
  }
  return map;
});

function getSharedFromLabel(row) {
  const uuid = row?.benefit_pooling_from;
  if (!uuid) return null;
  return packageNameByUuid.value.get(uuid) || uuid;
}

function getStatusStyle(status) {
  const base = "px-3 py-1 rounded-full text-xs font-medium";
  switch (status?.toUpperCase()) {
    case "ACTIVE": return `${base} bg-success-soft text-success-strong`;
    case "SUSPENDED": return `${base} bg-error-soft text-error-strong`;
    default: return `${base} bg-surface-muted text-ink`;
  }
}

function getAllServicesStyle(allServices) {
  const base = "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1";
  return allServices 
    ? `${base} bg-purple-100 text-purple-800`
    : `${base} bg-surface-muted text-ink-muted`;
}

function getBooleanBadgeStyle(value) {
  const base = "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1";
  return value ? `${base} bg-success-soft text-success-strong` : `${base} bg-surface-muted text-ink-muted`;
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
  openModal('AddServiceToContractPackage', {
    packageUuid: packageData.packageUuid,
    packageName: packageData.packageName
  });
}
function handleRemoveServices(packageData) {
  openModal('RemoveServiceFromContractPackage', {
    packageUuid: packageData.packageUuid,
    packageName: packageData.packageName
  });
}

function toggleStatus(packageData) {
  const newStatus = packageData.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  statusApi.send(
    () => updatePackage(packageData.packageUuid, { ...packageData, status: newStatus }),
    (response) => {
      if (response.success) {
        coverageStore.updatePackage(packageData.packageUuid, { status: newStatus });
        toasted(response.success, `Package ${newStatus.toLowerCase()} successfully`, response.error);
      } else {
        // toasted(false, "", response.error || "Failed to update package");
      }
    }
  );
}
function handleShowRate(packageData) {
  closeAllDropdowns()
  router.push({ 
    name: 'show-rates', 
    params: { 
      packageUuid: packageData.packageUuid
    },
    query: {
      packageName: packageData.packageName || ''
    }
  })
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
    class="bg-white border-b border-line transition-all duration-200 ease-in-out hover:bg-primary/5 hover:shadow-sm"
    @click="props.onRowClick(row)"
  >
    <td class="p-4 w-12 font-semibold text-ink-subtle text-start">
      <span class="inline-flex justify-center items-center w-6 h-6 text-xs font-bold text-black bg-gradient-to-br from-white to-line rounded-full">
        {{ idx + 1 }}
      </span>
    </td>
    <td
      class="p-3 py-4"
      v-for="key in rowKeys.slice(1)"
      :key="key"
    >
      <!-- Status Badge -->
      <div v-if="key === 'status'">
        <span :class="getStatusStyle(row.status)">{{ row.status }}</span>
      </div>

      <!-- Boolean badges (Benefit Pooling / Exclusive Benefit) -->
    <div v-else-if="key === 'benefit_pooling' || key === 'exclusive_benefit'">
  <div class="flex flex-col gap-1.5">
    <!-- Modern toggle-style badge -->
    <div class="flex gap-2 items-center">
      <div 
        :class="[
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
          row[key] 
            ? 'bg-success-soft text-success-strong ring-1 ring-success/10' 
            : 'bg-surface-muted text-ink-muted ring-1 ring-line/50'
        ]"
      >
        <!-- Animated icon -->
        <div :class="['transition-transform', row[key] ? 'scale-100' : 'scale-90']">
          <svg 
            v-if="row[key]" 
            class="w-3.5 h-3.5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fill-rule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clip-rule="evenodd" 
            />
          </svg>
          <svg 
            v-else 
            class="w-3.5 h-3.5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fill-rule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clip-rule="evenodd" 
            />
          </svg>
        </div>
        <span>{{ row[key] ? 'Enabled' : 'Disabled' }}</span>
      </div>
      
      <!-- Optional: Add a small indicator for exclusive_benefit -->
      <span 
        v-if="key === 'exclusive_benefit' && row[key]"
        class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200/50"
      >
        Exclusive
      </span>
    </div>

    <!-- Modern card-style sharing info -->
    <div
      v-if="key === 'benefit_pooling' && row.benefit_pooling && row.benefit_pooling_from"
      class="flex items-center gap-1.5 text-[11px]"
    >
      <!-- Decorative line/arrow -->
      <div class="flex items-center text-line-strong">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      
      <!-- Source badge with modern styling -->
      <span class="text-ink-subtle">Shares from:</span>
      <div class="inline-flex gap-1 items-center px-2 py-0.5 text-primary-hover bg-primary/5 rounded-md ring-1 ring-primary/10">
        <!-- Small package icon -->
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span class="font-medium">{{ getSharedFromLabel(row) }}</span>
      </div>
    </div>
  </div>
</div>
      
      <!-- Gender Badge -->
      <div v-else-if="key === 'gender'">
        <span class="px-3 py-1 text-xs font-medium text-primary-hover bg-primary/10 rounded-full">
          {{ row[key] }}
        </span>
      </div>
      
      <!-- All Services Badge -->
      <div v-else-if="key === 'allServices'">
        <span :class="getAllServicesStyle(row[key])">
          <svg v-if="row[key]" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          {{ row[key] ? 'All Services' : 'Limited' }}
        </span>
      </div>
      
      <!-- Package Services Count -->
      <div v-else-if="key === 'packageEligibleServices'">
        <span class="inline-flex gap-2 items-center px-3 py-1 text-xs font-medium text-primary-hover bg-primary/10 rounded-full">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h-3a1 1 0 000-2 2 2 0 00-2-2H4zm9.6 5.2a1 1 0 00-1.4-1.4L9 10.4l-1.2-1.2a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clip-rule="evenodd" />
          </svg>
          {{ getPackageCount(row[key]) }} service(s)
        </span>
      </div>
      
      <!-- Default Text -->
      <div v-else class="text-ink-muted">
        {{ row[key] }}
      </div>
    </td>

<td class="px-4 py-3">
  <div class="flex gap-1.5 items-center">
    <!-- Services Button -->
    <button
      @click.stop="handleAddServices(row)"
      class="relative p-2 text-primary bg-primary/5 rounded-lg transition-all duration-200 group hover:bg-primary/10 hover:text-primary-hover hover:scale-105 hover:shadow-md"
      title="Manage Services"
    >
      <i v-html="icons.briefcase || '💼'" class="w-4 h-4"></i>
      <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-ink rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
        Services
      </span>
    </button>

    <!-- Show Rate Button (if canManageQuotation) -->
    <button
      @click.stop="handleShowRate(row)"
      class="relative p-2 text-primary bg-primary/5 rounded-lg transition-all duration-200 group hover:bg-primary/10 hover:text-primary-hover hover:scale-105 hover:shadow-md"
      title="Show Rate"
    >
      <i v-html="icons.dollar || icons.coins || '💰'" class="w-4 h-4"></i>
      <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-ink rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
        Show Rate
      </span>
    </button>

    <!-- Edit Button -->
    <button
      @click.stop="handleEdit(row)"
      class="relative p-2 text-warning bg-warning-soft rounded-lg transition-all duration-200 group hover:bg-warning-soft hover:text-warning-strong hover:scale-105 hover:shadow-md"
      title="Edit Package"
    >
      <i v-html="icons.edit || '✏️'" class="w-4 h-4"></i>
      <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-ink rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
        Edit
      </span>
    </button>

    <!-- Activate/Deactivate Button -->
    <button
      @click.stop="toggleStatus(row)"
      class="relative p-2 rounded-lg transition-all duration-200 group hover:scale-105 hover:shadow-md"
      :class="
        row.status === 'ACTIVE' 
          ? 'bg-error-soft hover:bg-error-soft text-error hover:text-error-strong' 
          : 'bg-success-soft hover:bg-success-soft text-success hover:text-success-strong'
      "
      :title="row.status === 'ACTIVE' ? 'Deactivate Package' : 'Activate Package'"
    >
      <i v-html="row.status === 'ACTIVE' ? (icons.ban || '🚫') : (icons.check_circle || '✅')" class="w-4 h-4"></i>
      <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-ink rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
        {{ row.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
      </span>
    </button>

    <!-- More Options Dropdown (if needed for additional actions) -->
    <div v-if="hasMoreActions" class="relative">
      <button
        @click.stop="toggleDropdown($event, row.packageUuid)"
        class="relative p-2 text-ink-muted bg-surface-muted rounded-lg transition-all duration-200 group hover:bg-surface-muted hover:text-ink-muted hover:scale-105 hover:shadow-md"
        title="More options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
        <span class="absolute -top-8 left-1/2 px-2 py-1 text-xs font-medium text-white whitespace-nowrap bg-ink rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none group-hover:opacity-100">
          More
        </span>
      </button>

      <!-- Dropdown Menu for extra options -->
      <div 
        :id="`dropdown-${row.packageUuid}`" 
        class="hidden overflow-hidden absolute right-0 z-30 mt-2 w-48 bg-white rounded-xl border border-line ring-1 ring-black ring-opacity-5 shadow-xl dropdown-menu"
      >
        <div class="py-1">
          <!-- Additional actions can go here -->
          <button
            @click.stop="handleDuplicate(row)"
            class="flex gap-3 items-center px-4 py-2.5 w-full text-sm text-ink-muted transition-colors hover:bg-surface-muted"
          >
            <i v-html="icons.copy || '📋'" class="w-4 h-4 text-ink-subtle"></i>
            <span>Duplicate</span>
          </button>
          <button
            @click.stop="handleExport(row)"
            class="flex gap-3 items-center px-4 py-2.5 w-full text-sm text-ink-muted transition-colors hover:bg-surface-muted"
          >
            <i v-html="icons.download || '⬇️'" class="w-4 h-4 text-ink-subtle"></i>
            <span>Export</span>
          </button>
        </div>
      </div>
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
  transform: scale(0.95) translateY(-4px);
  pointer-events: none;
  border-radius: 0.5rem;
  overflow: hidden;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

/* Smooth row transitions */
tr {
  cursor: pointer;
}

tr:hover td {
  background-color: inherit;
}

/* Badge styling */
span[class*="bg-"] {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.flex-col {
  transition: all 0.2s ease;
}

.ring-1 {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* Optional hover effect for badges */
.inline-flex:hover {
  filter: brightness(0.98);
}
</style>