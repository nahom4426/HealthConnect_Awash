import { computed, provide, ref, watch } from "vue";
import { useTablePagination } from "./useTablePagination";
import { useApiRequest } from "./useApiRequest";

export function usePagination(options = {}) {
  console.log("Initializing usePagination with options:", options);

  const paginationOptions = ref({
    cb: (f) => f,
    store: null,
    auto: true,
    perPage: 25,
    totalElements: 0,
    cache: false,
    ...(options || {}),
  });

  const search = ref("");
  const perPage = ref(paginationOptions.value.perPage);
  const totalElements = ref(paginationOptions.value.totalElements || 0);

  const req = useApiRequest();
  const searching = ref(false);
  const searchPagination = useTablePagination(perPage.value);
  const pagination = useTablePagination(perPage.value);

function getPaginationData(next = true, current = false) {
  const pageValue = next
    ? !current
      ? searching.value
        ? ++searchPagination.page.value
        : ++pagination.page.value
      : searching.value
      ? searchPagination.page.value
      : pagination.page.value
    : searching.value
    ? --searchPagination.page.value
    : --pagination.page.value;

  const limitValue = Number(perPage.value); // ✅ Convert to number in case it's reactive

  const data = {
    searchKey: search.value || "",
    search: search.value || "",
    page: pageValue,
    size: limitValue || 25, // ✅ fallback to 25
  };

  console.log("Generated pagination data:", data);
  return data;
}


  function extractPaginationData(response) {
    console.group("Extracting pagination data from response");
    console.log("Full response:", response);

    let data;
    if (response?.success) {
      data = response.data;
    } else {
      data = response;
    }

    const elementsCount = data?.numberOfElements ?? data?.totalElements ?? 0;

    const result = {
      content: data?.content || [],
      totalElements: elementsCount,
      totalPages: data?.totalPages || 1,
      perPage: data?.size || data?.pageable?.pageSize || perPage.value,
    };

    console.log("Extracted data:", result);
    console.groupEnd();
    return result;
  }

  function fetch(next = true, current = false, cache = false) {
    if (req.pending.value) return;

    if (next && pagination.done.value) return;

    const paginationData = getPaginationData(next, current);
   paginationData.limit = Number(perPage.value) || 25;
// ✅ Ensure limit is number

    req.send(
      () => paginationOptions.value.cb(paginationData),
      (res) => {
        const { content, totalElements: total, totalPages, perPage: pageSize } =
          extractPaginationData(res?.data || res);

        if (paginationOptions.value.store) {
          paginationOptions.value.store.set(content);
        }

        pagination.totalPages.value = totalPages;
        totalElements.value = total;
        paginationOptions.value.totalElements = total;
        perPage.value = pageSize;

        // ✅ Only mark as done if we’re truly at the end
        pagination.done.value =
          pagination.page.value >= totalPages ||
          content.length < pagination.limit.value;
      },
      true
    );
  }

  let controller;
  let timeout;

  function fetchSearch(next = true, current = false) {
    if (next && searchPagination.done.value) return;

    if (controller) controller.abort();
    if (timeout) clearTimeout(timeout);
    controller = new AbortController();

    if (paginationOptions.value.store) {
      paginationOptions.value.store.set([]);
    }

    timeout = setTimeout(() => {
      const paginationData = getPaginationData(next, current);
     paginationData.limit = Number(perPage.value) || 25;


      req.send(
        () => ({
          ...paginationData,
          signal: controller.signal,
        }),
        (res) => {
          if (!res?.success) return;

          const { content, totalElements: total, totalPages } =
            extractPaginationData(res.data);

          if (paginationOptions.value.store) {
            paginationOptions.value.store.set(content);
          }

          searchPagination.totalPages.value = totalPages;
          totalElements.value = total;

          searchPagination.done.value =
            searchPagination.page.value >= totalPages ||
            content.length < searchPagination.limit.value;
        },
        true
      );
    }, 20);
  }

  function next() {
    if (searching.value) {
      fetchSearch();
    } else {
      fetch(true, false, paginationOptions.value.cache);
    }
  }

  function previous() {
    if (searching.value) {
      if (searchPagination.page.value <= 1) return;
      searchPagination.done.value = false;
      fetchSearch(false);
    } else {
      if (pagination.page.value <= 1) return;
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
    } else if (!search.value && paginationOptions.value.auto) {
      searching.value = false;
      pagination.done.value = false;
      fetch(true, true, paginationOptions.value.cache);
    }
  });

  const auto = computed(() => paginationOptions.value.auto);
  watch(auto, fetch, {
    immediate: paginationOptions.value.auto,
  });

  provide("next", next);
  provide("previous", previous);
  provide("searchPage", searchPagination.page);
  provide("searchTotalPages", searchPagination.totalPages);
  provide("page", pagination.page);
  provide("totalPages", pagination.totalPages);
  provide("searching", searching);
  provide("send", send);
  provide("sendPagination", sendPagination);
  provide("perPage", computed(() => perPage.value));
  provide("totalElements", computed(() => totalElements.value));

  const page = computed(() => {
    return searching.value
      ? searchPagination.page.value
      : pagination.page.value;
  });

  function send() {
    pagination.reset(perPage.value);
    searchPagination.reset(perPage.value);
    fetch();
  }

  function sendPagination(limit, pageValue) {
    if (pageValue) {
      pagination.reset(perPage.value);
      searchPagination.reset(perPage.value);
      pagination.page.value = pageValue;
    } else {
      perPage.value = limit;
      pagination.reset(limit);
      searchPagination.reset(limit);
    }

    fetch();
  }

  return {
    page: computed(() => {
      const p = searching.value
        ? searchPagination.page.value
        : pagination.page.value;
      return p;
    }),
    search,
    perPage,
    totalElements: computed(() => totalElements.value),
    send,
    sendPagination,
    totalPages: computed(() =>
      searching.value
        ? searchPagination.totalPages.value
        : pagination.totalPages.value
    ),
    data: computed(() =>
      paginationOptions.value.store && !searching.value
        ? paginationOptions.value.store.getAll()
        : req.response.value?.content || req.response.value?.data || []
    ),
    error: req.error,
    pending: req.pending,
    dirty: req.dirty,
    next,
    previous,
  };
}
