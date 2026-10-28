// Enums and reference lists for Marine & Cargo, as the frontend implementation plan defines them
// (~/Desktop/standard insurance/marine-cargo-frontend-implementation-plan.md, sections 1 to 5).

export const ROLES = Object.freeze([
  "ADMIN",
  "BROKER",
  "UNDERWRITER",
  "SENIOR_UNDERWRITER",
  "CLAIMS_HANDLER",
  "CLAIMS_MANAGER",
  "FINANCE",
]);

export const ROLE_LABELS = Object.freeze({
  ADMIN: "Admin",
  BROKER: "Broker",
  UNDERWRITER: "Underwriter",
  SENIOR_UNDERWRITER: "Senior underwriter",
  CLAIMS_HANDLER: "Claims handler",
  CLAIMS_MANAGER: "Claims manager",
  FINANCE: "Finance",
});

/** Which roles may do what (plan section 1, "Permissions in the UI"). The backend still enforces. */
export const PERMISSIONS = Object.freeze({
  "quote.create": ["BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"],
  "quote.bind": ["BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"],
  "certificate.amend": ["UNDERWRITER", "SENIOR_UNDERWRITER"],
  "rateTable.edit": ["ADMIN", "SENIOR_UNDERWRITER"],
  "fx.edit": ["FINANCE"],
  "masters.edit": ["ADMIN"],
  "users.edit": ["ADMIN"],
});

export const CURRENCIES = Object.freeze(["ETB", "USD", "EUR", "GBP", "CNY", "AED"]);
export const FOREIGN_CURRENCIES = CURRENCIES.filter((c) => c !== "ETB");

export const PRODUCTS = Object.freeze([
  { value: "SINGLE_SHIPMENT", label: "Single shipment", summary: "One voyage, one certificate.", phase: 1 },
  { value: "INLAND_TRANSIT", label: "Inland transit", summary: "Road and rail within Ethiopia.", phase: 3 },
  { value: "HULL", label: "Hull", summary: "The vessel itself.", phase: null, flag: "hull" },
]);
export const productLabel = (v) => PRODUCTS.find((p) => p.value === v)?.label ?? v ?? "—";

export const INCOTERMS = Object.freeze(["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"]);

// Under these terms the seller normally arranges cargo insurance; under the rest, the buyer does (MAR-18)
const SELLER_INSURES = ["CIF", "CIP", "DAP", "DPU", "DDP"];

/** Non-blocking warning when the insured is on the side that normally doesn't insure. */
export function incotermWarning(incoterm, insuredRole) {
  if (!incoterm || !insuredRole) return "";
  const sellerInsures = SELLER_INSURES.includes(incoterm);
  if (sellerInsures && insuredRole === "BUYER") return `Under ${incoterm} the seller normally insures.`;
  if (!sellerInsures && insuredRole === "SELLER") return `Under ${incoterm} the buyer normally insures.`;
  return "";
}

export const MODES = Object.freeze([
  { value: "SEA", label: "Sea" },
  { value: "AIR", label: "Air" },
  { value: "SEA_ROAD", label: "Sea then road" },
]);
export const isSeaMode = (mode) => mode === "SEA" || mode === "SEA_ROAD";
export const modeLabel = (v) => MODES.find((m) => m.value === v)?.label ?? v ?? "—";

export const CLAUSES = Object.freeze([
  { value: "ICC_A", label: "ICC A", summary: "All risks, except the listed exclusions." },
  { value: "ICC_B", label: "ICC B", summary: "Named perils, including water entry and washing overboard." },
  { value: "ICC_C", label: "ICC C", summary: "Major casualties only: fire, sinking, collision, jettison." },
]);
export const clauseLabel = (v) => CLAUSES.find((c) => c.value === v)?.label ?? v ?? "—";

export const PARTY_TYPES = Object.freeze(["INSURED", "CONSIGNEE", "BANK", "BROKER", "CARRIER", "SURVEYOR"]);
export const partyTypeLabel = (t) => (t ? t.charAt(0) + t.slice(1).toLowerCase() : "—");

export const CLASS_SOCIETIES = Object.freeze([
  "American Bureau of Shipping",
  "Bureau Veritas",
  "China Classification Society",
  "Croatian Register of Shipping",
  "DNV",
  "Indian Register of Shipping",
  "Korean Register",
  "Lloyd's Register",
  "Nippon Kaiji Kyokai",
  "Polish Register of Shipping",
  "RINA",
  "Other",
  "Unclassed",
]);

export const QUOTE_STATUSES = Object.freeze(["DRAFT", "QUOTED", "REFERRED", "APPROVED", "BOUND", "DECLINED", "EXPIRED"]);
export const POLICY_STATUSES = Object.freeze(["ACTIVE", "EXPIRED", "CANCELLED"]);
export const CERTIFICATE_STATUSES = Object.freeze(["PENDING", "ISSUED", "AMENDED", "EXPIRED", "CANCELLED"]);
export const RATE_TABLE_STATUSES = Object.freeze(["DRAFT", "ACTIVE", "RETIRED"]);

/** Status colours (plan section 3). Anything not listed is grey. */
export const STATUS_TONES = Object.freeze({
  quote: { QUOTED: "blue", REFERRED: "amber", APPROVED: "green", BOUND: "teal", DECLINED: "red" },
  policy: { ACTIVE: "green", CANCELLED: "red" },
  certificate: { PENDING: "amber", ISSUED: "green", CANCELLED: "red" },
  rateTable: { DRAFT: "amber", ACTIVE: "green" },
  user: { ENABLED: "green", DISABLED: "red" },
  verify: { VALID: "green", CANCELLED: "red" },
});

export const STATUS_LABELS = Object.freeze({
  certificate: { AMENDED: "Amended (superseded)" },
  verify: { VALID: "Valid", SUPERSEDED: "Superseded by a newer version" },
});

export const AGE_BAND_ACTIONS = Object.freeze(["LOAD", "REFER", "DECLINE"]);
export const FX_SOURCES = Object.freeze({ NBE: "NBE feed", MANUAL: "Manual" });

export const PAGE_SIZE = 25;

/** Flags offered in the vessel form (flag states common on Djibouti calls, plus Other). */
export const FLAG_STATES = Object.freeze([
  "Antigua and Barbuda", "Bahamas", "Belize", "China", "Comoros", "Cyprus", "Denmark", "Djibouti", "Ethiopia", "France",
  "Germany", "Greece", "Hong Kong", "India", "Italy", "Liberia", "Malta", "Marshall Islands", "Netherlands", "Norway",
  "Panama", "Portugal", "Saudi Arabia", "Singapore", "Sierra Leone", "Tanzania", "Togo", "Türkiye", "United Arab Emirates",
  "United Kingdom", "United States", "Other",
]);
