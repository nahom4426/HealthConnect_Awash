<script setup>
/**
 * InsuredTreeNode.vue
 * Renders a single insured employee and their nested dependents as a tree row.
 */
const props = defineProps({
  insured: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  warning: { type: String, default: null },
  selectedDependents: { type: Array, default: () => [] }, // array of dependantUuid strings
});

const emit = defineEmits(['toggle', 'toggle-dependent']);

function isDependentSelected(dep) {
  return props.selectedDependents.includes(dep.dependantUuid);
}

function getGenderClass(gender) {
  return gender === 'Female'
    ? 'bg-pink-50 text-pink-600 border border-pink-200'
    : 'bg-sky-50 text-sky-600 border border-sky-200';
}

function getRelationshipClass(rel) {
  const map = {
    Spouse: 'bg-violet-50 text-violet-600 border border-violet-200',
    Child: 'bg-amber-50 text-amber-600 border border-amber-200',
    Parent: 'bg-teal-50 text-teal-600 border border-teal-200',
  };
  return map[rel] || 'bg-gray-50 text-gray-600 border border-gray-200';
}

const dependents = props.insured.dependantResponses || [];
</script>

<template>
  <!-- Employee Row -->
  <div
    class="flex items-start gap-3 px-4 py-3 transition-colors duration-150"
    :class="[
      isSelected && !isDisabled ? 'bg-blue-50/60' : 'hover:bg-gray-50',
      isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
    ]"
    @click="!isDisabled && emit('toggle', insured)"
  >
    <!-- Checkbox -->
    <div class="flex-shrink-0 mt-0.5">
      <input
        type="checkbox"
        :checked="isSelected"
        :disabled="isDisabled"
        class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
        @change.stop="emit('toggle', insured)"
        @click.stop
      />
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="font-semibold text-gray-800 text-sm">
          {{ insured.firstName }} {{ insured.fatherName }}
          <span v-if="insured.grandFatherName" class="text-gray-500">{{ insured.grandFatherName }}</span>
        </span>

        <span class="px-1.5 py-0.5 text-xs rounded-md bg-gray-100 text-gray-600 border border-gray-200 font-medium">
          Employee
        </span>

        <span
          class="px-1.5 py-0.5 text-xs rounded-md font-medium"
          :class="getGenderClass(insured.gender)"
        >
          {{ insured.gender }}
        </span>

        <!-- Warning badge -->
        <span
          v-if="warning && !isDisabled"
          class="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md bg-amber-50 text-amber-700 border border-amber-200"
          :title="warning"
        >
          <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ warning }}
        </span>

        <!-- Already enrolled badge -->
        <span
          v-if="isDisabled"
          class="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md bg-gray-100 text-gray-500 border border-gray-200"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Already enrolled
        </span>
      </div>

      <div class="mt-0.5 text-xs text-gray-400 flex items-center gap-3">
        <span>ID: {{ insured.idNumber || '—' }}</span>
        <span v-if="insured.insuranceId">Insurance: {{ insured.insuranceId }}</span>
      </div>
    </div>

    <!-- Dependent count badge -->
    <div class="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {{ dependents.length }}
    </div>
  </div>

  <!-- Dependents (indented) -->
  <div v-if="dependents.length > 0" class="ml-10 border-l-2 border-gray-200">
    <div
      v-for="dep in dependents"
      :key="dep.dependantUuid"
      class="flex items-start gap-3 px-4 py-2.5 transition-colors duration-150 cursor-pointer"
      :class="isDependentSelected(dep) && !isDisabled ? 'bg-blue-50/40' : 'hover:bg-gray-50'"
      @click="!isDisabled && emit('toggle-dependent', { insured, dependent: dep })"
    >
      <!-- Checkbox -->
      <div class="flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          :checked="isDependentSelected(dep)"
          :disabled="isDisabled"
          class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
          @change.stop="emit('toggle-dependent', { insured, dependent: dep })"
          @click.stop
        />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="font-medium text-gray-700 text-sm">
            {{ dep.firstName }} {{ dep.fatherName }}
          </span>

          <span
            class="px-1.5 py-0.5 text-xs rounded-md font-medium"
            :class="getRelationshipClass(dep.relationship)"
          >
            {{ dep.relationship }}
          </span>

          <span
            class="px-1.5 py-0.5 text-xs rounded-md font-medium"
            :class="getGenderClass(dep.gender)"
          >
            {{ dep.gender }}
          </span>
        </div>

        <div class="mt-0.5 text-xs text-gray-400">
          ID: {{ dep.idNumber || '—' }}
        </div>
      </div>
    </div>
  </div>
</template>
