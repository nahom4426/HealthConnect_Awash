import { computed, provide, ref, watch, onUnmounted } from "vue";
import { useTablePagination } from "./useTablePagination";
import { useApiRequest } from "./useApiRequest";

export function usePagination(options) {
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
  const currentPage = ref(1); // Now 1-based for both API and UI
  const totalPages = ref(1);
  const totalElements = ref(0);

  const req = useApiRequest();

  const searching = ref(false);
  const searchPagination = useTablePagination(perPage.value);
  const pagination = useTablePagination(perPage.value);

  // Provide pagination data to child components
  provide("page", currentPage); // Already 1-based
  provide("totalPages", totalPages);
  provide("totalElements", totalElements);
  provide("perPage", perPage);
  provide("sendPagination", (limit, page) => {
    perPage.value = parseInt(limit);
    currentPage.value = parseInt(page);
    fetch();
  });
  provide("pageChanger", (pageNum) => {
    currentPage.value = pageNum; // No conversion needed
    fetch();
  });
  provide("next", () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value += 1;
      fetch();
    }
  });
  provide("previous", () => {
    if (currentPage.value > 1) {
      currentPage.value -= 1;
      fetch();
    }
  });

  function fetch() {
    if (!paginationOptions.value.cb) return;

    const params = {
      page: currentPage.value, // Now sending 1-based to API
      limit: perPage.value,
      search: search.value,
    };

    req.send(
      () => paginationOptions.value.cb(params),
      (response) => {
        const data = response?.data || response;
        
        if (data?.content) {
          // Handle paginated response
          if (paginationOptions.value.store) {
            paginationOptions.value.store.set(data.content);
          }
          totalPages.value = data.totalPages || 1;
          totalElements.value = data.totalElements || data.content.length;
          currentPage.value = data.page || 1; // Default to 1 if not provided
        } else if (Array.isArray(data)) {
          // Handle array response
          if (paginationOptions.value.store) {
            paginationOptions.value.store.set(data);
          }
          totalElements.value = data.length;
          totalPages.value = 1;
        }
      }
    );
  }

  function send() {
    currentPage.value = 1; // Reset to first page (1-based)
    fetch();
  }

  function next() {
    if (currentPage.value < totalPages.value) {
      currentPage.value += 1;
      fetch();
    }
  }

  function previous() {
    if (currentPage.value > 1) {
      currentPage.value -= 1;
      fetch();
    }
  }

  // Auto-fetch if enabled
  if (paginationOptions.value.auto) {
    fetch();
  }

  return {
    page: currentPage, // Already 1-based
    search,
    perPage,
    send,
    fetch,
    totalPages: computed(() => totalPages.value),
    totalElements: computed(() => totalElements.value),
    data: computed(() => {
      if (paginationOptions.value.store) {
        return paginationOptions.value.store.getAll();
      }
      return [];
    }),
    error: req.error,
    pending: req.pending,
    dirty: req.dirty,
    next,
    previous,
  };
}