/**
 * Warm the lazy route chunks behind a set of sidebar navs while the browser is idle,
 * so the first click on each nav item renders without waiting for a download.
 *
 * Runs one chunk at a time and stops on slow or data-saver connections.
 */
const done = new Set();

const idle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
    : (cb) => setTimeout(cb, 300);

function slowConnection() {
  const c = typeof navigator !== "undefined" ? navigator.connection : null;
  return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")));
}

function collectPaths(navs, out = []) {
  for (const item of navs || []) {
    if (item?.path && !item.path.includes(":")) out.push(item.path);
    if (Array.isArray(item?.navs)) collectPaths(item.navs, out);
    if (Array.isArray(item?.children)) collectPaths(item.children, out);
  }
  return out;
}

function loadersFor(router, path) {
  let matched;
  try {
    matched = router.resolve(path).matched;
  } catch {
    return [];
  }
  const loaders = [];
  for (const record of matched) {
    for (const comp of Object.values(record.components || {})) {
      // Lazy route components are plain functions returning import()
      if (typeof comp === "function" && !comp.__vccOpts && !comp.render && !comp.setup) loaders.push(comp);
    }
  }
  return loaders;
}

export function prefetchRoutesIdle(router, navs) {
  if (slowConnection()) return;
  const queue = [];
  for (const path of collectPaths(navs)) {
    for (const load of loadersFor(router, path)) {
      if (!done.has(load)) {
        done.add(load);
        queue.push(load);
      }
    }
  }
  const next = () => {
    const load = queue.shift();
    if (!load) return;
    Promise.resolve()
      .then(load)
      .catch(() => {}) // a failed prefetch just means that page loads on click instead
      .finally(() => idle(next));
  };
  idle(next);
}
