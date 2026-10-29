// Starting data for the mock backend: enough masters, rates and users to walk a quote through to a
// certificate. All names are made up.
import { addDays, todayIso } from "../utils/format";

const OWNERS = {
  "MV Abay Star": "Ethiopian Shipping & Logistics",
  "MV Gondar": "Ethiopian Shipping & Logistics",
  "Red Sea Trader": "Red Sea Trader Navigation SA",
  "Ocean Pioneer": "Ocean Pioneer Shipping Ltd",
};

function imo(six) {
  const sum = [7, 6, 5, 4, 3, 2].reduce((acc, w, i) => acc + Number(six[i]) * w, 0);
  return `${six}${sum % 10}`;
}

const thisYear = new Date().getFullYear();
const now = () => new Date().toISOString();

export function createSeed() {
  const today = todayIso();
  const yesterday = addDays(today, -1);

  const ports = [
    ["DJJIB", "Djibouti", "Djibouti"],
    ["DJDOR", "Doraleh", "Djibouti"],
    ["SOBBO", "Berbera", "Somalia"],
    ["ERMSW", "Massawa", "Eritrea"],
    ["KEMBA", "Mombasa", "Kenya"],
    ["SAJED", "Jeddah", "Saudi Arabia"],
    ["AEJEA", "Jebel Ali", "United Arab Emirates"],
    ["INNSA", "Nhava Sheva", "India"],
    ["SGSIN", "Singapore", "Singapore"],
    ["CNSHA", "Shanghai", "China"],
    ["CNNGB", "Ningbo", "China"],
    ["CNTAO", "Qingdao", "China"],
    ["TRMER", "Mersin", "Türkiye"],
    ["NLRTM", "Rotterdam", "Netherlands"],
    ["DEHAM", "Hamburg", "Germany"],
    ["GBFXT", "Felixstowe", "United Kingdom"],
    ["USNYC", "New York", "United States"],
    // Ethiopian dry ports, the destination of the inland leg (phase 3)
    ["ETMJO", "Modjo dry port", "Ethiopia"],
    ["ETKLT", "Kality dry port", "Ethiopia"],
    ["ETDDA", "Dire Dawa dry port", "Ethiopia"],
    ["ETSML", "Semera dry port", "Ethiopia"],
  ].map(([code, name, country]) => ({ code, name, country }));

  const commodities = [
    ["100190", "Wheat and meslin, other than seed", "BULK", false],
    ["150790", "Soya-bean oil, refined", "BULK", false],
    ["170199", "Cane or beet sugar, refined", "BULK", false],
    ["310530", "Diammonium phosphate (DAP fertiliser)", "BULK", false],
    ["520100", "Cotton, not carded or combed", "GENERAL", false],
    ["630900", "Worn clothing and textile articles", "GENERAL", false],
    ["720851", "Flat-rolled iron or steel, over 10 mm", "GENERAL", false],
    ["847130", "Portable computers under 10 kg", "ELECTRONICS", false],
    ["851712", "Mobile telephones", "ELECTRONICS", false],
    ["843149", "Parts of cranes and excavators", "MACHINERY", false],
    ["870421", "Diesel trucks, gross weight up to 5 t", "VEHICLES", false],
    ["300490", "Medicaments, packaged for retail sale", "PHARMA", false],
    ["080390", "Bananas, fresh", "PERISHABLE", false],
    ["360200", "Prepared explosives", "DANGEROUS", true],
    ["930690", "Ammunition and parts", "DANGEROUS", true],
  ].map(([hsCode, description, commodityClass, restricted]) => ({ hsCode, description, commodityClass, restricted }));

  const vessels = [
    ["907472", "MV Abay Star", "Ethiopia", 2012, "Lloyd's Register", 32000],
    ["934512", "MV Gondar", "Ethiopia", 2008, "Bureau Veritas", 28500],
    ["953216", "Maersk Kalahari", "Denmark", 2016, "American Bureau of Shipping", 94000],
    ["961023", "CMA CGM Tadjoura", "France", 2019, "Bureau Veritas", 151000],
    ["912034", "Red Sea Trader", "Panama", 2003, "Other", 18500],
    ["874310", "Ocean Pioneer", "Comoros", 1994, "Unclassed", 9600],
    ["947765", "MSC Asmara", "Liberia", 2010, "DNV", 66000],
  ].map(([six, name, flag, yearBuilt, classSociety, grossTonnage]) => ({
    imo: imo(six),
    name,
    flag,
    yearBuilt,
    classSociety,
    grossTonnage,
    owner: OWNERS[name] ?? "",
    source: "MANUAL",
  }));
  // The plan's own example of a valid IMO
  vessels[0].imo = "9074729";

  let partyId = 1;
  const party = (name, types, extra = {}) => ({
    id: String(partyId++),
    name,
    types,
    tin: "",
    phone: "",
    email: "",
    address: "",
    contactPerson: "",
    ...extra,
  });
  // Registered, approved customers (customer registration): companies with their licences on file
  let customerNo = 0;
  const company = (name, types, extra, licence, region, city, businessType) =>
    party(name, types, {
      ...extra,
      kind: "COMPANY",
      status: "APPROVED",
      customerNo: `CU-${thisYear}-${String(++customerNo).padStart(5, "0")}`,
      tradeLicenceNo: licence,
      tradeLicenceExpiry: `${thisYear + 1}-06-30`,
      vatRegNo: `VAT-${licence.slice(-6)}`,
      businessType,
      addressParts: { region, city, subCity: "", woreda: "", houseNo: "" },
      registeredBy: "Hanna Girma",
      registeredAt: `${thisYear}-01-05T08:00:00Z`,
      approvedBy: "Yonas Alemu",
      approvedAt: `${thisYear}-01-06T08:00:00Z`,
      documents: [
        { id: `d${customerNo}a`, kind: "TRADE_LICENCE", name: "trade-licence.pdf", size: 182000, type: "application/pdf", uploadedBy: "Hanna Girma", uploadedAt: `${thisYear}-01-05T08:00:00Z` },
        { id: `d${customerNo}b`, kind: "TIN_CERTIFICATE", name: "tin-certificate.pdf", size: 96000, type: "application/pdf", uploadedBy: "Hanna Girma", uploadedAt: `${thisYear}-01-05T08:00:00Z` },
      ],
    });
  const parties = [
    company("Abyssinia Agro Industries PLC", ["INSURED", "CONSIGNEE"], { tin: "0012345678", phone: "+251 11 551 2200", email: "imports@abyssinia-agro.example", address: "Bole, Addis Ababa", contactPerson: "Mekdes Alemayehu" }, "AA/14/1/0012345", "Addis Ababa", "Addis Ababa", "IMPORTER"),
    company("Habesha Pharmaceuticals SC", ["INSURED"], { tin: "0023456789", phone: "+251 11 662 3011", email: "logistics@habesha-pharma.example", address: "Kality, Addis Ababa", contactPerson: "Samuel Tadesse" }, "AA/14/1/0023456", "Addis Ababa", "Addis Ababa", "MANUFACTURER"),
    company("Rift Valley Steel Works", ["INSURED", "CONSIGNEE"], { tin: "0034567890", phone: "+251 22 111 4020", email: "procurement@rvsteel.example", address: "Adama", contactPerson: "Lemma Bekele" }, "OR/03/2/0034567", "Oromia", "Adama", "MANUFACTURER"),
    company("Shewa Electronics Trading", ["INSURED"], { tin: "0045678901", phone: "+251 11 557 9090", email: "ops@shewa-electronics.example", address: "Merkato, Addis Ababa", contactPerson: "Hirut Kebede" }, "AA/14/1/0045678", "Addis Ababa", "Addis Ababa", "IMPORTER_EXPORTER"),
    party("Commercial Bank of Ethiopia", ["BANK"], { email: "trade.finance@cbe.example", phone: "+251 11 551 5004" }),
    party("Awash Bank", ["BANK"], { email: "lc.desk@awashbank.example" }),
    party("Dashen Bank", ["BANK"], { email: "tradeservices@dashenbank.example" }),
    party("Nile Insurance Brokers", ["BROKER"], { email: "placements@nilebrokers.example", phone: "+251 91 120 3344" }),
    party("Addis Risk Partners", ["BROKER"], { email: "cargo@addisrisk.example" }),
    party("Ethiopian Shipping & Logistics", ["CARRIER"], { email: "bookings@esl.example" }),
    party("Horn Marine Surveyors", ["SURVEYOR"], { email: "surveys@hornmarine.example" }),
    // Close to a sanctions-list name on purpose, so screening shows a Potential match (phase 2)
    company("Horn Coastal Trading PLC", ["CONSIGNEE", "INSURED"], { tin: "0056789012", phone: "+251 25 111 2233", email: "info@horncoastal.example", address: "Dire Dawa", contactPerson: "Abdi Yusuf" }, "DD/01/1/0056789", "Dire Dawa", "Dire Dawa", "TRADER"),
    party("Mediterranean Shipping Agency", ["CARRIER"], { email: "claims@msa-agency.example" }),
    party("Addis General Average Adjusters", ["SURVEYOR"], { email: "ga@addisadjusters.example" }),
    // Waiting for approval, so the approval queue isn't empty
    party("Tsehay Coffee Exporters PLC", ["INSURED"], {
      tin: "0067890123",
      phone: "+251 46 220 1188",
      email: "export@tsehaycoffee.example",
      address: "Hawassa",
      contactPerson: "Kidist Haile",
      kind: "COMPANY",
      status: "PENDING_APPROVAL",
      customerNo: `CU-${thisYear}-${String(++customerNo).padStart(5, "0")}`,
      tradeLicenceNo: "SD/02/1/0067890",
      tradeLicenceExpiry: `${thisYear + 1}-03-31`,
      vatRegNo: "",
      businessType: "EXPORTER",
      addressParts: { region: "Sidama", city: "Hawassa", subCity: "", woreda: "", houseNo: "" },
      brokerId: "8",
      registeredBy: "Dawit Bekele (Nile Insurance Brokers)",
      registeredAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
      documents: [{ id: "d9a", kind: "TRADE_LICENCE", name: "tsehay-trade-licence.pdf", size: 210000, type: "application/pdf", uploadedBy: "Dawit Bekele", uploadedAt: new Date(Date.now() - 26 * 3600_000).toISOString() }],
    }),
  ];

  const users = [
    ["admin", "Selam Tesfaye", ["ADMIN"]],
    ["broker", "Dawit Bekele", ["BROKER"]],
    ["underwriter", "Hanna Girma", ["UNDERWRITER"]],
    ["senior.uw", "Yonas Alemu", ["SENIOR_UNDERWRITER"]],
    ["claims", "Meron Haile", ["CLAIMS_HANDLER"]],
    ["claims.manager", "Bereket Assefa", ["CLAIMS_MANAGER"]],
    ["finance", "Tigist Mulugeta", ["FINANCE"]],
  ].map(([username, fullName, roles], i) => ({
    id: String(i + 1),
    username,
    fullName,
    email: `${username}@standardinsurance.example`,
    roles,
    enabled: true,
    lastSignInAt: i < 4 ? new Date(Date.now() - (i + 1) * 3600_000 * 5).toISOString() : null,
  }));

  // Today's CNY and AED rates are missing on purpose, so the FX page shows its "Missing" badge
  const fxRates = [];
  let fxId = 1;
  const fx = (date, currency, rate, source) => fxRates.push({ id: String(fxId++), date, currency, rate, source, enteredBy: source === "NBE" ? "NBE feed" : "Tigist Mulugeta", createdAt: now() });
  for (let d = 6; d >= 1; d--) {
    const day = addDays(today, -d);
    fx(day, "USD", (156.1 + d * 0.05).toFixed(4), "NBE");
    fx(day, "EUR", (169.8 + d * 0.04).toFixed(4), "NBE");
    fx(day, "GBP", (198.3 + d * 0.06).toFixed(4), "NBE");
    fx(day, "CNY", (21.71 + d * 0.01).toFixed(4), "NBE");
    fx(day, "AED", (42.52 + d * 0.01).toFixed(4), "NBE");
  }
  fx(today, "USD", "156.0412", "NBE");
  fx(today, "EUR", "169.7720", "NBE");
  fx(today, "GBP", "198.2405", "MANUAL");

  const rateTables = [
    {
      id: "1",
      name: "2026 v1",
      product: "SINGLE_SHIPMENT",
      effectiveFrom: `${thisYear}-01-01`,
      effectiveTo: null,
      status: "ACTIVE",
      createdBy: "Selam Tesfaye",
      createdAt: `${thisYear}-01-01T06:00:00Z`,
      general: { upliftPct: "10", minPremium: "500.00", vatPct: "15", stampDuty: "5.00" },
      commodityRates: [
        ["GENERAL", "0.2500"],
        ["BULK", "0.3000"],
        ["MACHINERY", "0.3500"],
        ["ELECTRONICS", "0.4500"],
        ["VEHICLES", "0.4000"],
        ["PHARMA", "0.3500"],
        ["PERISHABLE", "0.6000"],
        ["DANGEROUS", "0.9000"],
      ].map(([commodityClass, ratePct]) => ({ commodityClass, ratePct })),
      clauseFactors: { ICC_A: "1.00", ICC_B: "0.75", ICC_C: "0.60" },
      routeFactors: [
        { originRegion: "Asia", destination: "Djibouti", mode: "SEA", factor: "1.00" },
        { originRegion: "Asia", destination: "Djibouti", mode: "SEA_ROAD", factor: "1.15" },
        { originRegion: "Europe", destination: "Djibouti", mode: "SEA", factor: "1.05" },
        { originRegion: "Middle East", destination: "Djibouti", mode: "SEA", factor: "0.95" },
        { originRegion: "Any", destination: "Addis Ababa", mode: "AIR", factor: "0.70" },
        { originRegion: "Djibouti", destination: "Ethiopia", mode: "ROAD", factor: "0.80" },
      ],
      ageBands: [
        { fromAge: 0, toAge: 15, loadingPct: "0", action: "LOAD" },
        { fromAge: 16, toAge: 20, loadingPct: "10", action: "LOAD" },
        { fromAge: 21, toAge: 25, loadingPct: "25", action: "LOAD" },
        { fromAge: 26, toAge: 30, loadingPct: "50", action: "REFER" },
        { fromAge: 31, toAge: 99, loadingPct: "0", action: "DECLINE" },
      ],
      warStrikes: { warRatePct: "0.0500", strikesRatePct: "0.0250", routes: [] },
    },
  ];

  return {
    seq: {
      quote: 0, policy: 0, certificate: 0, party: partyId, user: users.length + 1, fx: fxId, rateTable: 2, audit: 1, referral: 0, screening: 0, openCover: 2,
      claim: 0, deadline: 0, task: 0, document: 0, payment: 0, customer: customerNo, debitNote: 0, creditNote: 0, receipt: 0, voucher: 0, commission: 0, statement: 0,
    },
    ports,
    commodities,
    vessels,
    parties,
    users,
    fxRates,
    rateTables,
    quotes: [],
    policies: [],
    certificates: [],
    audit: [],
    referrals: [],
    screenings: [],
    openCovers: createOpenCovers(today),
    claims: [],
    deadlines: [],
    notes: [],
    receipts: [],
    vouchers: [],
    commissions: [],
    statements: [],
    rules: createRules(),
    sanctionsList: SANCTIONS_LIST,
    seededOn: yesterday,
  };
}

/** Plan 6.7: referral rules, accumulation, warranties, authority, inland limits, deadline rules. */
function createRules() {
  return {
    referral: [
      { id: "r1", name: "High value", condition: "SUM_INSURED_OVER", value: "50000000", active: true },
      { id: "r2", name: "Dangerous goods", condition: "COMMODITY_CLASS_IN", value: ["DANGEROUS"], active: true },
      { id: "r3", name: "Somali and Eritrean ports", condition: "ROUTE_IN", value: ["SOBBO", "ERMSW"], active: true },
      { id: "r4", name: "Very old vessels", condition: "VESSEL_AGE_OVER", value: "25", active: false },
      { id: "r5", name: "Possible sanctions match", condition: "SANCTIONS_RESULT_IS", value: "POTENTIAL", active: true },
    ],
    accumulation: { softLimit: "150000000", hardLimit: "300000000" },
    warranties: [
      { id: "w1", name: "Vessel must be classed", condition: "CLASS_REQUIRED", value: "", action: "REFER", loadPct: "", active: true },
      { id: "w2", name: "Vessel not over 20 years", condition: "VESSEL_AGE_MAX", value: "20", action: "LOAD", loadPct: "10", active: true },
    ],
    authority: [
      { role: "UNDERWRITER", maxSumInsured: "20000000", canOverrideRate: false, canWaiveWarranty: false },
      { role: "SENIOR_UNDERWRITER", maxSumInsured: "500000000", canOverrideRate: true, canWaiveWarranty: true },
      { role: "CLAIMS_HANDLER", maxSumInsured: "500000", canOverrideRate: false, canWaiveWarranty: false },
      { role: "CLAIMS_MANAGER", maxSumInsured: "10000000", canOverrideRate: false, canWaiveWarranty: false },
    ],
    inland: { perVehicle: "15000000", perConvoy: "60000000" },
    deadlines: [
      { kind: "SURVEY", base: "NOTIFIED_DATE", days: 7, alerts: [3, 1] },
      { kind: "CARRIER_NOTICE", base: "DELIVERY_DATE", days: 3, alerts: [1] },
      { kind: "DOCUMENTS", base: "NOTIFIED_DATE", days: 30, alerts: [14, 7, 3, 1] },
      { kind: "SUIT_TIME_BAR", base: "DELIVERY_DATE", days: 365, alerts: [30, 14, 7, 3, 1] },
    ],
    // Broker commission on net premium (excluding VAT and stamp duty), earned when the premium is paid
    commission: { defaultPct: "10", brokers: [{ brokerId: "9", pct: "12.5" }] },
    changes: [],
  };
}

const SANCTIONS_LIST = [
  { ref: "UN-SO-0412", list: "UN Security Council", name: "Horn Coastal Trading", type: "ENTITY" },
  { ref: "OFAC-SDN-77812", list: "OFAC SDN", name: "Red Sea Trader", type: "VESSEL" },
  { ref: "EU-2024-118", list: "EU consolidated", name: "Ocean Pioneer Shipping", type: "ENTITY" },
];

/** Two open covers: one running now, one whose period has ended (for the year-end adjustment). */
function createOpenCovers(today) {
  const y = Number(today.slice(0, 4));
  const base = {
    brokerId: "8",
    currency: "USD",
    declarationDays: 7,
    clause: "ICC_A",
    warCover: true,
    strikesCover: true,
    adjustment: null,
    createdAt: `${y}-01-02T08:00:00Z`,
    updatedAt: `${y}-01-02T08:00:00Z`,
  };
  return [
    {
      ...base,
      id: "1",
      coverNo: `OC-${y}-00001`,
      insuredId: "1",
      periodFrom: `${y}-01-01`,
      periodTo: `${y}-12-31`,
      annualLimit: "5000000.00",
      perConveyanceLimit: "500000.00",
      commodities: [
        { hsCode: "100190", ratePct: "0.2000" },
        { hsCode: "310530", ratePct: "0.2200" },
        { hsCode: "520100", ratePct: "0.1800" },
      ],
      provisionalPremium: "1200000.00",
    },
    {
      ...base,
      id: "2",
      coverNo: `OC-${y - 1}-00007`,
      insuredId: "3",
      periodFrom: `${y - 1}-01-01`,
      periodTo: `${y - 1}-12-31`,
      annualLimit: "2000000.00",
      perConveyanceLimit: "250000.00",
      commodities: [{ hsCode: "720851", ratePct: "0.2400" }],
      provisionalPremium: "600000.00",
      createdAt: `${y - 1}-01-02T08:00:00Z`,
      updatedAt: `${y - 1}-01-02T08:00:00Z`,
    },
  ];
}

/** Port code → region, for route factors */
export const PORT_REGIONS = {
  DJJIB: "Djibouti", DJDOR: "Djibouti", SOBBO: "Horn of Africa", ERMSW: "Horn of Africa", KEMBA: "Africa",
  SAJED: "Middle East", AEJEA: "Middle East", INNSA: "Asia", SGSIN: "Asia", CNSHA: "Asia", CNNGB: "Asia", CNTAO: "Asia",
  TRMER: "Europe", NLRTM: "Europe", DEHAM: "Europe", GBFXT: "Europe", USNYC: "Americas",
  ETMJO: "Ethiopia", ETKLT: "Ethiopia", ETDDA: "Ethiopia", ETSML: "Ethiopia",
};
