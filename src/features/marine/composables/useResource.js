import { ref } from "vue";
import { notifyError } from "../api/marineClient";

/**
 * Loads one record or list for a page and keeps its loading / error / not-found state.
 * Responses from superseded calls are dropped, so fast tab or filter switches can't race.
 *
 * @param {(...args: any[]) => Promise<{ ok: boolean, data?: any, error?: import("../api/marineClient").ApiError }>} fetcher
 */
export function useResource(fetcher, { initial = null, map = (d) => d, toast = false } = {}) {
  const data = ref(initial);
  const loading = ref(false);
  const error = ref(null);
  const notFound = ref(false);
  let seq = 0;
  let lastArgs = [];

  async function load(...args) {
    lastArgs = args;
    const mine = ++seq;
    loading.value = true;
    error.value = null;
    const res = await fetcher(...args);
    if (mine !== seq) return res;
    loading.value = false;
    if (res.ok) {
      data.value = map(res.data);
      notFound.value = false;
    } else {
      error.value = res.error;
      notFound.value = res.error.status === 404;
      if (toast) notifyError(res.error, { onRetry: reload });
    }
    return res;
  }

  /** Reloads with the same arguments without flashing the skeleton (after a modal action). */
  async function reload() {
    const mine = ++seq;
    const res = await fetcher(...lastArgs);
    if (mine === seq && res.ok) data.value = map(res.data);
    return res;
  }

  return { data, loading, error, notFound, load, reload };
}
