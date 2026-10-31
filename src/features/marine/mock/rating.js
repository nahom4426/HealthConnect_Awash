// Mock premium engine. It stands in for backend T08 until the real service exists, so the wizard's
// step 4 and the premium cards have realistic numbers. All amounts are decimal strings.
// Underwriting checks (screening, accumulation, warranties, rules) live in underwriting.js.
import { multiply, parseDecimal, sumInsured, toFixedString } from "../utils/money";
import { bandForAge } from "../utils/rateTable";
import { vesselAge } from "../utils/imo";
import { PORT_REGIONS } from "./seed";

const pct = (amount, rate) => multiply(amount, toFixedString((parseDecimal(rate) ?? 0n) / 100n, 6)) ?? 0n;
const factorAdj = (amount, factor) => multiply(amount, toFixedString((parseDecimal(factor) ?? 0n) - 1000000n, 6)) ?? 0n;
const s = (v) => toFixedString(v);

/** Route of a quote for route factors: { region, destination, mode } */
export function routeOf(q) {
  if (q.product === "INLAND_TRANSIT") return { region: PORT_REGIONS[q.inland?.from] ?? "Djibouti", destination: "Ethiopia", mode: "ROAD" };
  const region = PORT_REGIONS[q.portOfLoading] ?? "Any";
  const destination = PORT_REGIONS[q.portOfDischarge] === "Djibouti" ? "Djibouti" : "Addis Ababa";
  return { region, destination, mode: q.mode };
}

/**
 * @param {object} opts
 *   table, vessel, commodity, fxRate     reference data
 *   agreedRatePct                        open cover's agreed rate for this commodity (MAR-29)
 *   rateOverridePct                      underwriter's override on approval
 *   warrantyLoadPct                      loading from breached LOAD warranties
 * @returns {{ premium, tableReasons, declineNote, fx, sumInsuredEtb }}
 */
export function rate(quote, { table, vessel, commodity, fxRate, agreedRatePct = null, rateOverridePct = null, warrantyLoadPct = "0" }) {
  const etbRate = quote.currency === "ETB" ? "1" : fxRate.rate;
  const si = sumInsured(quote.invoiceValue, quote.freight, table.general.upliftPct);
  const siEtb = multiply(si.total, etbRate);

  const tariffRate = table.commodityRates.find((r) => r.commodityClass === commodity?.commodityClass)?.ratePct ?? "0.25";
  const baseRate = rateOverridePct ?? agreedRatePct ?? tariffRate;
  const baseLabel = rateOverridePct ? "Base rate (underwriter override)" : agreedRatePct ? "Agreed rate (open cover)" : `Base rate (${commodity?.commodityClass ?? "—"})`;
  const clauseFactor = table.clauseFactors[quote.clause] ?? "1";
  const r = routeOf(quote);
  const route =
    table.routeFactors.find((x) => x.originRegion === r.region && x.destination === r.destination && x.mode === r.mode) ??
    table.routeFactors.find((x) => x.originRegion === "Any" && x.mode === r.mode);
  const routeFactor = route?.factor ?? "1";

  const age = vessel ? vesselAge(vessel.yearBuilt) : null;
  const band = age === null ? null : bandForAge(table.ageBands, age);

  const base = pct(siEtb, baseRate);
  const clauseAdj = factorAdj(base, clauseFactor);
  const afterClause = base + clauseAdj;
  const routeAdj = factorAdj(afterClause, routeFactor);
  const afterRoute = afterClause + routeAdj;
  const ageLoad = band?.action === "LOAD" || band?.action === "REFER" ? pct(afterRoute, band.loadingPct) : 0n;
  const warrantyLoad = pct(afterRoute, warrantyLoadPct);
  const war = quote.warCover ? pct(siEtb, table.warStrikes.warRatePct) : 0n;
  const strikes = quote.strikesCover ? pct(siEtb, table.warStrikes.strikesRatePct) : 0n;
  const net = afterRoute + ageLoad + warrantyLoad + war + strikes;
  const minPremium = parseDecimal(table.general.minPremium) ?? 0n;
  const minAdj = net < minPremium ? minPremium - net : 0n;
  const taxable = net + minAdj;
  const vat = pct(taxable, table.general.vatPct);
  const stamp = parseDecimal(table.general.stampDuty) ?? 0n;
  const total = taxable + vat + stamp;

  const lines = [
    { key: "base", label: baseLabel, rate: `${baseRate}%`, amount: s(base) },
    { key: "clause", label: `Clause factor (${String(quote.clause).replace("_", " ")})`, rate: `× ${clauseFactor}`, amount: s(clauseAdj) },
    { key: "route", label: `Route factor (${r.region} → ${r.destination}, ${r.mode})`, rate: `× ${routeFactor}`, amount: s(routeAdj) },
    { key: "age", label: `Vessel age loading${age !== null ? ` (${age} years)` : ""}`, rate: band ? `${band.loadingPct}%` : "—", amount: s(ageLoad) },
    ...(warrantyLoad ? [{ key: "warranty", label: "Warranty loading", rate: `${warrantyLoadPct}%`, amount: s(warrantyLoad) }] : []),
    { key: "war", label: "War", rate: quote.warCover ? `${table.warStrikes.warRatePct}%` : "Not covered", amount: s(war) },
    { key: "strikes", label: "Strikes", rate: quote.strikesCover ? `${table.warStrikes.strikesRatePct}%` : "Not covered", amount: s(strikes) },
    { key: "minimum", label: "Minimum premium adjustment", rate: `min ETB ${table.general.minPremium}`, amount: s(minAdj) },
    { key: "vat", label: "VAT", rate: `${table.general.vatPct}%`, amount: s(vat) },
    { key: "stamp", label: "Stamp duty", rate: "fixed", amount: s(stamp) },
  ];

  const tableReasons = [];
  if (commodity?.restricted) tableReasons.push({ code: "COMMODITY", message: `${commodity.description} is a restricted commodity.` });
  if (band?.action === "REFER") tableReasons.push({ code: "VESSEL_AGE", message: `The vessel is ${age} years old; ${band.fromAge}–${band.toAge} years needs an underwriter.` });

  return {
    declineNote: band?.action === "DECLINE" ? `Vessels ${band.fromAge}–${band.toAge} years old are outside appetite (${age} years).` : "",
    tableReasons,
    sumInsuredEtb: s(siEtb),
    premium: {
      sumInsured: si,
      sumInsuredEtb: s(siEtb),
      lines,
      total: s(total),
      currency: "ETB",
      rateTableId: table.id,
      rateTableVersion: table.name,
      agreedRate: !!agreedRatePct,
    },
    fx: { currency: quote.currency, rate: etbRate, date: fxRate.date, fallback: !!fxRate.fallback },
  };
}
