<script setup>
// Inline editor for a Life rate table (group term, individual term, rider rates).
// It never calls the API itself: the page passes the rows it loaded and handles the
// emitted save / remove / import with the matching endpoints, then reloads.
import { computed, ref, watch } from "vue";
import Button from "@/components/Button.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { countChanges, toSavePayload, validateRateRows } from "../rates/rateTables";

const props = defineProps({
  spec: { type: Object, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  loadError: { type: String, default: "" },
  defaultStatus: { type: String, default: "ACTIVE" },
  /** fixed fields sent with every saved row, e.g. { riderUuid } */
  extra: { type: Object, default: () => ({}) },
  importable: { type: Boolean, default: false },
  importing: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  /** emit the full list on save (for bulk endpoints that may replace the whole set) */
  sendAll: { type: Boolean, default: false },
  /** keep rows in the order given instead of sorting by the first column */
  keepOrder: { type: Boolean, default: false },
  /** empty-state hint override */
  emptyHint: { type: String, default: "" },
  /** part of a multi-step form: no save/discard, the parent calls collect() */
  collectOnly: { type: Boolean, default: false },
});
const emit = defineEmits(["save", "remove", "import", "retry"]);

let seq = 0;
const editRows = ref([]);
const filter = ref("");
const showErrors = ref(false);
const fileInput = ref(null);

function reset() {
  editRows.value = props.rows.map((r) => ({ ...r, _key: r[props.spec.idField] || `n${seq++}` }));
  showErrors.value = false;
}
watch(() => props.rows, reset, { immediate: true });

const firstKey = computed(() => props.spec.columns[0].key);
const visibleRows = computed(() => {
  const q = filter.value.trim();
  const list = q ? editRows.value.filter((r) => cellText(r, props.spec.columns[0]).toLowerCase().startsWith(q.toLowerCase())) : editRows.value;
  if (props.keepOrder) return list;
  // Rows from the backend in key order; new rows stay at the bottom while being typed
  return [...list].sort((a, b) => {
    const an = !a[props.spec.idField], bn = !b[props.spec.idField];
    if (an !== bn) return an ? 1 : -1;
    return Number(a[firstKey.value]) - Number(b[firstKey.value]) || Number(a.term ?? 0) - Number(b.term ?? 0);
  });
});

function cellText(row, c) {
  if (c.type === "select") return c.options.find((o) => o.value === row[c.key])?.label ?? "";
  if (c.type === "bool") return row[c.key] ? "Yes" : "—";
  return String(row[c.key] ?? "");
}

const payload = computed(() => toSavePayload(props.spec, editRows.value, props.rows, props.extra, { all: props.sendAll }));
const changedCount = computed(() => countChanges(props.spec, editRows.value, props.rows));
const validation = computed(() => validateRateRows(props.spec, editRows.value));
const errorFor = (row, key) => (showErrors.value ? validation.value.fieldErrors[row._key]?.[key] : "");

function addRow() {
  const blank = { _key: `n${seq++}` };
  for (const c of props.spec.columns) blank[c.key] = c.type === "status" ? props.defaultStatus : c.type === "select" ? (c.default ?? "") : c.type === "bool" ? false : "";
  editRows.value.push(blank);
  filter.value = "";
}

function removeRow(row) {
  if (!row[props.spec.idField]) {
    editRows.value = editRows.value.filter((r) => r._key !== row._key);
  } else {
    emit("remove", row);
  }
}

function save() {
  showErrors.value = true;
  if (!validation.value.valid || !changedCount.value) return;
  emit("save", payload.value);
}

/** For multi-step forms: show errors and return the rows as request bodies (no API call). */
function collect() {
  showErrors.value = true;
  return { valid: validation.value.valid, rows: toSavePayload(props.spec, editRows.value, [], props.extra, { all: true }) };
}
// editRows lets a parent show a live preview of what is being typed
defineExpose({ collect, editRows });

function pickFile() {
  fileInput.value?.click();
}
function onFile(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (file) emit("import", file);
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 border-b border-line">
      <div class="flex gap-3 items-center">
        <label class="relative">
          <span class="sr-only">Filter by {{ spec.columns[0].label.toLowerCase() }}</span>
          <svg class="absolute left-2.5 top-1/2 w-4 h-4 -translate-y-1/2 text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" stroke-linecap="round" /></svg>
          <input
            v-model="filter"
            :inputmode="['select', 'text'].includes(spec.columns[0].type) ? 'text' : 'numeric'"
            :placeholder="`Find ${spec.columns[0].label.toLowerCase()}`"
            class="pl-8 pr-3 w-44 h-9 text-sm rounded-lg border outline-none bg-surface-muted border-line focus:border-primary focus:ring-2 focus:ring-primary/15 text-ink"
          />
        </label>
        <span class="text-xs text-ink-subtle">{{ editRows.length }} row{{ editRows.length === 1 ? "" : "s" }}</span>
      </div>
      <div v-if="!readonly" class="flex flex-wrap gap-2 items-center">
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile" />
        <Button v-if="importable" variant="outline" size="sm" :pending="importing" @click="pickFile">Import Excel</Button>
        <Button variant="outline" size="sm" @click="addRow">Add row</Button>
        <Button v-if="changedCount && !collectOnly" variant="ghost" size="sm" :disabled="saving" @click="reset">Discard</Button>
        <Button v-if="!collectOnly" size="sm" :pending="saving" :disabled="!changedCount" @click="save">
          {{ changedCount ? `Save ${changedCount} change${changedCount === 1 ? "" : "s"}` : "No changes" }}
        </Button>
      </div>
    </div>

    <!-- Table-level problems -->
    <div v-if="showErrors && (validation.tableErrors.length || !validation.valid)" role="alert" class="px-4 py-2.5 text-sm border-b bg-error-soft border-line text-error-strong">
      <p class="font-semibold">Fix the highlighted cells before saving.</p>
      <ul v-if="validation.tableErrors.length" class="mt-1 list-disc list-inside">
        <li v-for="m in validation.tableErrors" :key="m">{{ m }}</li>
      </ul>
    </div>

    <!-- Non-blocking business warnings (e.g. reinsurer shares not adding to 100 %) -->
    <div v-if="!readonly && validation.warnings.length && editRows.length" class="px-4 py-2.5 text-sm border-b bg-warning-soft border-line text-warning-strong">
      <p v-for="w in validation.warnings" :key="w">{{ w }}</p>
    </div>

    <!-- Load error -->
    <div v-if="loadError && !loading" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load {{ spec.title.toLowerCase() }}</p>
      <p class="max-w-md text-sm text-ink-muted">{{ loadError }}</p>
      <Button variant="outline" size="sm" @click="emit('retry')">Try again</Button>
    </div>

    <div v-else class="overflow-auto max-h-[62vh]">
      <table class="w-full text-sm">
        <thead class="sticky top-0 z-10 bg-surface-muted">
          <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
            <th v-for="c in spec.columns" :key="c.key" class="px-3 py-2.5 whitespace-nowrap" :title="c.hint">{{ c.label }}</th>
            <th v-if="!readonly" class="px-3 py-2.5 w-12"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 6" :key="`sk${i}`" class="border-t border-line">
              <td v-for="c in spec.columns" :key="c.key" class="px-3 py-2.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td>
              <td v-if="!readonly"></td>
            </tr>
          </template>
          <tr v-else-if="!visibleRows.length">
            <td :colspan="spec.columns.length + 1" class="px-6 py-12 text-center">
              <p class="text-sm font-semibold text-ink">{{ filter ? "No matching rows" : spec.emptyTitle || "No rates yet" }}</p>
              <p v-if="!filter && !readonly" class="mt-1 text-sm text-ink-muted">{{ emptyHint || `Add rows by hand${importable ? " or import an Excel sheet" : ""}.` }}</p>
            </td>
          </tr>
          <tr
            v-for="row in visibleRows"
            v-else
            :key="row._key"
            :class="['border-t border-line', !row[spec.idField] ? 'bg-primary/5' : 'hover:bg-surface-muted/60']"
          >
            <td v-for="c in spec.columns" :key="c.key" class="px-2 py-1.5 align-top">
              <template v-if="readonly">
                <StatusBadge v-if="c.type === 'status'" :status="row[c.key]" />
                <span v-else class="px-1 tabular-nums text-ink">{{ cellText(row, c) }}</span>
              </template>
              <div v-else-if="c.type === 'select'">
                <select
                  v-model="row[c.key]"
                  :aria-label="c.label"
                  :disabled="c.lockExisting && !!row[spec.idField]"
                  :title="c.lockExisting && row[spec.idField] ? 'Saved rows cannot change this. Delete the row and add a new one.' : undefined"
                  :class="['h-8 px-2 text-sm rounded-md border bg-surface text-ink outline-none focus:border-primary disabled:opacity-70', c.wide ? 'min-w-[12rem]' : '', errorFor(row, c.key) ? 'border-error' : 'border-line']"
                >
                  <option value="" disabled>Select…</option>
                  <option v-for="o in c.options" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <p v-if="errorFor(row, c.key)" class="mt-0.5 text-xs text-error">{{ errorFor(row, c.key) }}</p>
              </div>
              <label v-else-if="c.type === 'bool'" class="inline-flex gap-2 items-center px-1 h-8 text-sm cursor-pointer text-ink-muted">
                <input v-model="row[c.key]" type="checkbox" :aria-label="c.label" class="w-4 h-4 rounded accent-primary" />
                <span class="sr-only">{{ c.label }}</span>
              </label>
              <div v-else-if="c.type === 'text'">
                <input
                  v-model="row[c.key]"
                  type="text"
                  :maxlength="c.maxLength"
                  :aria-label="c.label"
                  :aria-invalid="!!errorFor(row, c.key)"
                  :placeholder="c.optional ? 'Optional' : ''"
                  :class="['h-8 px-2 text-sm rounded-md border bg-surface text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15', c.wide ? 'w-64' : 'w-40', errorFor(row, c.key) ? 'border-error' : 'border-line']"
                />
                <p v-if="errorFor(row, c.key)" class="mt-0.5 text-xs text-error">{{ errorFor(row, c.key) }}</p>
              </div>
              <select
                v-else-if="c.type === 'status'"
                v-model="row[c.key]"
                :aria-label="c.label"
                :class="['h-8 px-2 text-sm rounded-md border bg-surface text-ink outline-none focus:border-primary', errorFor(row, c.key) ? 'border-error' : 'border-line']"
              >
                <option v-for="s in c.statuses" :key="s" :value="s">{{ s.charAt(0) + s.slice(1).toLowerCase() }}</option>
              </select>
              <div v-else>
                <input
                  v-model="row[c.key]"
                  type="number"
                  :step="c.type === 'int' ? 1 : 'any'"
                  :min="c.min"
                  :aria-label="c.label"
                  :aria-invalid="!!errorFor(row, c.key)"
                  :class="['w-24 h-8 px-2 text-sm text-right tabular-nums rounded-md border bg-surface text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15', errorFor(row, c.key) ? 'border-error' : 'border-line']"
                />
                <p v-if="errorFor(row, c.key)" class="mt-0.5 text-xs text-error">{{ errorFor(row, c.key) }}</p>
              </div>
            </td>
            <td v-if="!readonly" class="px-2 py-1.5 text-right align-top">
              <button
                type="button"
                class="grid place-items-center w-8 h-8 rounded-md text-ink-subtle hover:bg-error-soft hover:text-error"
                :aria-label="row[spec.idField] ? 'Delete row' : 'Remove new row'"
                :title="row[spec.idField] ? 'Delete row' : 'Remove new row'"
                @click="removeRow(row)"
              >
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h12M8 6V4h4v2m-6 0l1 10h6l1-10" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
