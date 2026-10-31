import { ref } from "vue";

/**
 * Loads one Life resource and keeps loading / error state for the page.
 * The Life API functions resolve (never throw) with ApiResponseHandler's
 * { success, data, error }; errors are already toasted there, so this only keeps
 * the message for the inline error state.
 *
 * @param {(...args: any[]) => Promise<{ success: boolean, data?: any, error?: string }>} fetcher
 * @param {{ initial?: any, map?: (data: any) => any }} [options]
 */
export function useLifeResource(fetcher, { initial = null, map = (d) => d } = {}) {
  const data = ref(initial);
  const loading = ref(false);
  const error = ref("");
  let seq = 0;

  async function load(...args) {
    const mine = ++seq; // ignore responses from superseded calls (e.g. fast tab switching)
    loading.value = true;
    error.value = "";
    const res = await fetcher(...args);
    if (mine !== seq) return res;
    if (res?.success) data.value = map(res.data);
    else error.value = res?.error || "The Life service did not respond.";
    loading.value = false;
    return res;
  }

  return { data, loading, error, load };
}

/** Wraps one file for the Life multipart endpoints (all of them expect the field "file"). */
export function fileForm(file) {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}
