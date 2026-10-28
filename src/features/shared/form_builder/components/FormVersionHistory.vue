<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white border border-line rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5">
      <div class="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h3 class="text-base font-bold text-ink">Form Version History</h3>
          <p class="text-xs text-ink-subtle">View and manage schema revisions for {{ productId }}</p>
        </div>
        <button @click="$emit('close')" class="text-ink-subtle hover:text-ink-muted p-1.5 rounded-xl hover:bg-surface-raised">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        <div
          v-for="item in versions"
          :key="item.formUuid"
          class="p-4 rounded-2xl bg-surface-muted border border-line flex items-center justify-between transition-colors hover:bg-surface-raised/60"
        >
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-ink">v{{ item.version }}</span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" :class="getStatusBadgeClass(item.status)">
                {{ item.status }}
              </span>
            </div>
            <p class="text-[11px] text-ink-subtle font-mono">
              Updated: {{ formatDate(item.updatedAt || item.createdAt) }}
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="$emit('load-version', item)"
              class="px-3 py-1.5 rounded-xl bg-white border border-line hover:bg-surface-muted text-ink-muted text-xs font-semibold transition-colors shadow-xs"
            >
              Open
            </button>
            <button
              v-if="item.status !== 'PUBLISHED'"
              @click="$emit('publish-version', item.formUuid)"
              class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors shadow-xs"
            >
              Publish
            </button>
          </div>
        </div>

        <div v-if="!versions || !versions.length" class="text-center py-8 text-xs text-ink-subtle">
          No previous versions recorded.
        </div>
      </div>

      <div class="flex justify-end pt-3 border-t border-line">
        <button @click="$emit('close')" class="px-4 py-2 rounded-xl bg-surface-raised text-ink-muted text-xs font-bold hover:bg-line">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  productId: { type: String, default: '' },
  versions: { type: Array, default: () => [] },
});

defineEmits(['close', 'load-version', 'publish-version']);

function formatDate(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    return new Date(isoStr).toLocaleString();
  } catch {
    return isoStr;
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'PUBLISHED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DRAFT': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
</style>
