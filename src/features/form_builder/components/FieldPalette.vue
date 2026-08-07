<template>
  <div class="field-palette bg-white border-r border-slate-200 p-4 w-64 flex flex-col h-full min-h-0 select-none overflow-y-auto custom-scrollbar shrink-0 box-border">
    <div class="mb-3 shrink-0">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Field Types</h3>
      <p class="text-xs text-slate-500 mt-1">Drag or click to add fields to your form canvas</p>
    </div>

    <div class="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar box-border">
      <div
        v-for="item in paletteItems"
        :key="item.type"
        draggable="true"
        @dragstart="onDragStart($event, item)"
        @click="onClickAdd(item)"
        class="palette-card flex items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-800 hover:bg-white hover:border-emerald-500 hover:shadow-md cursor-grab transition-all duration-200 group box-border max-w-full"
      >
        <div class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 group-hover:border-emerald-300 transition-colors mr-2.5 shadow-xs shrink-0">
          <component :is="item.icon" class="w-3.5 h-3.5" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">{{ item.label }}</div>
          <div class="text-[10px] text-slate-500 truncate">{{ item.description }}</div>
        </div>
        <div class="text-slate-400 group-hover:text-emerald-600 ml-1 shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-slate-200 shrink-0 box-border">
      <div class="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800 flex items-start space-x-2 leading-relaxed">
        <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Fields render dynamically in the mobile proposal flow based on backend schema.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { h } from 'vue';

const emit = defineEmits(['add-field']);

// Inline SVG Icons
const TextIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', class: 'w-4 h-4' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 12h16m-7 6h7' })
]);

const NumberIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', class: 'w-4 h-4' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' })
]);

const DropdownIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', class: 'w-4 h-4' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 9l-7 7-7-7' })
]);

const DateIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', class: 'w-4 h-4' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })
]);

const ToggleIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', class: 'w-4 h-4' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 11h.01M12 11h.01M16 11h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' })
]);

const SectionIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', class: 'w-4 h-4' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 10h16M4 14h16M4 18h16' })
]);

const paletteItems = [
  { type: 'text', label: 'Text Input', description: 'Single line text input', icon: TextIcon },
  { type: 'number', label: 'Number / Currency', description: 'Numeric values or monetary sum', icon: NumberIcon },
  { type: 'dropdown', label: 'Dropdown Select', description: 'Single choice from list options', icon: DropdownIcon },
  { type: 'date', label: 'Date Picker', description: 'Calendar date selection', icon: DateIcon },
  { type: 'toggle', label: 'Yes / No Toggle', description: 'Boolean switch selection', icon: ToggleIcon },
  { type: 'header', label: 'Section Header', description: 'Group divider & section text', icon: SectionIcon },
];

function onDragStart(event, item) {
  event.dataTransfer.setData('application/json', JSON.stringify(item));
  event.dataTransfer.effectAllowed = 'copy';
}

function onClickAdd(item) {
  emit('add-field', item);
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
</style>
