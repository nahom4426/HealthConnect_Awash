import { ref, watch } from "vue";
import { useLifeResource } from "./useLifeResource";

/**
 * Server-paged Life list (page/limit/search/status query params).
 * @param {(params: { page: number, limit: number, search?: string, status?: string }) => Promise<any>} fetcher
 */
export function useLifePagedList(fetcher, { status = "", limit = 20 } = {}) {
  const page = ref(1);
  const search = ref("");
  const statusRef = ref(status);
  const totalPages = ref(1);
  const totalElements = ref(null);
  const { data, loading, error, load } = useLifeResource(fetcher, {
    initial: [],
    // Older lists: a plain array with totalPages (and totalElements) on each item. Newer lists:
    // { content, page, limit, totalPages, totalElements } (contract 2026-10)
    map: (d) => {
      const rows = Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : [];
      const meta = Array.isArray(d) ? rows[0] : d;
      totalPages.value = Math.max(1, Number(meta?.totalPages) || 1);
      totalElements.value = Number(meta?.totalElements) || null;
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

  return { rows: data, loading, error, page, totalPages, totalElements, search, status: statusRef, reload };
}
