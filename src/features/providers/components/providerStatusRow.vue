<script setup>
import { defineProps, defineEmits, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { openModal } from '@customizer/modal-x'
import { useAddProviders } from "@/features/providers/store/AddprovidersStore"
import { useToast } from '@/toast/store/toast'
import icons from "@/utils/icons"

// ----- Props -----
const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onActivate: { type: Function, default: () => {} },
  onDeactivate: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  cells: { type: Array, default: () => [] },
  isMobile: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
})

// ----- Emits -----
const emit = defineEmits(['row', 'remove'])

// ----- Stores -----
const { addToast } = useToast()
const providersStore = useAddProviders()
const { providers: storeProviders } = storeToRefs(providersStore)

// ----- Dropdown Handling -----
function toggleDropdown(event, rowId) {
  event.stopPropagation()
  closeAllDropdowns()
  const dropdown = document.getElementById(`dropdown-${rowId}`)
  if (dropdown) dropdown.classList.toggle('hidden')
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu')
    .forEach(el => el.classList.add('hidden'))
}

// ----- Status Style -----
function getStatusStyle(status) {
  const base =
    "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold"

  switch (status && status.toUpperCase()) {
    case "APPROVED":
    case "ACTIVE": return `${base} bg-green-100 text-green-800`
    case "SUBMITTED":
    case "PENDING":
    case "SUSPENDED": return `${base} bg-yellow-100 text-yellow-800`
    case "INACTIVE":
    case "REJECTED": return `${base} bg-red-100 text-red-800`
    case "ACCEPTED": return `${base} bg-blue-100 text-blue-800`
    case "RESUBMITTED": return `${base} bg-purple-100 text-purple-800`
    default: return `${base} bg-gray-100 text-gray-800`
  }
}

// ----- Helpers -----
function getBaseUrl() {
  return import.meta.env.VITE_API_URL
}

function handleImageError(event) {
  event.target.src = '/assets/placeholder-logo.png'
}

function handleEdit(row) {
  openModal('EditProvider', {
    providerUuid: row.providerUuid,
    provider: row,
    onUpdated: (updatedProvider) => {
      providersStore.update(updatedProvider.providerUuid, updatedProvider)
    }
  })
}

function handleEditWithClose(row) {
  closeAllDropdowns()
  handleEdit(row)
}

// ----- Document Click -----
function handleDocumentClick(event) {
  if (event.target.closest('.dropdown-container')) return
  closeAllDropdowns()
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onUnmounted(() => document.removeEventListener('click', handleDocumentClick))

</script>

<template>
  <tr v-for="(row, idx) in rowData" :key="idx" @click.self="props.onRowClick(row)"
      class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50">

    <!-- Index -->
    <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

    <!-- Dynamic Cells -->
    <td v-for="key in rowKeys" :key="key" class="p-3 py-4">
      <div v-if="key === 'status'" class="truncate">
        <span class="px-2.5 py-1 text-xs font-medium rounded-full" :class="getStatusStyle(row.status)">
          {{ row.status }}
        </span>
      </div>
      <div v-else-if="key === 'totalContracts'" class="truncate">
        <span class="text-gray-700">{{ row.totalContracts || 0 }}</span>
      </div>
      <div v-else-if="key === 'providerName'" class="flex gap-2.5 items-center text-gray-700">
        <div class="flex justify-center items-center">
          <img v-if="row.logoBase64" :src="row.logoBase64" alt="Provider Logo"
               class="object-contain w-10 h-10 rounded-full border border-gray-200" />
          <img v-else-if="row.logoUrl" :src="row.logoUrl" alt="Provider Logo"
               class="object-contain w-10 h-10 rounded-full border border-gray-200" @error="handleImageError" />
          <img v-else-if="row.logoPath" :src="`${getBaseUrl()}/provider/logo/${row.logoPath}`" alt="Provider Logo"
               class="object-contain w-10 h-10 rounded-full border border-gray-200" @error="handleImageError" />
          <div v-else class="flex justify-center items-center w-10 h-10 text-center bg-gray-200 rounded-full">
            <span class="text-xs text-gray-500">No Logo</span>
          </div>
        </div>
        <div>{{ row.providerName }}</div>
      </div>
      <span v-else class="text-gray-700">{{ row[key] }}</span>
    </td>

    <!-- Actions -->
    <td class="p-3">
      <div class="flex flex-wrap gap-2 justify-start items-center">
        <button @click.stop="handleEditWithClose(row)"
                class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm">
          <i v-html="icons.plus" class="text-blue-500" />
          <span>Add This Provider</span>
        </button>
      </div>
    </td>

  </tr>
</template>

<style scoped>
.dropdown-container { min-width: 80px; }
.dropdown-menu {
  min-width: 150%;
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
}
.debug-info { font-family: monospace; white-space: pre; }
</style>
