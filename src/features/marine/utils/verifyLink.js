/**
 * A verification address the API actually supplied. Anything else, including a
 * relative path or a link built in the browser, is not shown.
 */
export function suppliedVerifyUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  if (!url.hostname) return "";
  return url.href;
}
