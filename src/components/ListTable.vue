<script setup>
// Card table for list pages that load their rows themselves: loading skeleton, error with retry,
// empty state, optional clickable rows and a footer slot for paging. For tables driven by the
// injected pagination of the older pages, use components/Table.vue.
//
// columns: [{ key, label, align?: 'left' | 'right', class?: string, srOnly?: boolean }]
// slots:   #cell-<key>="{ row, index }"  (default: row[key] ?? "—"), #toolbar, #empty, #footer
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  /** property name or (row) => key */
  rowKey: { type: [String, Function], required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  /** shown above the error message */
  errorTitle: { type: String, default: "Couldn't load the list" },
  emptyTitle: { type: String, default: "Nothing here yet" },
  emptyHint: { type: String, default: "" },
  skeletonRows: { type: Number, default: 5 },
  /** rows are links: pointer, hover, Enter key */
  clickable: { type: Boolean, default: false },
  /** render without the card border (inside another card) */
  bare: { type: Boolean, default: false },
});
const emit = defineEmits(["row-click", "retry"]);

// Buttons, links and inputs inside a clickable row act on their own; they don't open the row
const fromControl = (e) => e.target !== e.currentTarget && !!e.target.closest?.("button, a, input, select, textarea, label");
function onRow(e, row) {
  if (props.clickable && !fromControl(e)) emit("row-click", row);
}

const keyOf = (row, i) => (typeof props.rowKey === "function" ? props.rowKey(row, i) : row?.[props.rowKey] ?? i);
const alignClass = (c) => (c.align === "right" ? "text-right" : "text-left");
</script>

<template>
  <section :class="bare ? '' : 'overflow-hidden rounded-2xl border bg-surface border-line shadow-card'">
    <slot name="toolbar" />

    <div v-if="error && !loading" class="flex flex-col gap-3 items-center px-6 py-12 text-center" role="alert">
      <p class="text-sm font-semibold text-ink">{{ errorTitle }}</p>
      <p class="max-w-md text-sm text-ink-muted">{{ error }}</p>
      <button type="button" class="px-3 h-8 text-sm font-medium rounded-lg border border-line text-ink hover:bg-surface-muted" @click="emit('retry')">Try again</button>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead :class="bare ? '' : 'bg-surface-muted'">
          <tr class="text-xs font-semibold tracking-wide uppercase text-ink-subtle">
            <th v-for="c in columns" :key="c.key" scope="col" :class="['px-4 py-3 whitespace-nowrap', alignClass(c), c.class]">
              <span :class="c.srOnly && 'sr-only'">{{ c.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="`sk${i}`" class="border-t border-line">
              <td v-for="c in columns" :key="c.key" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td>
            </tr>
          </template>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="px-6 py-14 text-center">
              <slot name="empty">
                <p class="text-sm font-semibold text-ink">{{ emptyTitle }}</p>
                <p v-if="emptyHint" class="mt-1 text-sm text-ink-muted">{{ emptyHint }}</p>
              </slot>
            </td>
          </tr>
          <tr
            v-for="(row, index) in rows"
            v-else
            :key="keyOf(row, index)"
            :tabindex="clickable ? 0 : undefined"
            :class="['border-t border-line hover:bg-surface-muted/60', clickable && 'cursor-pointer focus:outline-none focus:bg-surface-muted']"
            @click="onRow($event, row)"
            @keydown.enter="onRow($event, row)"
          >
            <td v-for="c in columns" :key="c.key" :class="['px-4 py-3', alignClass(c), c.class]">
              <slot :name="`cell-${c.key}`" :row="row" :index="index">{{ row?.[c.key] ?? "—" }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <slot name="footer" />
  </section>
</template>
