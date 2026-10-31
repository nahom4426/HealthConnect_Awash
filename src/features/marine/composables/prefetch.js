// Prefetch on hover (plan section 9, FE-48): when the pointer rests on a row or link, download the
// target page's chunk so the click renders at once. Each page is fetched at most once.
const done = new Set();

export function prefetchRoute(router, to) {
  try {
    const { matched } = router.resolve(to);
    for (const record of matched) {
      const load = record.components?.default;
      if (typeof load === "function" && !done.has(load)) {
        done.add(load);
        load().catch(() => done.delete(load));
      }
    }
  } catch {
    /* an unknown route just isn't prefetched */
  }
}
