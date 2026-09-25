<script setup>
import { openModal } from "@customizer/modal-x";
import { useAuthorizationStore } from "../store/authorizationStore";
import { formatMoney } from "@/utils/utils";

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

function parseDateString(dateValue) {
  if (!dateValue) return null;
  const str = String(dateValue).trim();
  if (!str) return null;

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3],
      yyyyMmDd: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      ddMmYyyy: `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`,
    };
  }

  const ddmmyyyyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmmyyyyMatch) {
    return {
      year: ddmmyyyyMatch[3],
      month: ddmmyyyyMatch[2],
      day: ddmmyyyyMatch[1],
      yyyyMmDd: `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`,
      ddMmYyyy: `${ddmmyyyyMatch[1]}/${ddmmyyyyMatch[2]}/${ddmmyyyyMatch[3]}`,
    };
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        year: yyyy,
        month: mm,
        day: dd,
        yyyyMmDd: `${yyyy}-${mm}-${dd}`,
        ddMmYyyy: `${dd}/${mm}/${yyyy}`,
      };
    }
  } catch (_) {}

  return null;
}

function formatDate(dateValue) {
  const parsed = parseDateString(dateValue);
  if (!parsed) return "-";
  return parsed.yyyyMmDd;
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
      insuredUuid: row?.insuredUuid,
      dependantUuid: row?.dependantUuid,
      currentStatus: row?.status,
      endDate: row?.endDate,
      beginDate: row?.beginDate,
      activeDays: row?.activeDays,
      authorizedAmount: row?.authorizedAmount,
      usedAmount: row?.usedAmount,
      insuredName: row?.insuredName,
      dependantName: row?.dependantName,
      providerName: row?.providerName,
      institutionName: row?.institutionName,
    },
    (result) => {
      if (!result?.success) return;

      const id = result.authorizationUuid || row?.authorizationUuid;
      if (!id) return;

      store.update(id, {
        ...row,
        status: result.status ?? row?.status,
        endDate: result.endDate ?? row?.endDate,
        beginDate: result.beginDate ?? row?.beginDate,
        activeDays: result.activeDays ?? row?.activeDays,
        authorizedAmount: result.authorizedAmount ?? row?.authorizedAmount,
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
      <div v-else-if="key === 'institutionName'">
        <div class="flex flex-col gap-1.5">
          <div class="font-semibold text-gray-900 truncate">
            {{ row?.institutionName || '-' }}
          </div>

          <!-- Member details underneath Institution Name -->
          <div class="flex gap-2 items-center">
            <div
              class="flex justify-center items-center w-7 h-7 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg border border-gray-200 shrink-0"
            >
              {{ initials(row?.dependantUuid ? (row?.dependantName || row?.insuredName) : (row?.insuredName || row?.dependantName)) }}
            </div>

            <div class="min-w-0">
              <div class="flex gap-1.5 items-center">
                <span class="text-xs font-medium text-gray-800 truncate">
                  {{ row?.dependantUuid ? (row?.dependantName || row?.insuredName || '-') : (row?.insuredName || row?.dependantName || '-') }}
                </span>
                <span
                  :class="[
                    'px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shrink-0',
                    row?.dependantUuid ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  ]"
                >
                  {{ row?.dependantUuid ? 'Dependant' : 'Insured' }}
                </span>
              </div>
              <div v-if="row?.dependantUuid && row?.insuredName" class="text-[10px] text-gray-500 truncate">
                Primary: <span class="font-medium text-gray-700">{{ row?.insuredName }}</span>
              </div>
            </div>
          </div>
        </div>
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
      <div v-else-if="key === 'authorizedAmount'">
        <div class="flex flex-col gap-1 items-start">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span class="text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 bg-emerald-100/90 px-1.5 py-0.5 rounded">
              ETB
            </span>
            <span class="text-sm font-bold tracking-tight text-emerald-950 font-mono">
              {{ formatMoney(row?.authorizedAmount) }}
            </span>
          </div>

          <div
            v-if="row?.usedAmount !== undefined && row?.usedAmount !== null"
            class="text-[11px] font-medium text-gray-500 flex items-center gap-1 pl-0.5"
          >
            <span>Used:</span>
            <span class="font-mono font-semibold text-gray-700">ETB {{ formatMoney(row?.usedAmount) }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="key === 'endDate'" class="flex flex-col gap-1 items-start">
        <div class="text-sm font-semibold text-gray-900">
          {{ formatDate(row?.endDate) }}
        </div>
        <div
          v-if="row?.activeDays !== undefined && row?.activeDays !== null && row?.activeDays !== ''"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80"
        >
          <svg class="w-3 h-3 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ row?.activeDays }} {{ Number(row?.activeDays) === 1 ? 'day' : 'days' }} active</span>
        </div>
      </div>
      <div v-else-if="key === 'activeDays'" class="text-gray-700">
        {{ row?.activeDays !== undefined && row?.activeDays !== null ? `${row.activeDays} days` : '-' }}
      </div>
      <div v-else class="text-gray-700">
        {{ safeCell(key, row) }}
      </div>
    </td>

    <td v-if="headKeys.find((h) => String(h).toLowerCase() === 'actions')" class="p-3">
      <div class="flex gap-2 items-center">
        <button
          @click.stop="openChangeStatusModal(row)"
          class="inline-flex gap-2 items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100"
        >
          Change Status
        </button>
        <button
          v-if="row?.insuredUuid"
          @click.stop="openModal('UtilizeUsage', {
            insuredUuid: row?.insuredUuid,
            dependantUuid: row?.dependantUuid || null,
            payerInstitutionContractUuid: row?.contractUuid || null,
          })"
          class="inline-flex gap-1.5 items-center px-2.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
          title="Check package utilization and remaining balance"
        >
          <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Check Usage
        </button>
      </div>
    </td>
  </tr>
</template>
