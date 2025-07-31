import { computed, provide, ref, watch, type Ref } from "vue";
import { useTablePagination } from "./useTablePagination";
import { useApiRequest } from "./useApiRequest";
import { onUnmounted } from "vue";
import type { AsyncResponse } from "@/types/interface";

type DataFetcherFunction<T> = (...arg: any) => Promise<AsyncResponse<T>>;

interface PaginationOptions<T> {
  cb: DataFetcherFunction<T>;
  store?: any;
  auto?: boolean;
  cache?: boolean;
  reset?: boolean;
  watch?: Ref[];
}

export function usePagination<T>(options: PaginationOptions<T>) {
  const paginationOptions = ref({
    store: null,
    auto: true,
    perPage: 25,
    cache: false,
    watch: [],
    ...(options || {}),
  });

  const search = ref("");
  const perPage = ref(paginationOptions.value.perPage);

  const req = useApiRequest<T>();

  const searching = ref(false);
  const searchPagination = useTablePagination(perPage.value);
  const pagination = useTablePagination(perPage.value);

  function getPaginationData(next = true, current = false) {
    if (searching.value) {
      return JSON.parse(
        JSON.stringify({
          searchKey: search.value || undefined,
          search: search.value || undefined,
          page: next
            ? !current
              ? ++searchPagination.page.value
              : searchPagination.page.value
            : --searchPagination.page.value,
          limit: searchPagination.limit.value || 25,
        })
      );
    } else {
      return JSON.parse(
        JSON.stringify({
          searchKey: search.value || undefined,
          search: search.value || undefined,
          page: next
            ? !current
              ? ++pagination.page.value
              : pagination.page.value
            : --pagination.page.value,
          limit: pagination.limit.value || 25,
        })
      );
    }
  }

  function fetch(next = true, current = false, cache = false) {
    if (req.pending.value || (next && pagination.done.value)) return;

    if (paginationOptions.value.store && paginationOptions.value.reset) {
      paginationOptions.value.store.set([]);
    }

    req.send(
      () => paginationOptions.value.cb(getPaginationData(next, current)),
      (res) => {
        if (paginationOptions.value.store && res.success) {
          paginationOptions.value.store.set(res.data || []);
        }

        pagination.totalPages.value = (res.data as any)?.[0]?.totalPages || 1;
        if (res.success && (res.data as any)?.length < pagination.limit.value) {
          pagination.done.value = true;
        }
      },
      true
    );
  }

  let controller: AbortController;
  let timeout: number;

  onUnmounted(() => {
    if (controller) {
      controller.abort();
    }
  });
  function fetchSearch(next = true, current = false) {
    if (next && searchPagination.done.value) return;

    if (controller) controller.abort();
    if (timeout) clearTimeout(timeout);
    controller = new AbortController();

    if (paginationOptions.value.store) {
      paginationOptions.value.store.set([]);
    }

    timeout = setTimeout(() => {
      req.send(
        () =>
          paginationOptions.value.cb(getPaginationData(next, current), {
            signal: controller.signal,
          }),
        (res) => {
          if (paginationOptions.value.store && res.success) {
            paginationOptions.value.store.set(res.data || []);
          }
          searchPagination.totalPages.value =
            (res.data as any)?.[0]?.totalPages || 1;
          if (
            res?.success &&
            (res.data as any)?.length < searchPagination.limit.value
          ) {
            searchPagination.done.value = true;
          }
        },
        true
      );
    }, 500);
  }

  function next() {
    if (searching.value) {
      fetchSearch();
    } else {
      fetch(true, false, paginationOptions.value.cache);
    }
  }

  function previous() {
    if (searching.value && searchPagination.page.value == 1) return;
    if (!searching.value && pagination.page.value == 1) return;

    if (searching.value) {
      fetchSearch(false);
      searchPagination.done.value = false;
    } else {
      pagination.done.value = false;
      fetch(false, false, paginationOptions.value.cache);
    }
  }

  watch(search, () => {
    searchPagination.done.value = false;
    searchPagination.page.value = 0;
    if (search.value) {
      searching.value = true;
      fetchSearch(true, false);
    } else if (!search.value) {
      searching.value = false;
      pagination.done.value = false;
      fetch(true, true, paginationOptions.value.cache);
    }
  });

  const auto = computed(() => paginationOptions.value.auto);
  watch(auto, () => fetch(), {
    immediate: paginationOptions.value.auto,
  });

  watch(perPage, () => {
    pagination.reset(perPage.value);
    searchPagination.reset(perPage.value);
    if (search.value) {
      searching.value = true;
      fetchSearch(true, true);
    } else {
      searching.value = false;
      fetch(true, true, paginationOptions.value.cache);
    }
  });

  watch(paginationOptions.value.watch, () => {
    send();
  });

  provide("next", next);
  provide("previous", previous);
  provide("searchPage", searchPagination.page);
  provide("searchTotalPages", searchPagination.totalPages);
  provide("page", pagination.page);
  provide("totalPages", pagination.totalPages);
  provide("searching", searching);

  const page = computed(() => {
    return searching.value
      ? searchPagination.page.value
      : pagination.page.value;
  });

  function send() {
    pagination.reset();
    searchPagination.reset();
    fetch();
  }

  return {
    page,
    search,
    perPage,
    send,
    totalPages: req.response.value?.totalPages || 0,
    data:
      paginationOptions.value.store && !searching.value
        ? paginationOptions.value.store.getAll()
        : req.response || [],
    error: req.error,
    pending: req.pending,
    dirty: req.dirty,
    next,
    previous,
  };
}
