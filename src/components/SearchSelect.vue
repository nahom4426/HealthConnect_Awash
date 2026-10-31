<script setup>
/**
 * Async search-and-select (combobox).
 * Calls `searchCb` with pagination params as the user types and shows results;
 * picking one sets the model to `result[option.label]` and calls `selectCb(result)`.
 * Custom result rendering: #searchResult="{ result, onSelect }".
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { usePagination } from "@/composables/usePagination";

const props = defineProps({
  modelValue: {
    type: String,
  },
  placeholder: String,
  searchCb: {
    type: Function,
    required: true,
  },
  selectCb: {
    type: Function,
    default: null,
  },
  option: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["update:modelValue"]);

const searchReq = usePagination({
  auto: false,
  cache: false,
  cb: (data) => props.searchCb({ ...data }),
});

const listboxId = `search-select-${useId()}`;
const root = ref(null);
const input = ref(null);
const listbox = ref(null);

const value = ref(props.modelValue || "");
const displayValue = ref(props.modelValue || "");
const isOpen = ref(false);
const activeIndex = ref(-1);

const results = computed(() => searchReq.data.value || []);
const hasValue = computed(() => !!(searchReq.search.value || value.value));

/* ---------- Sync with v-model ---------- */
watch(value, () => emit("update:modelValue", value.value));
watch(
  () => props.modelValue,
  (next) => {
    value.value = next || "";
    displayValue.value = next || "";
  }
);

/* ---------- Search ---------- */
watch(
  () => searchReq.search.value,
  (term) => {
    activeIndex.value = -1;
    if (term) searchReq.send();
  }
);

/* ---------- Open / close ---------- */
// Only one SearchSelect open at a time
const CLOSE_OTHERS = "closeSearchDropdown";
function onOtherOpened(e) {
  if (e.detail?.id !== listboxId) close();
}

function open() {
  if (isOpen.value) return;
  window.dispatchEvent(new CustomEvent(CLOSE_OTHERS, { detail: { id: listboxId } }));
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
  activeIndex.value = -1;
}

function onPointerDownOutside(e) {
  if (isOpen.value && root.value && !root.value.contains(e.target)) close();
}

function onFocusOut(e) {
  if (!root.value?.contains(e.relatedTarget)) close();
}

onMounted(() => {
  window.addEventListener(CLOSE_OTHERS, onOtherOpened);
  document.addEventListener("pointerdown", onPointerDownOutside);
});
onBeforeUnmount(() => {
  window.removeEventListener(CLOSE_OTHERS, onOtherOpened);
  document.removeEventListener("pointerdown", onPointerDownOutside);
});

/* ---------- Actions ---------- */
function handleInput(ev) {
  displayValue.value = "";
  searchReq.search.value = ev.target.value;
  if (ev.target.value) open();
}

function selectRow(result) {
  const label = result?.[props.option.label];
  value.value = label;
  displayValue.value = label;
  props.selectCb?.(result);
  close();
  setTimeout(() => {
    searchReq.search.value = "";
  }, 100);
}

function clearSearch() {
  value.value = "";
  displayValue.value = "";
  searchReq.search.value = "";
  searchReq.data.value = [];
  props.selectCb?.(null);
  input.value?.focus();
  open();
}

/* ---------- Keyboard (default result list) ---------- */
function moveActive(step) {
  if (!isOpen.value) open();
  const count = results.value.length;
  if (!count) return;
  activeIndex.value = (activeIndex.value + step + count) % count;
  nextTick(() => {
    listbox.value?.querySelector(`#${listboxId}-opt-${activeIndex.value}`)?.scrollIntoView({ block: "nearest" });
  });
}

function onKeydown(e) {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      moveActive(1);
      break;
    case "ArrowUp":
      e.preventDefault();
      moveActive(-1);
      break;
    case "Enter":
      if (isOpen.value && activeIndex.value >= 0 && results.value[activeIndex.value]) {
        e.preventDefault();
        selectRow(results.value[activeIndex.value]);
      }
      break;
    case "Escape":
      if (isOpen.value) {
        e.stopPropagation();
        close();
      }
      break;
  }
}

const activeDescendant = computed(() =>
  isOpen.value && activeIndex.value >= 0 ? `${listboxId}-opt-${activeIndex.value}` : undefined
);
</script>

<template>
  <div ref="root" class="relative w-full focus-within:z-50" @focusout="onFocusOut">
    <!-- Field -->
    <div
      class="flex items-center w-full rounded-lg border shadow-[0_1px_2px_0_rgb(16_24_40/0.04)] transition-[border-color,box-shadow] bg-surface h-control"
      :class="isOpen ? 'border-primary shadow-focus' : 'border-line-strong hover:border-ink-subtle/60 focus-within:border-primary focus-within:shadow-focus'"
    >
      <svg class="ml-3 w-4 h-4 shrink-0 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        ref="input"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        :aria-label="placeholder || 'Search'"
        :placeholder="placeholder || 'Search…'"
        :value="displayValue || searchReq.search.value"
        class="flex-1 px-2.5 h-full min-w-0 text-base bg-transparent sm:text-sm text-ink placeholder:text-ink-subtle/80 focus-visible:outline-none"
        @focus="open"
        @click="open"
        @input="handleInput"
        @keydown="onKeydown"
      />

      <!-- Fixed-width trailing slot so the field doesn't resize as the spinner/clear button toggles -->
      <span class="grid place-items-center mr-1.5 w-7 h-7 shrink-0">
      <span v-if="searchReq.pending.value" class="grid place-items-center w-4 h-4 text-ink-subtle" aria-hidden="true">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      </span>
      <button
        v-else-if="hasValue"
        type="button"
        class="grid place-items-center w-7 h-7 rounded-md text-ink-subtle hover:bg-surface-muted hover:text-ink"
        aria-label="Clear selection"
        @click.prevent.stop="clearSearch"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </button>
      </span>
    </div>

    <!-- Results -->
    <div
      v-if="isOpen"
      class="overflow-hidden absolute inset-x-0 top-full z-50 mt-1.5 rounded-xl border animate-pop-in border-line bg-surface shadow-pop"
      @mousedown.prevent
    >
      <!-- mousedown.prevent keeps focus in the input so clicks on (custom) results register -->
      <div v-if="searchReq.pending.value && !results.length" class="flex gap-2 justify-center items-center px-4 py-6 text-sm text-ink-muted" role="status">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        Searching…
      </div>

      <div v-else-if="!results.length" class="px-4 py-6 text-sm text-center text-ink-muted" role="status">
        {{ !searchReq.dirty.value ? "Start typing to search" : "No results found" }}
      </div>

      <div
        v-else
        :id="listboxId"
        ref="listbox"
        role="listbox"
        :aria-label="placeholder || 'Results'"
        class="overflow-y-auto overscroll-contain p-1 max-h-72"
        :class="{ 'opacity-60': searchReq.pending.value }"
      >
        <slot name="searchResult" :result="results" :onSelect="selectRow">
          <div
            v-for="(result, idx) in results"
            :id="`${listboxId}-opt-${idx}`"
            :key="result[option.value] || idx"
            role="option"
            :aria-selected="idx === activeIndex"
            class="flex gap-3 items-center px-2.5 py-2 rounded-lg cursor-pointer"
            :class="idx === activeIndex ? 'bg-primary/[0.07]' : 'hover:bg-surface-muted'"
            @mouseenter="activeIndex = idx"
            @click="selectRow(result)"
          >
            <span class="grid place-items-center w-8 h-8 text-xs font-semibold rounded-md shrink-0 bg-primary/[0.07] text-primary" aria-hidden="true">
              {{ String(result[option.label] || "?").trim().charAt(0).toUpperCase() }}
            </span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium truncate text-ink">{{ result[option.label] }}</span>
              <span v-if="result.email || result.telephone" class="block text-xs truncate text-ink-subtle">
                {{ result.email || result.telephone }}
              </span>
            </span>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
