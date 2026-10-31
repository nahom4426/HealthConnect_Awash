import { formatAnswerValue, proposalAnswerRows, proposalAnswerSections } from "@/features/pc/pcModule.js";
import { formatMoney } from "./money";

/** Customer answers stored with the quotation. Underwriting changes do not replace this JSON. */
export function proposalAnswers(quote) {
  const raw = quote?.proposalAnswers ?? quote?.answersJson;
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Read-only rows from the proposal. Absent answers are omitted rather than invented. */
export function customerReference(quote) {
  const answers = proposalAnswers(quote);
  if (!answers) return [];
  const rows = proposalAnswerRows(answers, {
    prefer: [
      "insuranceArrangement",
      "marineProduct",
      "periodFrom",
      "periodTo",
      "shipmentFrequency",
      "proposerName",
      "proposerPhone",
      "proposerAddress",
      "occupation",
      "insuredParty",
      "insuredRole",
      "consignee",
      "broker",
      "tradingRoutes",
      "conveyanceTypes",
      "conveyanceModes",
      "conveyanceMode",
      "commodityCategories",
      "estimatedAnnualValue",
      "maxShipmentValue",
      "supportingDocumentsNote",
      "goodsDescription",
      "commodityClass",
      "commodity",
      "hsCode",
      "packingType",
      "packing",
      "portOfLoading",
      "portOfDischarge",
      "finalDestination",
      "sailingDate",
      "vessel",
      "vesselName",
      "vesselImoNumber",
      "incoterm",
      "invoiceNumber",
      "billOfLadingNumber",
      "declarationAccepted",
    ],
  });
  const items = Array.isArray(answers.riskItems) ? answers.riskItems : [];
  items.forEach((item, index) => {
    const description = formatAnswerValue(item?.description) || formatAnswerValue(item?.itemType);
    const amount = item?.sumInsured != null && item?.sumInsured !== ""
      ? formatMoney(item.sumInsured, "ETB")
      : "";
    if (description || amount) {
      rows.push({
        key: `riskItems-${index}`,
        label: `Sum insured ${index + 1}`,
        value: [description, amount].filter(Boolean).join(" · "),
      });
    }
  });
  const perils = formatAnswerValue(answers.selectedPerils);
  if (perils) rows.push({ key: "selectedPerils", label: "Requested cover", value: perils });
  return rows.map(({ label, value }) => ({ label, value }));
}

/** Grouped proposal answers for the quotation proposal tab. */
export function customerAnswerSections(quote) {
  const answers = proposalAnswers(quote);
  if (!answers) return [];
  return proposalAnswerSections(answers).map((section) => ({
    id: section.id,
    title: section.title,
    items: section.rows.map(({ label, value }) => ({ label, value })),
  }));
}

/** The customer's text when the quotation now carries a different value. */
export function submittedValue(quote, answerKey, current) {
  const answers = proposalAnswers(quote);
  const original = formatAnswerValue(answers?.[answerKey], answerKey);
  const now = formatAnswerValue(current, answerKey);
  if (!original || original === now) return null;
  return original;
}

/** Drop empty KeyValueGrid rows so the detail page does not fill with dashes. */
export function filledItems(items) {
  return (items || []).filter((item) => {
    const value = item?.value;
    return value != null && value !== "" && value !== "—";
  });
}

/** Open Cover trading fields from the quotation record, with proposal answers as fallback. */
export function openCoverProfileItems(quote) {
  const answers = proposalAnswers(quote) || {};
  const currency = quote?.currency || "ETB";
  const conveyance =
    formatAnswerValue(quote?.conveyanceModes?.split?.(/[,\s]+/).filter(Boolean))
    || formatAnswerValue(answers.conveyanceTypes)
    || formatAnswerValue(answers.conveyanceModes)
    || formatAnswerValue(quote?.conveyanceModes);
  return filledItems([
    { label: "Frequency", value: formatAnswerValue(quote?.shipmentFrequency || answers.shipmentFrequency) },
    {
      label: "Estimated annual value",
      value: quote?.estimatedAnnualValue != null
        ? formatMoney(quote.estimatedAnnualValue, currency)
        : formatAnswerValue(answers.estimatedAnnualValue, "estimatedAnnualValue"),
    },
    {
      label: "Maximum per shipment",
      value: quote?.maxShipmentValue != null
        ? formatMoney(quote.maxShipmentValue, currency)
        : formatAnswerValue(answers.maxShipmentValue, "maxShipmentValue"),
    },
    { label: "Trading routes", value: quote?.tradingRoutes || answers.tradingRoutes, wide: true },
    { label: "Conveyances", value: conveyance },
    { label: "Commodity categories", value: formatAnswerValue(answers.commodityCategories), wide: true },
    { label: "Supporting documents", value: answers.supportingDocumentsNote, wide: true },
  ]);
}

/** Reasons a premium has not been calculated. A priced quote has none. */
export function ratingBlockers(quote) {
  if (!quote || quote.premium) return [];
  return Array.isArray(quote.ratingBlockers) ? quote.ratingBlockers.filter(Boolean) : [];
}

/** A shipment reported under an Open Cover. The quotation that issued the cover is not a declaration. */
export function isDeclarationQuote(quote) {
  return Boolean(quote?.openCover?.id) && quote.arrangement !== "OPEN_COVER";
}

export function declarationPremiumNote(quote) {
  if (!isDeclarationQuote(quote)) return "";
  if (quote.premium?.agreedRate) {
    return "This is the declaration premium from the Open Cover agreed rate. It is separate from the cover's provisional premium. Capacity counts the sum insured, not this premium.";
  }
  if (quote.premium) {
    return "This commodity has no agreed rate on the Open Cover. The figure is not an Open Cover rate. Finish underwriting on this declaration before it can be accepted.";
  }
  return "Rate this declaration here. When the commodity is on the Open Cover, the agreed rate is used. A date, route, conveyance, or limit problem is referred on this page. A duplicate invoice and bill of lading is rejected.";
}

export function quotationIssued(quote) {
  if (!quote) return "";
  if (quote.arrangement === "OPEN_COVER" && quote.status !== "BOUND") {
    return "An underwriter finalises the approved limits, territories and rates on this quotation. That issues the Open Cover policy. There is no separate customer-acceptance status.";
  }
  if (quote.arrangement === "OPEN_COVER") {
    return "The Open Cover policy was issued from this quotation. There is no separate customer-acceptance status.";
  }
  if (quote.status === "QUOTED" || quote.status === "APPROVED") {
    return "The quotation is issued. There is no separate customer-acceptance status. An underwriting approval does not mean the premium was collected.";
  }
  if (quote.status === "DECLINED") return "The quotation was declined. It will not be issued or bound.";
  if (quote.status === "BOUND") return "This quotation was bound. The policy was issued from it.";
  return "The quotation is not issued yet. Finish underwriting and rating on this page.";
}

export function bindingEligibility(quote) {
  if (!quote) return "";
  if (quote.arrangement === "OPEN_COVER" && quote.status !== "BOUND") {
    return "This quotation becomes an Open Cover policy when an underwriter finalises the approved limits, territories and rates. It is not bound as a shipment policy.";
  }
  if (quote.arrangement === "OPEN_COVER") {
    return "The Open Cover policy was issued from this quotation.";
  }
  if (quote.sanctionsConfirmed) return "Binding is blocked. A sanctions match is confirmed.";
  if (quote.status === "DECLINED") return "Binding is blocked. Underwriting declined this quotation.";
  if (quote.status === "REFERRED") return "Binding is blocked until underwriting accepts the referral. Payment does not approve the risk.";
  if (!quote.premium) return "Binding is blocked until this quotation is rated. No premium has been calculated.";
  if (quote.status !== "QUOTED" && quote.status !== "APPROVED") return "Binding is blocked until the quotation is quoted or accepted.";
  return "Sanctions screening still has to clear. A demo payment or a typed reference does not confirm collection.";
}
