<script setup>
import { openModal } from "@customizer/modal-x";
import { useAuthorizationStore } from "../store/authorizationStore";

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
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
});

const store = useAuthorizationStore();

function safeCell(key, row) {
  if (!row) return "-";
  const val = row?.[key];
  if (val === null || val === undefined || val === "") return "-";
  return String(val);
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "-";
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const str = String(dateValue);
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : str;
}

function getStatusStyle(status) {
  const base = "inline-flex justify-center items-center min-w-[90px] px-3 py-1 rounded-full text-xs font-semibold";

  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return `${base} bg-green-100 text-green-800`;
    case "REJECTED":
      return `${base} bg-red-100 text-red-800`;
    case "REQUESTED":
      return `${base} bg-yellow-100 text-yellow-800`;
    case "CANCELLED":
      return `${base} bg-gray-100 text-gray-800`;
    default:
      return `${base} bg-blue-100 text-blue-800`;
  }
}

function openChangeStatusModal(row) {
  openModal(
    "ChangeAuthorizationStatus",
    {
      authorizationUuid: row?.authorizationUuid,
      currentStatus: row?.status,
      endDate: row?.endDate,
      activeDays: row?.activeDays,
    },
    (result) => {
      if (!result?.success) return;

      const id = result.authorizationUuid || row?.authorizationUuid;
      if (!id) return;

      store.update(id, {
        ...row,
        status: result.status ?? row?.status,
        endDate: result.endDate ?? row?.endDate,
        activeDays: result.activeDays ?? row?.activeDays,
      });
    }
  );
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row?.authorizationUuid || idx"
    class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-gray-50"
  >
    <td class="p-4 font-medium text-gray-500">
      {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
    </td>

    <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
      <div v-if="key === 'status'" class="truncate">
        <span :class="getStatusStyle(row?.status)">{{ row?.status || '-' }}</span>
      </div>
      <div v-else-if="key === 'member'">
        <div class="flex gap-3 items-center">
          <div
            class="flex justify-center items-center w-10 h-10 text-sm font-bold text-gray-700 bg-gray-50 rounded-xl border border-gray-200"
          >
            {{ initials(row?.dependantUuid ? (row?.dependantName || row?.insuredName) : (row?.insuredName || row?.dependantName)) }}
          </div>

          <div class="min-w-0">
            <div class="flex gap-2 items-center">
              <div class="font-semibold text-gray-900 truncate">
                {{ row?.dependantUuid ? (row?.dependantName || row?.insuredName || '-') : (row?.insuredName || row?.dependantName || '-') }}
              </div>
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                  row?.dependantUuid ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                ]"
              >
                {{ row?.dependantUuid ? 'Dependant' : 'Insured' }}
              </span>
            </div>

            <div v-if="row?.dependantUuid" class="mt-0.5 text-xs text-gray-500 truncate">
              Primary:
              <span class="font-medium text-gray-700">{{ row?.insuredName || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="key === 'endDate'" class="text-gray-700">
        {{ formatDate(row?.endDate) }}
      </div>
      <div v-else class="text-gray-700">
        {{ safeCell(key, row) }}
      </div>
    </td>

    <td v-if="headKeys.find((h) => String(h).toLowerCase() === 'actions')" class="p-3">
      <button
        @click.stop="openChangeStatusModal(row)"
        class="inline-flex gap-2 items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100"
      >
        Change Status
      </button>
    </td>
  </tr>
</template>
