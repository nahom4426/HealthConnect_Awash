/**
 * Helpers for rendering authenticated image bytes without base64.
 *
 * `btoa(String.fromCharCode(...new Uint8Array(buf)))` spreads every byte as a call argument and
 * overflows the call stack for multi-megabyte photos. Object URLs hand the bytes to the browser
 * directly, so they work for any size and cost no extra memory for the base64 expansion.
 */

/**
 * GET `path` with the given axios client and return a `blob:` URL for the response body.
 * Resolves to `null` when the request fails (404, 401, network) so callers can show an empty state.
 *
 * Remember to call `revokeObjectUrls()` when the owning component unmounts.
 */
export async function fetchImageObjectUrl(client, path, config = {}) {
  try {
    const { data, headers } = await client.get(path, { ...config, responseType: 'blob' });
    const type = data?.type || headers?.['content-type'] || 'image/jpeg';
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    if (blob.size === 0) return null;
    return URL.createObjectURL(blob);
  } catch (e) {
    const status = e?.response?.status;
    if (status !== 404) console.warn(`image fetch failed for ${path}:`, status || e.message);
    return null;
  }
}

/** Release blob: URLs created by `fetchImageObjectUrl`. Safe to call with nulls / non-blob URLs. */
export function revokeObjectUrls(urls) {
  for (const url of urls || []) {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      try { URL.revokeObjectURL(url); } catch (_) { /* ignore */ }
    }
  }
}
