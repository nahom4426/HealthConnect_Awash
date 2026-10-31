// FX rate CSV import: "date,currency,rate" per line, optional header row (plan 4.4).
// The import modal previews with this and the mock backend imports with it, so both agree.

/** "date,currency,rate" CSV → rows. Shared with the import modal's preview. */
export function parseFxCsv(text) {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim());
  const out = [];
  lines.forEach((l, i) => {
    if (!l || (i === 0 && /date/i.test(l))) return;
    const [date, currency, rate] = l.split(",").map((x) => x?.trim() ?? "");
    out.push(date && currency && rate ? { line: i + 1, date, currency: currency.toUpperCase(), rate } : { line: i + 1, error: "Expected date,currency,rate" });
  });
  return out;
}
