import { ref, watch } from "vue";
import { useLifeResource } from "./useLifeResource";

/**
 * Server-paged Life list (page/limit/search/status query params). The Life API returns a
 * plain array with `totalPages` repeated on each item, like the health backend.
 * @param {(params: { page: number, limit: number, search?: string, status?: string }) => Promise<any>} fetcher
 */
export function useLifePagedList(fetcher, { status = "", limit = 20 } = {}) {
  const page = ref(1);
  const search = ref("");
  const statusRef = ref(status);
  const totalPages = ref(1);
  const { data, loading, error, load } = useLifeResource(fetcher, {
    initial: [],
    map: (d) => {
      const rows = Array.isArray(d) ? d : [];
      totalPages.value = Math.max(1, Number(rows[0]?.totalPages) || 1);
      return rows;
    },
  });

  function reload() {
    const params = { page: page.value, limit };
    if (search.value.trim()) params.search = search.value.trim();
    if (statusRef.value) params.status = statusRef.value;
    return load(params);
  }

  let timer;
  watch(search, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { page.value = 1; reload(); }, 300);
  });
  watch(statusRef, () => { page.value = 1; reload(); });
  watch(page, reload);

  return { rows: data, loading, error, page, totalPages, search, status: statusRef, reload };
}
