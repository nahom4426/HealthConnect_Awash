import { ref } from "vue";

/**
 * True while a route navigation is in flight (lazy page chunk downloading,
 * guards running). Shown only after a short delay so fast navigations don't
 * flash a loader.
 */
export const routeLoading = ref(false);

const SHOW_DELAY_MS = 120;
let timer = null;

export function startRouteLoading() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    routeLoading.value = true;
  }, SHOW_DELAY_MS);
}

export function stopRouteLoading() {
  clearTimeout(timer);
  timer = null;
  routeLoading.value = false;
}

/** Wire the loading state to a router instance. */
export function installRouteLoading(router) {
  router.beforeEach((to, from) => {
    // Query/hash-only changes don't load a new page
    if (to.path !== from.path) startRouteLoading();
    return true;
  });
  router.afterEach(stopRouteLoading);
  router.onError(stopRouteLoading);
}
