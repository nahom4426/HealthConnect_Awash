<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  benefitGroups: { type: Array, default: () => [] },
  selectedGroup: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

const searchQuery = ref('');
const planTypeFilter = ref('');

const PLAN_TYPE_OPTIONS = [
  { value: '', label: 'All Plan Types' },
  { value: 'Individual_Plan', label: 'Individual Plan' },
  { value: 'Family_Shared_Plan', label: 'Family Shared Plan' },
  { value: 'Dependent_Shared_Plan', label: 'Dependent Shared Plan' },
];

const filteredGroups = computed(() => {
  let result = props.benefitGroups;

  if (planTypeFilter.value) {
    // If a plan type filter is set, match if the group contains that plan type
    const filterFormatted = planTypeFilter.value.replace(/_/g, ' ');
    result = result.filter((g) =>
      g.planTypes?.includes(filterFormatted) || g.planType === planTypeFilter.value
    );
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    result = result.filter((g) => {
      const matchNames = g.packageNames?.some(name => name.toLowerCase().includes(q)) ||
                         g.packageName?.toLowerCase().includes(q);
      return matchNames;
    });
  }

  return result;
});

function availableSlots(group) {
  return group.maxAllowedSlots - group.enrolledSlotsCount;
}

function isFull(group) {
  return availableSlots(group) <= 0;
}

function isSelected(group) {
  return props.selectedGroup?.benefitGroupCode === group.benefitGroupCode;
}

function getPlanTypeBadge(planType) {
  const clean = planType?.replace(/ /g, '_');
  const map = {
    Individual_Plan: 'bg-sky-50 text-sky-700 border border-sky-200',
    Family_Shared_Plan: 'bg-violet-50 text-violet-700 border border-violet-200',
    Dependent_Shared_Plan: 'bg-teal-50 text-teal-700 border border-teal-200',
  };
  return map[clean] || 'bg-gray-50 text-gray-600 border border-gray-200';
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Filters Row -->
    <div class="flex gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by package name..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
        />
      </div>

      <!-- Plan Type Filter -->
      <select
        v-model="planTypeFilter"
        class="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition appearance-none min-w-[180px]"
      >
        <option
          v-for="opt in PLAN_TYPE_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-16 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredGroups.length === 0"
      class="flex flex-col items-center justify-center py-16 text-gray-400"
    >
      <svg class="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      <p class="text-sm font-medium">No benefit groups found</p>
      <p class="text-xs mt-1">
        {{ searchQuery || planTypeFilter ? 'Try clearing your filters' : 'No benefit packages exist on the previous contract' }}
      </p>
    </div>

    <!-- Table -->
    <div v-else class="border border-gray-200 rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Packages</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan Types</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Family Size</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Slots</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrolled</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Available</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="group in filteredGroups"
              :key="group.benefitGroupCode"
              class="transition-colors duration-150"
              :class="[
                isSelected(group)
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : isFull(group)
                    ? 'bg-gray-50 opacity-70'
                    : 'bg-white hover:bg-gray-50 cursor-pointer',
              ]"
              @click="!isFull(group) && emit('select', group)"
            >
              <!-- Packages (Concatenated Names) -->
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">
                  {{ group.packageNames?.join(', ') || group.packageName }}
                </div>
              </td>

              <!-- Plan Types Badges -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="pt in (group.planTypes || [group.planType])"
                    :key="pt"
                    class="px-2 py-0.5 text-xs rounded-md font-medium"
                    :class="getPlanTypeBadge(pt)"
                  >
                    {{ pt }}
                  </span>
                </div>
              </td>

              <!-- Family Size -->
              <td class="px-4 py-3 text-center text-gray-700 font-medium">
                {{ group.familySize }}
              </td>

              <!-- Max Slots -->
              <td class="px-4 py-3 text-center text-gray-700 font-medium">
                {{ group.maxAllowedSlots }}
              </td>

              <!-- Enrolled -->
              <td class="px-4 py-3 text-center">
                <span class="text-gray-700 font-medium">{{ group.enrolledSlotsCount }}</span>
              </td>

              <!-- Available -->
              <td class="px-4 py-3 text-center">
                <span
                  class="font-semibold"
                  :class="availableSlots(group) > 0 ? 'text-green-600' : 'text-red-500'"
                >
                  {{ availableSlots(group) }}
                </span>
              </td>

              <!-- Action -->
              <td class="px-4 py-3 text-center">
                <template v-if="isFull(group)">
                  <span class="text-xs text-gray-400 font-medium">Full</span>
                </template>
                <template v-else-if="isSelected(group)">
                  <span class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Selected
                  </span>
                </template>
                <template v-else>
                  <button
                    class="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                    @click.stop="emit('select', group)"
                  >
                    Select
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

