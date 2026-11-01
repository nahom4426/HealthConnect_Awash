<script setup>
// "Documents" button with a menu of the PDFs available for a record (quotation, debit note, ...).
// items: [{ key, label, hint? }]; emits select(key). `pending` is the key being generated.
import { onBeforeUnmount, ref } from "vue";
import Button from "@/components/Button.vue";

defineProps({
  items: { type: Array, default: () => [] },
  pending: { type: String, default: "" },
});
const emit = defineEmits(["select"]);

const open = ref(false);
const root = ref(null);
function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
function toggle() {
  open.value = !open.value;
  if (open.value) document.addEventListener("click", onDocClick);
  else document.removeEventListener("click", onDocClick);
}
function choose(key) {
  open.value = false;
  document.removeEventListener("click", onDocClick);
  emit("select", key);
}
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <div v-if="items.length" ref="root" class="relative" @keydown.esc="open = false">
    <Button variant="outline" :pending="!!pending" aria-haspopup="menu" :aria-expanded="open" @click.stop="toggle">
      <span class="inline-flex gap-2 items-center">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        Documents
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
      </span>
    </Button>
    <div v-if="open" role="menu" class="overflow-hidden absolute right-0 z-30 mt-2 w-64 rounded-xl border shadow-lg bg-surface border-line">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        role="menuitem"
        class="flex flex-col gap-0.5 px-4 py-2.5 w-full text-left transition-colors hover:bg-surface-muted"
        @click="choose(item.key)"
      >
        <span class="text-sm font-medium text-ink">{{ item.label }} <span class="text-xs text-ink-subtle">PDF</span></span>
        <span v-if="item.hint" class="text-xs text-ink-subtle">{{ item.hint }}</span>
      </button>
    </div>
  </div>
</template>
