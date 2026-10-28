<script setup>
// Server-paged table driven by useListQuery. Skeleton rows while loading, sortable headers,
// pager, and a whole-row link to the record (plan section 3).
// columns: [{ key, label, sortable?, align?: "right", class? }]; cell slot: `cell-<key>` ({ row })
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import PageState from "./PageState.vue";
import { prefetchRoute } from "../composables/prefetch";
import { cardClass } from "./styles";

const props = defineProps({
  columns: { type: Array, required: true },
  list: { type: Object, required: true }, // the object useListQuery returns
  rowLink: { type: Function, default: null },
  rowKey: { type: String, default: "id" },
  emptyTitle: { type: String, default: "Nothing here yet" },
  filteredEmptyTitle: { type: String, default: "No records match these filters" },
});
defineEmits(["row-click"]);

const router = useRouter();
const { t } = useI18n();
const pages = computed(() => Math.max(1, Math.ceil(props.list.total.value / props.list.pageSize)));
const from = computed(() => (props.list.total.value ? (props.list.page.value - 1) * props.list.pageSize + 1 : 0));
const to = computed(() => Math.min(props.list.page.value * props.list.pageSize, props.list.total.value));

function sortState(key) {
  const [f, dir] = String(props.list.sort.value || "").split(",");
  return f === key ? dir : "";
}
function ariaSort(key) {
  const s = sortState(key);
  return s === "asc" ? "ascending" : s === "desc" ? "descending" : "none";
}
function open(row, e) {
  if (!props.rowLink) return;
  const to = props.rowLink(row);
  if (e.metaKey || e.ctrlKey) window.open(router.resolve(to).href, "_blank");
  else router.push(to);
}
</script>

<template>
  <section :class="[cardClass, 'overflow-hidden']">
    <PageState v-if="list.error.value && !list.loading.value" kind="error" :message="list.error.value.message" :correlation-id="list.error.value.correlationId" @retry="list.load()" />
    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th
                v-for="c in columns"
                :key="c.key"
                scope="col"
                :aria-sort="c.sortable ? ariaSort(c.key) : undefined"
                :class="['px-4 py-3 whitespace-nowrap', c.align === 'right' ? 'text-right' : '']"
              >
                <button v-if="c.sortable" type="button" class="inline-flex gap-1 items-center uppercase hover:text-ink" @click="list.toggleSort(c.key)">
                  {{ c.label }}
                  <span aria-hidden="true" class="text-[10px]">{{ sortState(c.key) === "asc" ? "▲" : sortState(c.key) === "desc" ? "▼" : "↕" }}</span>
                </button>
                <span v-else>{{ c.label }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="list.loading.value && !list.rows.value.length">
              <tr v-for="i in 6" :key="i" class="border-t border-line">
                <td v-for="c in columns" :key="c.key" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td>
              </tr>
            </template>
            <tr v-else-if="!list.rows.value.length">
              <td :colspan="columns.length">
                <PageState kind="empty" :title="list.isFiltered.value ? filteredEmptyTitle : emptyTitle">
                  <slot name="empty" :filtered="list.isFiltered.value" />
                </PageState>
              </td>
            </tr>
            <tr
              v-for="row in list.rows.value"
              v-else
              :key="row[rowKey]"
              :class="['border-t border-line', rowLink ? 'cursor-pointer hover:bg-surface-muted/60' : '', list.loading.value ? 'opacity-60' : '']"
              @click="open(row, $event)"
              @mouseenter="rowLink && prefetchRoute(router, rowLink(row))"
            >
              <td v-for="c in columns" :key="c.key" :class="['px-4 py-3 align-top', c.align === 'right' ? 'text-right tabular-nums' : '', c.class ?? '']">
                <slot :name="`cell-${c.key}`" :row="row">
                  <RouterLink v-if="rowLink && c === columns[0]" :to="rowLink(row)" class="font-semibold text-ink hover:text-primary" @click.stop>{{ row[c.key] ?? "—" }}</RouterLink>
                  <span v-else>{{ row[c.key] ?? "—" }}</span>
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer v-if="list.total.value > 0" class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 text-xs border-t border-line text-ink-muted">
        <span>{{ t("list.range", { from, to, total: list.total.value }) }}</span>
        <div class="flex gap-1 items-center">
          <button type="button" class="px-2.5 h-8 rounded-lg border border-line disabled:opacity-40 hover:bg-surface-muted" :disabled="list.page.value <= 1" @click="list.page.value--">{{ t("list.previous") }}</button>
          <span class="px-2">{{ t("list.page", { page: list.page.value, pages }) }}</span>
          <button type="button" class="px-2.5 h-8 rounded-lg border border-line disabled:opacity-40 hover:bg-surface-muted" :disabled="list.page.value >= pages" @click="list.page.value++">{{ t("list.next") }}</button>
        </div>
      </footer>
    </template>
  </section>
</template>
