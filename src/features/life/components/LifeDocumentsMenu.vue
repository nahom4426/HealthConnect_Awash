<script setup>
// "Documents" button with a menu of the PDFs available for a record (quotation, debit note, ...).
// items: [{ key, label, hint? }]; emits select(key). `pending` is the key being generated.
// The menu is placed on the page at the button's position so a table or card never clips it.
import { onBeforeUnmount, ref } from "vue";
import Button from "@/components/Button.vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
  pending: { type: String, default: "" },
  /** Button size; "sm" inside list rows */
  size: { type: String, default: "md" },
});
const emit = defineEmits(["select"]);

const open = ref(false);
const root = ref(null);
const menu = ref(null);
const menuStyle = ref({});

// Below the button, or above it when there is no room underneath
function place() {
  const r = root.value?.getBoundingClientRect();
  if (!r) return;
  const height = props.items.length * 56 + 8;
  const right = `${Math.max(8, window.innerWidth - r.right)}px`;
  menuStyle.value = r.bottom + 8 + height > window.innerHeight && r.top - 8 - height > 0
    ? { right, bottom: `${window.innerHeight - r.top + 8}px` }
    : { right, top: `${r.bottom + 8}px` };
}
function onDocClick(e) {
  if (!root.value?.contains(e.target) && !menu.value?.contains(e.target)) close();
}
function listen(on) {
  const fn = on ? "addEventListener" : "removeEventListener";
  document[fn]("click", onDocClick);
  window[fn]("scroll", close, true);
  window[fn]("resize", close);
}
function close() {
  open.value = false;
  listen(false);
}
function toggle() {
  if (open.value) return close();
  place();
  open.value = true;
  listen(true);
}
function choose(key) {
  close();
  emit("select", key);
}
onBeforeUnmount(() => listen(false));
</script>

<template>
  <div v-if="items.length" ref="root" class="inline-block" @keydown.esc="close()">
    <Button variant="outline" :size="size" :pending="!!pending" aria-haspopup="menu" :aria-expanded="open" @click.stop="toggle">
      <span class="inline-flex gap-2 items-center">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        Documents
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
      </span>
    </Button>
    <Teleport to="body">
      <div v-if="open" ref="menu" role="menu" :style="menuStyle" class="overflow-hidden fixed z-50 w-64 rounded-xl border shadow-lg bg-surface border-line" @keydown.esc="close()">
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
    </Teleport>
  </div>
</template>
