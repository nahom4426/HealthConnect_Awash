import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PAGE_SIZE } from "../constants";

/**
 * Server-paged list whose filters, sort and page live in the URL query (plan section 1), so a
 * filtered list can be shared and Back restores it.
 *
 * @param {(params: object) => Promise<{ ok, data?, error? }>} fetcher  list endpoint
 * @param {{ filters: Record<string, string | string[]>, sort?: string }} defaults
 *   filter keys with their empty values; array values are multi-selects ("a,b" in the URL)
 */
export function useListQuery(fetcher, { filters: filterDefaults = {}, sort: sortDefault = "" } = {}) {
  const route = useRoute();
  const router = useRouter();

  const fromQuery = (key, empty) => {
    const v = route.query[key];
    if (Array.isArray(empty)) return v ? String(v).split(",").filter(Boolean) : [];
    return v === undefined ? empty : String(v);
  };

  const filters = reactive(Object.fromEntries(Object.entries(filterDefaults).map(([k, empty]) => [k, fromQuery(k, empty)])));
  const sort = ref(String(route.query.sort ?? sortDefault));
  const page = ref(Math.max(1, Number(route.query.page) || 1));

  const rows = ref([]);
  const total = ref(0);
  const loading = ref(true);
  const error = ref(null);
  let seq = 0;

  const isFiltered = computed(() =>
    Object.entries(filterDefaults).some(([k, empty]) => (Array.isArray(empty) ? filters[k].length : filters[k] !== empty))
  );

  function apiParams() {
    const p = { page: page.value - 1, size: PAGE_SIZE };
    if (sort.value) p.sort = sort.value;
    for (const [k, v] of Object.entries(filters)) {
      if (Array.isArray(v) ? v.length : v !== "" && v !== undefined) p[k] = Array.isArray(v) ? v.join(",") : v;
    }
    return p;
  }

  async function load() {
    const mine = ++seq;
    loading.value = true;
    error.value = null;
    const res = await fetcher(apiParams());
    if (mine !== seq) return;
    loading.value = false;
    if (res.ok) {
      rows.value = res.data?.content ?? [];
      total.value = res.data?.totalElements ?? rows.value.length;
    } else {
      error.value = res.error;
    }
  }

  function syncUrl() {
    const q = { ...route.query };
    for (const [k, v] of Object.entries(filters)) {
      const empty = filterDefaults[k];
      if (Array.isArray(v) ? v.length : v !== empty) q[k] = Array.isArray(v) ? v.join(",") : v;
      else delete q[k];
    }
    if (sort.value && sort.value !== sortDefault) q.sort = sort.value;
    else delete q.sort;
    if (page.value > 1) q.page = String(page.value);
    else delete q.page;
    router.replace({ query: q });
  }

  // Filter changes are debounced 300 ms (search typing) and send the list back to page 1
  let timer;
  watch(
    () => JSON.stringify(filters),
    () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        page.value = 1;
        syncUrl();
        load();
      }, 300);
    }
  );
  watch([sort, page], () => {
    syncUrl();
    load();
  });

  function reset() {
    Object.entries(filterDefaults).forEach(([k, empty]) => (filters[k] = Array.isArray(empty) ? [] : empty));
  }

  /** Header click: asc → desc → asc on the same column; a new column starts desc. */
  function toggleSort(field) {
    const [f, dir] = sort.value.split(",");
    sort.value = f === field && dir === "desc" ? `${field},asc` : `${field},desc`;
  }

  load();

  return { filters, sort, page, rows, total, loading, error, isFiltered, load, reset, toggleSort, pageSize: PAGE_SIZE };
}
