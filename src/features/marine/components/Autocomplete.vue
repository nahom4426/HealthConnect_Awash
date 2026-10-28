<script setup>
// Search-as-you-type picker (ARIA combobox) behind PartyPicker, PortAutocomplete and
// HsCodeAutocomplete. modelValue is the picked object (or an array of them when `multiple`).
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { inputClass, inputBorder } from "./styles";
import { useId } from "../utils/useId";

const props = defineProps({
  modelValue: { type: [Object, Array], default: null },
  search: { type: Function, required: true }, // (q) => Promise<item[]>
  itemKey: { type: String, required: true },
  itemLabel: { type: Function, required: true },
  itemSub: { type: Function, default: null },
  multiple: { type: Boolean, default: false },
  max: { type: Number, default: Infinity },
  placeholder: { type: String, default: "Search" },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
});
const emit = defineEmits(["update:modelValue", "blur"]);

const listId = useId("lb");
const query = ref("");
const items = ref([]);
const open = ref(false);
const active = ref(-1);
const searching = ref(false);
let timer;
let seq = 0;

const selected = computed(() => (props.multiple ? props.modelValue ?? [] : props.modelValue ? [props.modelValue] : []));
const atMax = computed(() => props.multiple && selected.value.length >= props.max);

async function run(q) {
  const mine = ++seq;
  searching.value = true;
  const res = await props.search(q);
  if (mine !== seq) return;
  searching.value = false;
  const taken = new Set(selected.value.map((s) => s[props.itemKey]));
  items.value = (res ?? []).filter((i) => !props.multiple || !taken.has(i[props.itemKey]));
  active.value = items.value.length ? 0 : -1;
}

watch(query, (q) => {
  clearTimeout(timer);
  timer = setTimeout(() => run(q), 250);
});
onBeforeUnmount(() => clearTimeout(timer));

function onFocus() {
  if (atMax.value) return;
  open.value = true;
  run(query.value);
}

function pick(item) {
  if (props.multiple) emit("update:modelValue", [...selected.value, item]);
  else emit("update:modelValue", item);
  query.value = "";
  open.value = false;
}
function remove(item) {
  if (props.multiple) emit("update:modelValue", selected.value.filter((s) => s[props.itemKey] !== item[props.itemKey]));
  else emit("update:modelValue", null);
}

function onKey(e) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    open.value = true;
    active.value = Math.min(items.value.length - 1, active.value + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    active.value = Math.max(0, active.value - 1);
  } else if (e.key === "Enter" && open.value && items.value[active.value]) {
    e.preventDefault();
    pick(items.value[active.value]);
  } else if (e.key === "Escape") {
    open.value = false;
  } else if (e.key === "Backspace" && !query.value && props.multiple && selected.value.length) {
    remove(selected.value[selected.value.length - 1]);
  }
}

function onBlur() {
  // Let a click on an option land before closing
  setTimeout(() => {
    open.value = false;
    emit("blur");
  }, 150);
}
defineExpose({ close: () => (open.value = false) });
</script>

<template>
  <div class="relative">
    <!-- Single: the picked item replaces the input until cleared -->
    <div
      v-if="!multiple && modelValue"
      :class="[inputClass, inputBorder(invalid), 'flex items-center justify-between gap-2 !h-auto min-h-10 py-1.5']"
    >
      <div class="min-w-0">
        <p class="text-sm font-medium truncate text-ink">{{ itemLabel(modelValue) }}</p>
        <p v-if="itemSub" class="text-xs truncate text-ink-subtle">{{ itemSub(modelValue) }}</p>
      </div>
      <button v-if="!disabled" type="button" class="shrink-0 px-2 text-xs font-medium text-primary hover:underline" :aria-label="`Change ${itemLabel(modelValue)}`" @click="remove(modelValue)">Change</button>
    </div>

    <div v-else :class="[inputClass, inputBorder(invalid), 'flex flex-wrap gap-1 items-center !h-auto min-h-10 py-1']">
      <span v-for="s in selected" :key="s[itemKey]" class="inline-flex gap-1 items-center py-0.5 pr-1 pl-2 text-xs font-medium rounded-md bg-primary/10 text-primary">
        {{ itemLabel(s) }}
        <button type="button" class="grid place-items-center w-4 h-4 rounded hover:bg-primary/20" :aria-label="`Remove ${itemLabel(s)}`" @click="remove(s)">×</button>
      </span>
      <input
        :id="id"
        v-model="query"
        role="combobox"
        :aria-expanded="open"
        :aria-controls="listId"
        aria-autocomplete="list"
        :aria-activedescendant="active >= 0 ? `${listId}-${active}` : undefined"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedby"
        :placeholder="atMax ? `Up to ${max}` : placeholder"
        :disabled="disabled || atMax"
        class="flex-1 min-w-[8rem] h-8 bg-transparent outline-none"
        autocomplete="off"
        @focus="onFocus"
        @keydown="onKey"
        @blur="onBlur"
      />
    </div>

    <ul
      v-if="open"
      :id="listId"
      role="listbox"
      class="overflow-auto absolute z-40 p-1 mt-1 w-full max-h-72 rounded-xl border shadow-pop bg-surface border-line"
    >
      <li v-if="searching && !items.length" class="px-3 py-2 text-sm text-ink-subtle">Searching…</li>
      <li v-else-if="!items.length" class="px-3 py-2 text-sm text-ink-subtle">No matches</li>
      <li
        v-for="(item, i) in items"
        :id="`${listId}-${i}`"
        :key="item[itemKey]"
        role="option"
        :aria-selected="i === active"
        :class="['px-3 py-2 rounded-lg cursor-pointer', i === active ? 'bg-surface-muted' : '']"
        @mousedown.prevent="pick(item)"
        @mouseenter="active = i"
      >
        <slot name="item" :item="item">
          <p class="text-sm text-ink">{{ itemLabel(item) }}</p>
          <p v-if="itemSub" class="text-xs text-ink-subtle">{{ itemSub(item) }}</p>
        </slot>
      </li>
      <li v-if="$slots.footer" class="pt-1 mt-1 border-t border-line" @mousedown.prevent>
        <slot name="footer" :query="query" :close="() => (open = false)" />
      </li>
    </ul>
  </div>
</template>
