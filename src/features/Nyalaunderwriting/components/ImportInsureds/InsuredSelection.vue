<script setup>
import { ref, computed } from 'vue';
import InsuredTreeNode from './InsuredTreeNode.vue';

const props = defineProps({
  insureds: { type: Array, default: () => [] },
  selectedInsureds: { type: Object, default: () => new Map() }, // Map<uuid, {insured, dependents[]}>
  currentInsuredUuids: { type: Object, default: () => new Set() }, // Set<uuid>
  benefitGroup: { type: Object, default: null },
  selectedCount: { type: Number, default: 0 },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits([
  'toggle',
  'toggle-dependent',
  'select-all-employees',
  'select-all-dependents',
  'select-exact-dependents',
  'clear-all',
]);

const searchQuery = ref('');

const filteredInsureds = computed(() => {
  if (!searchQuery.value.trim()) return props.insureds;
  const q = searchQuery.value.trim().toLowerCase();
  return props.insureds.filter((ins) => {
    const name = `${ins.firstName} ${ins.fatherName} ${ins.grandFatherName || ''}`.toLowerCase();
    return name.includes(q) || ins.idNumber?.toLowerCase().includes(q);
  });
});

const maxAllowed = computed(() => props.benefitGroup?.maxAllowedSlots ?? 0);
const isOverLimit = computed(() => props.selectedCount > maxAllowed.value);

function isInsuredSelected(insured) {
  return props.selectedInsureds.has(insured.insuredUuid);
}

function isInsuredDisabled(insured) {
  return props.currentInsuredUuids.has(insured.insuredUuid);
}

function getSelectedDependents(insured) {
  return props.selectedInsureds.get(insured.insuredUuid)?.dependents ?? [];
}

function getWarning(insured) {
  if (props.currentInsuredUuids.has(insured.insuredUuid)) return null; // shown as disabled
  const bg = props.benefitGroup;
  if (bg && bg.numberOfAdultFemale > 0 && insured.gender !== 'Female') {
    return 'Benefit group requires female members only';
  }
  return null;
}

// Quick-action filters
const DEPENDENT_COUNTS = [1, 2, 3, 4, 5];
</script>

<template>
  <div class="flex flex-col h-full gap-4">

    <!-- Search -->
    <div class="relative">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or ID..."
        class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
      />
    </div>

    <!-- Quick Action Buttons -->
    <div class="flex flex-wrap gap-2">
      <button
        @click="emit('select-all-employees')"
        class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        All Employees
      </button>
      <button
        @click="emit('select-all-dependents')"
        class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        All Dependents
      </button>
      <button
        v-for="n in DEPENDENT_COUNTS"
        :key="n"
        @click="emit('select-exact-dependents', n)"
        class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        {{ n }} {{ n === 1 ? 'Dependent' : 'Dependents' }}
      </button>
      <button
        @click="emit('clear-all')"
        class="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
      >
        Clear All
      </button>
    </div>

    <!-- Selection Counter -->
    <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span class="text-sm text-gray-600">
          Selected: <span class="font-semibold text-gray-800">{{ selectedCount }}</span>
          <span class="text-gray-400"> / </span>
          <span class="font-semibold">{{ maxAllowed }}</span> employee slots
        </span>
      </div>

      <span
        class="text-xs font-semibold px-2 py-0.5 rounded-full"
        :class="isOverLimit
          ? 'bg-red-100 text-red-700'
          : selectedCount > 0
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'"
      >
        <template v-if="isOverLimit">
          Exceeds limit by {{ selectedCount - maxAllowed }}
        </template>
        <template v-else-if="selectedCount > 0">
          Within limit
        </template>
        <template v-else>
          None selected
        </template>
      </span>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-14 bg-gray-100 rounded-lg animate-pulse" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredInsureds.length === 0"
      class="flex flex-col items-center justify-center py-16 text-gray-400"
    >
      <svg class="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p class="text-sm font-medium">No insured persons found</p>
      <p class="text-xs mt-1">
        {{ searchQuery ? 'Try a different search term' : 'No insureds are enrolled in the previous contract' }}
      </p>
    </div>

    <!-- Tree View -->
    <div v-else class="border border-gray-200 rounded-xl overflow-hidden">
      <div class="overflow-y-auto" style="max-height: 420px;">
        <div
          v-for="(insured, idx) in filteredInsureds"
          :key="insured.insuredUuid"
          :class="idx > 0 ? 'border-t border-gray-100' : ''"
        >
          <InsuredTreeNode
            :insured="insured"
            :is-selected="isInsuredSelected(insured)"
            :is-disabled="isInsuredDisabled(insured)"
            :warning="getWarning(insured)"
            :selected-dependents="getSelectedDependents(insured)"
            @toggle="emit('toggle', $event)"
            @toggle-dependent="emit('toggle-dependent', $event)"
          />
        </div>
      </div>
    </div>

  </div>
</template>
