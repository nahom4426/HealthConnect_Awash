// KeyValueGrid rows for a quote or policy (both carry the same shipment and cover fields).
import { clauseLabel, modeLabel, productLabel } from "../constants";
import { formatDate } from "./format";
import { formatMoney } from "./money";

const port = (p) => (p ? `${p.code} · ${p.name}` : null);
const cap = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : null);

export const partiesItems = (q) => [
  { label: "Product", value: productLabel(q.product) },
  { label: "Insured", value: q.insured?.name },
  { label: "Insured is the", value: cap(q.insuredRole) },
  { label: "Consignee", value: q.consignee?.name },
  { label: "Broker", value: q.broker?.name },
  { label: "Incoterm", value: q.incoterm },
];

export const vesselText = (v) => (v ? `${v.name} · IMO ${v.imo} · ${v.flag} · built ${v.yearBuilt} (${v.age} years) · ${v.classSociety}` : null);

export const shipmentItems = (q) => [
  { label: "Mode", value: modeLabel(q.mode) },
  ...(q.product === "INLAND_TRANSIT"
    ? []
    : [
        { label: "Vessel", value: vesselText(q.vessel), wide: true },
        { label: "Port of loading", value: port(q.loadingPort) },
        { label: "Transshipment", value: (q.transshipments ?? []).map(port).join(", ") },
        { label: "Port of discharge", value: port(q.dischargePort) },
        { label: "Final destination", value: q.finalDestination },
      ]),
  ...(q.inland
    ? [
        { label: "Road leg", value: `${q.inlandFrom?.name ?? q.inland.from} → ${q.inlandTo?.name ?? q.inland.to}` },
        { label: "Truck plate", value: q.inland.truckPlate },
        { label: "Driver", value: q.inland.driverName },
        { label: "Convoy", value: q.inland.convoyRef },
      ]
    : []),
  ...(q.openCover?.id ? [{ label: "Open cover", value: q.openCover.coverNo, to: `/marine/open-covers/${q.openCover.id}` }] : []),
  { label: q.product === "INLAND_TRANSIT" ? "Departure date" : "Sailing date", value: q.sailingDate ? formatDate(q.sailingDate) : null },
  { label: "Commodity", value: q.commodity ? `${q.commodity.hsCode} · ${q.commodity.description}` : null },
  { label: "Goods description", value: q.goodsDescription, wide: true },
  { label: "Packing", value: q.packing },
  { label: "Invoice value", value: q.invoiceValue ? formatMoney(q.invoiceValue, q.currency) : null },
  { label: "Freight", value: q.freight ? formatMoney(q.freight, q.currency) : null },
  { label: "Invoice no", value: q.invoiceNo },
  { label: "Bill of lading no", value: q.blNo },
  { label: "Containers", value: (q.containers ?? []).join(", ") },
];

export const coverItems = (q) => [
  { label: "Clause", value: clauseLabel(q.clause) },
  { label: "War", value: q.warCover ? "Covered (while waterborne)" : "Not covered" },
  { label: "Strikes", value: q.strikesCover ? "Covered" : "Not covered" },
  { label: "Deductible", value: q.deductible ? formatMoney(q.deductible, q.currency) : null },
  { label: "Special conditions", value: q.specialConditions, wide: true },
];

export const lcItems = (q) =>
  q.lc?.enabled
    ? [
        { label: "LC number", value: q.lc.number },
        { label: "Issuing bank (loss payee)", value: q.lcBank?.name },
        { label: "LC amount", value: formatMoney(q.lc.amount, q.currency) },
        { label: "LC expiry", value: q.lc.expiry ? formatDate(q.lc.expiry) : null },
      ]
    : [];
