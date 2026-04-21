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

  const toBackendPage = (frontendPage) => frontendPage ;
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

    const backendPage = search.value ? Number(currentPage.value) : toBackendPage(currentPage.value);
    const params = {
      page: backendPage,
      limit: perPage.value,
      search: search.value,
    };

    return req.send(
      () => paginationOptions.value.cb(params),
      (response) => {
        let data = response;
        if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'data')) {
          data = data.data;
        }
        if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'data')) {
          const nested = data.data;
          if (
            (nested && typeof nested === 'object' && Object.prototype.hasOwnProperty.call(nested, 'content')) ||
            Array.isArray(nested)
          ) {
            data = nested;
          }
        }

        const isPageable =
          !!data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          (
            Object.prototype.hasOwnProperty.call(data, 'content') ||
            (data.data && Object.prototype.hasOwnProperty.call(data.data, 'content'))
          );

        // Pageable response: even if content is null, treat it as an empty list
        if (isPageable) {
          const container = Object.prototype.hasOwnProperty.call(data, 'content') ? data : data.data;
          const content = Array.isArray(container?.content) ? container.content : [];
          if (paginationOptions.value.store) {
            // Store the data AND the pagination metadata in the store
            paginationOptions.value.store.set(content);
            
            // Store pagination metadata in the store so it persists
            if (typeof paginationOptions.value.store.setPaginationMeta === 'function') {
              paginationOptions.value.store.setPaginationMeta({
                totalElements: typeof container.totalElements === 'number' ? container.totalElements : content.length,
                totalPages: container.totalPages || 1,
                currentPage: container.page || 0
              });
            }
          } else {
            // Store locally if no store
            localData.value = content;
          }
          
          // Update the reactive totals for UI
          totalPages.value = container.totalPages || 1;
          totalElements.value = typeof container.totalElements === 'number' ? container.totalElements : content.length;
          
          // Don't update currentPage from backend response - keep the page we requested
          // The backend's page field is unreliable, so we trust what we sent
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
        } else if (data && typeof data === 'object') {
          const fallbackList =
            (Array.isArray(data.items) && data.items) ||
            (Array.isArray(data.results) && data.results) ||
            (Array.isArray(data.content) && data.content) ||
            [];

          if (paginationOptions.value.store) {
            paginationOptions.value.store.set(fallbackList);
          } else {
            localData.value = fallbackList;
          }

          totalElements.value = fallbackList.length;
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
    return fetch();
  }

  function next() {
    if (currentPage.value < totalPages.value) {
      currentPage.value += 1;
      return fetch();
    }
  }

  function previous() {
    if (currentPage.value > 1) {
      currentPage.value -= 1;
      return fetch();
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