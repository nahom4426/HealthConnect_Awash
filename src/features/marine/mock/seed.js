// Starting data for the mock backend: enough masters, rates and users to walk a quote through to a
// certificate. All names are made up.
import { addDays, todayIso } from "../utils/format";

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
  const parties = [
    party("Abyssinia Agro Industries PLC", ["INSURED", "CONSIGNEE"], { tin: "0012345678", phone: "+251 11 551 2200", email: "imports@abyssinia-agro.example", address: "Bole, Addis Ababa" }),
    party("Habesha Pharmaceuticals SC", ["INSURED"], { tin: "0023456789", phone: "+251 11 662 3011", email: "logistics@habesha-pharma.example", address: "Kality, Addis Ababa" }),
    party("Rift Valley Steel Works", ["INSURED", "CONSIGNEE"], { tin: "0034567890", email: "procurement@rvsteel.example", address: "Adama" }),
    party("Shewa Electronics Trading", ["INSURED"], { tin: "0045678901", email: "ops@shewa-electronics.example" }),
    party("Commercial Bank of Ethiopia", ["BANK"], { email: "trade.finance@cbe.example", phone: "+251 11 551 5004" }),
    party("Awash Bank", ["BANK"], { email: "lc.desk@awashbank.example" }),
    party("Dashen Bank", ["BANK"], { email: "tradeservices@dashenbank.example" }),
    party("Nile Insurance Brokers", ["BROKER"], { email: "placements@nilebrokers.example", phone: "+251 91 120 3344" }),
    party("Addis Risk Partners", ["BROKER"], { email: "cargo@addisrisk.example" }),
    party("Ethiopian Shipping & Logistics", ["CARRIER"], { email: "bookings@esl.example" }),
    party("Horn Marine Surveyors", ["SURVEYOR"], { email: "surveys@hornmarine.example" }),
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
    seq: { quote: 0, policy: 0, certificate: 0, party: partyId, user: users.length + 1, fx: fxId, rateTable: 2, audit: 1 },
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
    seededOn: yesterday,
  };
}

/** Port code → region, for route factors */
export const PORT_REGIONS = {
  DJJIB: "Djibouti", DJDOR: "Djibouti", SOBBO: "Horn of Africa", ERMSW: "Horn of Africa", KEMBA: "Africa",
  SAJED: "Middle East", AEJEA: "Middle East", INNSA: "Asia", SGSIN: "Asia", CNSHA: "Asia", CNNGB: "Asia", CNTAO: "Asia",
  TRMER: "Europe", NLRTM: "Europe", DEHAM: "Europe", GBFXT: "Europe", USNYC: "Americas",
};
