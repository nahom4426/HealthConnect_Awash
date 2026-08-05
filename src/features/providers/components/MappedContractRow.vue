<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { openModal } from '@customizer/modal-x';
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { useRoute, useRouter } from 'vue-router';

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
  onRefetch: {
    type: Function,
    default: () => {}
  },
  selectedUuids: {
    type: Set,
    default: () => new Set()
  },
  selectionKey: {
    type: String,
    default: 'mapContractUuid'
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

const emit = defineEmits(['toggle-selection']);

function toggleRow(row) {
  const key = row[props.selectionKey];
  if (key) {
    emit('toggle-selection', key);
  }
}
const router = useRouter();
const route = useRoute();
const { addToast } = useToast();

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}
const id = route.params.id;
const institutionUuid = route.params.institutionUuid;
console.log(route.params);


function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";

  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-green-100 text-green-800`;
    case "INACTIVE":
      return `${base} bg-red-100 text-red-800`;
    case "PENDING":
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function handleRemove(row) {
  closeAllDropdowns();
  openModal(
    'ConfirmRemoveMapContract',
    {
      contractName: row.payerProviderContractName,
      providerName: row.providerName,
      mapContractUuid: row.mapContractUuid,
    },
    (res) => {
      if (res?.success) {
        props.onRefetch();
      }
    }
  );
}
function handleRemovecatagories(row) {
  router.push(`/removeServiceCatagories/${route.params.id}/${route.params.institutionUuid}/${row?.payerProviderContractUuid}`);
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function handleDocumentClick(event) {
  if (event.target.closest('.dropdown-container')) return;
  closeAllDropdowns();
}
</script>

<template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="idx"
    @click="toggleRow(row)"
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50 cursor-pointer"
    :class="{ 'bg-red-50': selectedUuids.has(row[selectionKey]) }"
  >  
    <!-- Checkbox -->
    <td class="px-4 py-3" @click.stop>
      <input
        type="checkbox"
        :checked="selectedUuids.has(row[selectionKey])"
        @change="toggleRow(row)"
        class="w-4 h-4 text-red-600 rounded border-gray-300 cursor-pointer focus:ring-red-500"
      />
    </td>
    <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>  

    <!-- Data Columns -->
    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
      <div v-if="key === 'status'" class="truncate">  
        <span 
          class="px-2.5 py-1 text-xs font-medium rounded-full"
          :class="getStatusStyle(row.status)"
        >
          {{ row.status }}
        </span>
      </div>
      
      <div v-else-if="key === 'providerName'" class="text-gray-700">
        {{ row.providerName || "-" }}
      </div>

      <div v-else-if="key === 'payerProviderContractName'" class="text-gray-700">
        {{ row.payerProviderContractName || "-" }}
      </div>

      <div v-else-if="key === 'payerProviderContractCode'" class="text-gray-700">
        {{ row.payerProviderContractCode || "-" }}
      </div>
      
      <span v-else class="text-gray-700">
        {{ row[key] || "-" }}
      </span>
    </td>  

    <!-- Actions Column -->
    <td class="gap-2 p-3">
       <button
    @click.stop="handleRemovecatagories(row)"
    class="inline-flex gap-2 items-center px-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100"
  >
    <i v-html="icons.trash" class="text-blue-600"></i>
  Service Catagoties
  </button>
  <button
    @click.stop="handleRemove(row)"
    class="inline-flex gap-2 items-center px-1 py-2 mx-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100"
  >
    <i v-html="icons.trash" class="text-red-600"></i>
    Remove Provider
  </button>
</td>

  </tr>
</template>

<style scoped>
.dropdown-container {
  min-width: 80px;
}

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
</style>
