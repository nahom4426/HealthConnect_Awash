/** Read-only facts for Marine Settings. Missing config stays on the operational defaults. */

export function settingsFacts(config) {
  const allowed = Array.isArray(config?.currencies) && config.currencies.length
    ? config.currencies.filter(Boolean)
    : ["ETB"];
  const base = config?.baseCurrency || "ETB";
  return {
    base,
    allowed,
    foreign: allowed.filter((code) => code !== base),
    source: config?.fxSource || "MANUAL",
    rateType: config?.fxRateType || "MID",
    maxRateAgeDays: Number.isInteger(config?.fxMaxRateAgeDays) ? config.fxMaxRateAgeDays : 1,
    allowHistoricalRates: config?.fxAllowHistoricalRates !== false,
    rolesEnforce: config?.rolesEnforce === true,
  };
}

/** A page body, or the content of a paged list. */
export function pageRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

/** What the stored rate-table status means. Approval is not a status. */
export function rateTableStage(status) {
  if (status === "ACTIVE") return "Active for rating. No approval is recorded on this table.";
  if (status === "RETIRED") return "Retired. Rating no longer uses it.";
  return "Draft. Validation must pass before activation. Activation is not an approval.";
}
