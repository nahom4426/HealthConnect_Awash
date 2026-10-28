<template>
  <div class="step-manager bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between overflow-x-auto">
    <div class="flex items-center space-x-2">
      <div
        v-for="(step, index) in steps"
        :key="step.stepId || index"
        @click="$emit('select-step', index)"
        class="step-pill px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer select-none border"
        :class="[
          selectedIndex === index
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-slate-200'
        ]"
      >
        <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" :class="selectedIndex === index ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'">
          {{ index + 1 }}
        </span>
        <span class="truncate max-w-[140px]">{{ step.stepTitle || `Step ${index + 1}` }}</span>

        <button
          v-if="steps.length > 1"
          @click.stop="$emit('delete-step', index)"
          class="ml-1 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
          title="Delete step"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <button
        @click="$emit('add-step')"
        class="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 border-dashed text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Step</span>
      </button>
    </div>

    <div class="text-xs text-slate-500 font-medium shrink-0 ml-4">
      Total Steps: <span class="text-slate-900 font-bold">{{ steps.length }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  steps: { type: Array, default: () => [] },
  selectedIndex: { type: Number, default: 0 },
});

defineEmits(['select-step', 'add-step', 'delete-step']);
</script>
