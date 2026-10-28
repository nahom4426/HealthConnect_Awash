<template>
  <div class="json-preview flex-1 bg-surface-muted p-6 flex flex-col min-h-0 select-text">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
        <h3 class="text-sm font-bold text-ink font-mono">Proposal Contract Schema JSON</h3>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="copyJson"
          class="px-3 py-1.5 rounded-xl bg-white hover:bg-surface-raised text-ink-muted text-xs font-bold flex items-center space-x-1.5 border border-line shadow-xs transition-colors"
        >
          <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>{{ copied ? 'Copied!' : 'Copy Schema JSON' }}</span>
        </button>
      </div>
    </div>

    <div class="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-auto custom-scrollbar font-mono text-xs text-emerald-400 leading-relaxed shadow-inner">
      <pre>{{ formattedJson }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  schemaJson: { type: [String, Object], default: '' },
});

const copied = ref(false);

const formattedJson = computed(() => {
  if (!props.schemaJson) return '{}';
  try {
    const obj = typeof props.schemaJson === 'string' ? JSON.parse(props.schemaJson) : props.schemaJson;
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(props.schemaJson);
  }
});

function copyJson() {
  navigator.clipboard.writeText(formattedJson.value);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
</style>
