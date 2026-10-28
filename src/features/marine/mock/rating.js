// Mock premium engine. It stands in for backend T08 until the real service exists, so the wizard's
// step 4 and the premium cards have realistic numbers. All amounts are decimal strings.
import { multiply, parseDecimal, sumInsured, toFixedString } from "../utils/money";
import { bandForAge } from "../utils/rateTable";
import { vesselAge } from "../utils/imo";
import { PORT_REGIONS } from "./seed";

const pct = (amount, rate) => multiply(amount, toFixedString((parseDecimal(rate) ?? 0n) / 100n, 6)) ?? 0n;
const s = (v) => toFixedString(v);

// Referral threshold on the sum insured in ETB ("Value" reason, MAR-35)
const VALUE_REFERRAL_ETB = "50000000";

/**
 * @returns {{ status, premium, referralReasons, declineNote, fx }}
 */
export function rate(quote, { table, vessel, commodity, fxRate }) {
  const etbRate = quote.currency === "ETB" ? "1" : fxRate.rate;
  const si = sumInsured(quote.invoiceValue, quote.freight, table.general.upliftPct);
  const siEtb = multiply(si.total, etbRate);

  const commodityRate = table.commodityRates.find((r) => r.commodityClass === commodity?.commodityClass)?.ratePct ?? "0.25";
  const clauseFactor = table.clauseFactors[quote.clause] ?? "1";
  const region = PORT_REGIONS[quote.portOfLoading] ?? "Any";
  const destination = PORT_REGIONS[quote.portOfDischarge] === "Djibouti" ? "Djibouti" : "Addis Ababa";
  const route =
    table.routeFactors.find((r) => r.originRegion === region && r.destination === destination && r.mode === quote.mode) ??
    table.routeFactors.find((r) => r.originRegion === "Any" && r.mode === quote.mode);
  const routeFactor = route?.factor ?? "1";

  const age = vessel ? vesselAge(vessel.yearBuilt) : null;
  const band = age === null ? null : bandForAge(table.ageBands, age);

  const base = pct(siEtb, commodityRate);
  const clauseAdj = multiply(base, toFixedString((parseDecimal(clauseFactor) ?? 0n) - 1000000n, 6)) ?? 0n;
  const afterClause = base + clauseAdj;
  const routeAdj = multiply(afterClause, toFixedString((parseDecimal(routeFactor) ?? 0n) - 1000000n, 6)) ?? 0n;
  const afterRoute = afterClause + routeAdj;
  const ageLoad = band?.action === "LOAD" || band?.action === "REFER" ? pct(afterRoute, band.loadingPct) : 0n;
  const war = quote.warCover ? pct(siEtb, table.warStrikes.warRatePct) : 0n;
  const strikes = quote.strikesCover ? pct(siEtb, table.warStrikes.strikesRatePct) : 0n;
  const net = afterRoute + ageLoad + war + strikes;
  const minPremium = parseDecimal(table.general.minPremium) ?? 0n;
  const minAdj = net < minPremium ? minPremium - net : 0n;
  const taxable = net + minAdj;
  const vat = pct(taxable, table.general.vatPct);
  const stamp = parseDecimal(table.general.stampDuty) ?? 0n;
  const total = taxable + vat + stamp;

  const lines = [
    { key: "base", label: `Base rate (${commodity?.commodityClass ?? "—"})`, rate: `${commodityRate}%`, amount: s(base) },
    { key: "clause", label: `Clause factor (${String(quote.clause).replace("_", " ")})`, rate: `× ${clauseFactor}`, amount: s(clauseAdj) },
    { key: "route", label: `Route factor (${region} → ${destination}, ${quote.mode})`, rate: `× ${routeFactor}`, amount: s(routeAdj) },
    { key: "age", label: `Vessel age loading${age !== null ? ` (${age} years)` : ""}`, rate: band ? `${band.loadingPct}%` : "—", amount: s(ageLoad) },
    { key: "war", label: "War", rate: quote.warCover ? `${table.warStrikes.warRatePct}%` : "Not covered", amount: s(war) },
    { key: "strikes", label: "Strikes", rate: quote.strikesCover ? `${table.warStrikes.strikesRatePct}%` : "Not covered", amount: s(strikes) },
    { key: "minimum", label: "Minimum premium adjustment", rate: `min ETB ${table.general.minPremium}`, amount: s(minAdj) },
    { key: "vat", label: "VAT", rate: `${table.general.vatPct}%`, amount: s(vat) },
    { key: "stamp", label: "Stamp duty", rate: "fixed", amount: s(stamp) },
  ];

  const referralReasons = [];
  if (commodity?.restricted) referralReasons.push({ code: "COMMODITY", message: `${commodity.description} is a restricted commodity.` });
  if (band?.action === "REFER") referralReasons.push({ code: "VESSEL_AGE", message: `The vessel is ${age} years old; ${band.fromAge}–${band.toAge} years needs an underwriter.` });
  if (siEtb > (parseDecimal(VALUE_REFERRAL_ETB) ?? 0n)) referralReasons.push({ code: "VALUE", message: `Sum insured is above ETB 50,000,000.` });

  const declined = band?.action === "DECLINE";
  return {
    status: declined ? "DECLINED" : referralReasons.length ? "REFERRED" : "QUOTED",
    declineNote: declined ? `Vessels ${band.fromAge}–${band.toAge} years old are outside appetite (${age} years).` : "",
    referralReasons,
    premium: {
      sumInsured: si,
      sumInsuredEtb: s(siEtb),
      lines,
      total: s(total),
      currency: "ETB",
      rateTableId: table.id,
      rateTableVersion: table.name,
    },
    fx: { currency: quote.currency, rate: etbRate, date: fxRate.date, fallback: !!fxRate.fallback },
  };
}
