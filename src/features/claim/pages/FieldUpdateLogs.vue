<script setup>
import { computed, ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import FieldUpdateLogsDataProvider from "../components/FieldUpdateLogsDataProvider.vue";

const dataProvider = ref();

const updateEntity = ref("");
const updateField = ref("");
const fromDate = ref("");
const toDate = ref("");

// Entity type options for CustomSelect
const entityOptions = [
  { value: "", label: "All Entities" },
  { value: "BenefitBalance", label: "Benefit Balance" },
  { value: "Claim", label: "Claim" },
  { value: "InsuredPerson", label: "Insured Person" },
  { value: "Contract", label: "Contract" },
  { value: "Institution", label: "Institution" },
  { value: "Provider", label: "Provider" },
];

// Field type options for CustomSelect
const fieldOptions = [
  { value: "", label: "All Fields" },
  { value: "sumAssured", label: "Sum Assured" },
  { value: "used", label: "Used" },
  { value: "balance", label: "Balance" },
  { value: "status", label: "Status" },
  { value: "premium", label: "Premium" },
  { value: "benefit", label: "Benefit" },
];

function toApiDate(dateStr) {
  if (!dateStr) return "";
  return String(dateStr).replaceAll("-", "/");
}

const params = computed(() => ({
  updateEntity: updateEntity.value?.trim() || undefined,
  updateField: updateField.value?.trim() || undefined,
  fromDate: toApiDate(fromDate.value) || undefined,
  toDate: toApiDate(toDate.value) || undefined,
}));

function handlePageChange(page) {
  if (dataProvider.value) dataProvider.value.setPage(page);
}

function handleLimitChange(limit) {
  if (dataProvider.value) dataProvider.value.setLimit(limit);
}

// Format entity: "BenefitBalance:uuid" → "Benefit Balance"
function formatEntity(entity) {
  if (!entity) return "—";
  const parts = entity.split(":");
  // Convert camelCase to readable: BenefitBalance → Benefit Balance
  return parts[0].replace(/([A-Z])/g, " $1").trim();
}

// Format field: "sumAssured" → "Sum Assured"
function formatField(field) {
  if (!field) return "—";
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Format date nicely
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format user: show short ID instead of full UUID
function formatUser(user) {
  if (!user) return "—";
  // Show first 8 chars of UUID as a compact reference
  return user.substring(0, 8).toUpperCase();
}

function clearFilters() {
  updateEntity.value = "";
  updateField.value = "";
  fromDate.value = "";
  toDate.value = "";
}

const hasActiveFilters = computed(() => {
  return updateEntity.value || updateField.value || fromDate.value || toDate.value;
});
</script>

<template>
  <DefaultPage title="Field Update Logs" placeholder="Search logs...">
    <template #header>
      <div class="flex gap-3 items-center px-4 py-2 bg-gradient-to-r rounded-lg border shadow-sm from-indigo-50 to-indigo-100/50 border-indigo-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M12 7v5l4 2"/>
        </svg>
        <span class="text-sm font-semibold text-indigo-700">Audit Trail</span>
      </div>
    </template>

    <template #default="{ search }">
      <!-- Modern Filter Bar -->
      <div class="p-4 mb-5 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div class="flex flex-wrap gap-3 items-end">
          <!-- Entity filter -->
          <div class="flex flex-col gap-1.5 min-w-[180px]">
            <label class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Entity</label>
            <CustomSelect
              v-model="updateEntity"
              :options="entityOptions"
              placeholder="All Entities"
            />
          </div>

          <!-- Field filter -->
          <div class="flex flex-col gap-1.5 min-w-[180px]">
            <label class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Field</label>
            <CustomSelect
              v-model="updateField"
              :options="fieldOptions"
              placeholder="All Fields"
            />
          </div>

          <!-- From Date -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold tracking-wider text-gray-400 uppercase">From</label>
            <div class="flex items-center h-10 rounded-md border border-gray-300 min-w-[160px]">
              <input
                v-model="fromDate"
                type="date"
                class="px-3 w-full h-full text-sm bg-transparent outline-none"
              />
            </div>
          </div>

          <!-- To Date -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold tracking-wider text-gray-400 uppercase">To</label>
            <div class="flex items-center h-10 rounded-md border border-gray-300 min-w-[160px]">
              <input
                v-model="toDate"
                type="date"
                class="px-3 w-full h-full text-sm bg-transparent outline-none"
              />
            </div>
          </div>

          <!-- Clear Filters button -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="flex gap-1.5 items-center px-3 h-10 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200 transition-colors hover:bg-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Clear
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <FieldUpdateLogsDataProvider
        ref="dataProvider"
        :search="search"
        :params="params"
        :auto="true"
        v-slot="{ logs, pending, currentPage, itemsPerPage, totalPages, totalElements }"
      >
        <!-- Results count badge -->
        <div v-if="totalElements" class="flex gap-2 items-center mb-3">
          <span class="px-3 py-1 text-xs font-semibold rounded-full text-indigo-700 bg-indigo-50">
            {{ totalElements?.toLocaleString() }} records
          </span>
        </div>

        <div class="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/80">
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">#</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Date & Time</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">User</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Entity</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Field</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Change</th>
                <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-400 uppercase">Remark</th>
              </tr>
            </thead>
            <tbody v-if="pending">
              <tr v-for="i in 8" :key="i" class="border-b border-gray-50">
                <td v-for="j in 7" :key="j" class="px-4 py-3">
                  <div class="h-4 bg-gray-100 rounded animate-pulse" :style="{ width: (40 + Math.random() * 60) + '%' }"></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="logs && logs.length > 0">
              <tr
                v-for="(log, idx) in logs"
                :key="log.id"
                class="border-b border-gray-50 transition-colors hover:bg-indigo-50/30 group"
              >
                <!-- Row number -->
                <td class="px-4 py-3 text-xs font-medium text-gray-300">
                  {{ ((currentPage - 1) * itemsPerPage) + idx + 1 }}
                </td>

                <!-- Date -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex justify-center items-center w-7 h-7 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-700 whitespace-nowrap">{{ formatDate(log.updateDate) }}</span>
                  </div>
                </td>

                <!-- User -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex justify-center items-center w-7 h-7 text-xs font-bold text-white rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                      {{ formatUser(log.updateUser).charAt(0) }}
                    </div>
                    <span class="px-2 py-0.5 text-xs font-mono font-medium text-purple-700 bg-purple-50 rounded" :title="log.updateUser">
                      {{ formatUser(log.updateUser) }}
                    </span>
                  </div>
                </td>

                <!-- Entity -->
                <td class="px-4 py-3">
                  <span class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700">
                    {{ formatEntity(log.updateEntity) }}
                  </span>
                </td>

                <!-- Field -->
                <td class="px-4 py-3">
                  <span class="text-sm font-medium text-gray-600">
                    {{ formatField(log.updateField) }}
                  </span>
                </td>

                <!-- Change (From → To) -->
                <td class="px-4 py-3">
                  <div class="flex gap-1.5 items-center">
                    <span class="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 rounded line-through">
                      {{ log.fromValue || '—' }}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 flex-shrink-0">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span class="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded">
                      {{ log.toValue || '—' }}
                    </span>
                  </div>
                </td>

                <!-- Remark -->
                <td class="px-4 py-3">
                  <span v-if="log.remark" class="text-sm text-gray-500 italic">{{ log.remark }}</span>
                  <span v-else class="text-gray-300">—</span>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7" class="py-16 text-center">
                  <div class="flex flex-col justify-center items-center">
                    <svg class="mb-3 w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-sm font-medium text-gray-400">No update logs found</p>
                    <p class="mt-1 text-xs text-gray-300">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="logs && logs.length > 0" class="flex gap-3 justify-between items-center mt-4">
          <span class="text-xs text-gray-400">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <div class="flex gap-2">
            <button
              @click="handlePageChange(currentPage - 1)"
              :disabled="currentPage <= 1"
              class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              @click="handlePageChange(currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </FieldUpdateLogsDataProvider>
    </template>
  </DefaultPage>
</template>
