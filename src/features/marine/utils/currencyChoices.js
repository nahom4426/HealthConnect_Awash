/** Currencies a new amount may use. An explicit list wins; otherwise the API allowlist; otherwise ETB. */
export function currencyChoices(explicit, configured) {
  if (Array.isArray(explicit) && explicit.length) return [...explicit];
  if (Array.isArray(configured) && configured.length) return [...configured];
  return ["ETB"];
}

/** The currency shown when the field has none yet. Never invents a foreign code. */
export function displayedCurrency(current, baseCurrency, choices) {
  const allowed = Array.isArray(choices) && choices.length ? choices : ["ETB"];
  const chosen = typeof current === "string" ? current.trim() : "";
  if (chosen && allowed.includes(chosen)) return chosen;
  const base = typeof baseCurrency === "string" ? baseCurrency.trim() : "";
  if (base && allowed.includes(base)) return base;
  return allowed[0];
}
