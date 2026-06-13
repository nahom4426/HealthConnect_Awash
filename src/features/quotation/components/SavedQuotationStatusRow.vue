<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import icons from "@/utils/icons";

const router = useRouter();

const props = defineProps({
  rowData: {
    type: Array,
    required: true,
  },
  rowKeys: {
    type: Array,
    required: true,
  },
  headKeys: {
    type: Array,
    required: true,
  },
  cells: {
    type: Object,
    default: () => ({}),
  },
  onRowClick: {
    type: Function,
    default: () => {},
  },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  isMobile: { type: Boolean, default: false },
});

function getStatusStyle(status: any) {
  const base = "inline-flex items-center justify-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold";

  switch (String(status || '').toUpperCase()) {
    case 'APPROVED':
    case 'ACTIVE':
    case 'ACCEPTED':
      return `${base} bg-green-100 text-green-800`;
    case 'PENDING':
    case 'SUBMITTED':
    case 'SUSPENDED':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'INACTIVE':
    case 'REJECTED':
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function toggleDropdown(event: MouseEvent, rowId: any) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach((el) => {
    el.classList.add('hidden');
  });
}

function handleViewWithClose(row: any) {
  closeAllDropdowns();

  const quotationUuid = row?.quotationUuid;
  const institutionId = row?.institutionId ?? row?.institutionId ?? row?.institutionUuid;

  if (!quotationUuid) return;

  router.push({
    name: 'ViewSavedQuotation',
    params: {
      quotationUuid,
      institutionId,
    },
  });
}

function formatCellValue(key: string, row: any) {
  if (props.cells && typeof (props.cells as any)[key] === 'function') {
    return (props.cells as any)[key](row?.[key], row);
  }

  return row?.[key];
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
    v-for="(row, idx) in (rowData as any[] || []).filter((r: any) => r !== null)"
    :key="idx"
    @click.self="onRowClick(row)"
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
  >
    <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key as any">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle((row as any)?.status)">
          {{ (row as any)?.status }}
        </span>
      </div>

      <span v-else class="text-gray-700">
        {{ formatCellValue(key as any, row) }}
      </span>
    </td>

  <td
    class="p-3 text-start"
    v-if="headKeys.includes('Actions') || headKeys.includes('actions')"
  >
    <button
      :id="`detail-btn-${(row as any)?.quotationUuid || (row as any)?.id}`"
      @click.stop="handleViewWithClose(row)"
      class="inline-flex gap-1.5 items-center px-3.5 py-1.5 text-xs font-semibold rounded-full border shadow-sm transition-all duration-150 outline-none text-primary bg-primary/5 hover:bg-primary hover:text-white border-primary/20 hover:border-primary"
    >
      <i v-html="icons.eye" class="" />
      <span>Detail</span>
    </button>
  </td>

  </tr>
</template>
