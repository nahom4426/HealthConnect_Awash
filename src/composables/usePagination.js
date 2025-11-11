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
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalElements = ref(0);

  const req = useApiRequest();
  const localData = ref([]); // Store data locally when no store is provided

  const searching = ref(false);
  const searchPagination = useTablePagination(perPage.value);
  const pagination = useTablePagination(perPage.value);

  const toBackendPage = (frontendPage) => frontendPage - 1;
  const toFrontendPage = (backendPage) => backendPage + 1;

  // Provide pagination data to child components
  provide("page", currentPage);
  provide("totalPages", totalPages);
  provide("totalElements", totalElements);
  provide("perPage", perPage);
  provide("sendPagination", (limit, page) => {
    perPage.value = parseInt(limit);
    currentPage.value = parseInt(page);
    fetch();
  });
  provide("pageChanger", (pageNum) => {
    currentPage.value = pageNum;
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
      page: toBackendPage(currentPage.value),
      limit: perPage.value,
      search: search.value,
    };

    req.send(
      () => paginationOptions.value.cb(params),
      (response) => {
        const data = response?.data || response;
        
        if (data?.content) {
          if (paginationOptions.value.store) {
            // Store the data AND the pagination metadata in the store
            paginationOptions.value.store.set(data.content);
            
            // Store pagination metadata in the store so it persists
            if (typeof paginationOptions.value.store.setPaginationMeta === 'function') {
              paginationOptions.value.store.setPaginationMeta({
                totalElements: data.totalElements || data.content.length,
                totalPages: data.totalPages || 1,
                currentPage: data.page || 0
              });
            }
          } else {
            // Store locally if no store
            localData.value = data.content;
          }
          
          // Update the reactive totals for UI
          totalPages.value = data.totalPages || 1;
          totalElements.value = data.totalElements || data.content.length;
          
          const backendPage = data.page || 0;
          currentPage.value = toFrontendPage(backendPage);
        } else if (Array.isArray(data)) {
          if (paginationOptions.value.store) {
            paginationOptions.value.store.set(data);
            
            // Store pagination metadata for array responses too
            if (typeof paginationOptions.value.store.setPaginationMeta === 'function') {
              paginationOptions.value.store.setPaginationMeta({
                totalElements: data.length,
                totalPages: 1,
                currentPage: 0
              });
            }
          } else {
            // Store locally if no store
            localData.value = data;
          }
          totalElements.value = data.length;
          totalPages.value = 1;
          currentPage.value = 1;
        }
      },
      (error) => {
        totalElements.value = 0;
        totalPages.value = 1;
        currentPage.value = 1;
      }
    );
  }

  function send() {
    currentPage.value = 1;
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

  function hydrateFromStore() {
    const store = paginationOptions.value.store;
    if (!store) return;
    
    const items = typeof store.getAll === 'function' ? store.getAll() : [];
    const len = Array.isArray(items) ? items.length : 0;
    
    if (len > 0) {
      // Try to get pagination metadata from store first
      let storeTotalElements = len;
      let storeTotalPages = 1;
      
      if (typeof store.getPaginationMeta === 'function') {
        const meta = store.getPaginationMeta();
        if (meta) {
          storeTotalElements = meta.totalElements || len;
          storeTotalPages = meta.totalPages || Math.max(1, Math.ceil(storeTotalElements / perPage.value));
        }
      }
      
      // Use the stored totals (either from meta or fallback to item count)
      totalElements.value = storeTotalElements;
      totalPages.value = storeTotalPages;
      
      // Ensure current page is valid
      if (currentPage.value < 1 || currentPage.value > totalPages.value) {
        currentPage.value = 1;
      }
    }
  }

  // First, hydrate from store (if returning to a page with cached data)
  hydrateFromStore();

  // Auto-fetch if enabled
  if (paginationOptions.value.auto) {
    fetch();
  }

  // Watch for changes in dependencies
  if (paginationOptions.value.watch.length > 0) {
    paginationOptions.value.watch.forEach((watchRef) => {
      watch(watchRef, () => {
        currentPage.value = 1;
        fetch();
      });
    });
  }

  return {
    page: currentPage,
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
      return localData.value;
    }),
    error: req.error,
    pending: req.pending,
    dirty: req.dirty,
    next,
    previous,
  };
}