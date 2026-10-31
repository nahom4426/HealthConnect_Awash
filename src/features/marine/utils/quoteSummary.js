// KeyValueGrid rows for a quote or policy (both carry the same shipment and cover fields).
import { clauseLabel, modeLabel, productLabel } from "../constants";
import { formatAnswerValue } from "@/features/pc/pcModule.js";
import { formatDate } from "./format";
import { formatMoney } from "./money";
import { filledItems } from "./quotationView";

const port = (p, code) => (p ? `${p.code} · ${p.name}` : code || null);
const roleLabel = (s) => formatAnswerValue(s) || null;

export const partiesItems = (q) =>
  filledItems([
    { label: "Product", value: productLabel(q.product) },
    { label: "Arrangement", value: q.arrangement === "OPEN_COVER" ? "Open Cover" : q.arrangement === "SINGLE_SHIPMENT" ? "Single Shipment" : null },
    { label: "Insured", value: q.insured?.name || q.proposerName },
    { label: "Insured is the", value: roleLabel(q.insuredRole) },
    { label: "Consignee", value: q.consignee?.name },
    { label: "Broker", value: q.broker?.name },
    { label: "Incoterm", value: q.incoterm },
  ]);

export const vesselText = (v) => (v ? `${v.name} · IMO ${v.imo} · ${v.flag} · built ${v.yearBuilt} (${v.age} years) · ${v.classSociety}` : null);

export const shipmentItems = (q) =>
  filledItems([
    { label: "Mode", value: q.mode ? modeLabel(q.mode) : null },
    ...(q.product === "INLAND_TRANSIT"
      ? []
      : [
          { label: "Vessel", value: vesselText(q.vessel) || (q.vesselImo ? `IMO ${q.vesselImo}` : null), wide: true },
          { label: "Port of loading", value: port(q.loadingPort, q.portOfLoading) },
          { label: "Transshipment", value: (q.transshipments ?? []).map((p) => port(p)).filter(Boolean).join(", ") || null },
          { label: "Port of discharge", value: port(q.dischargePort, q.portOfDischarge) },
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
    { label: "Packing", value: formatAnswerValue(q.packing) || q.packing },
    { label: "Invoice value", value: q.invoiceValue ? formatMoney(q.invoiceValue, q.currency || "ETB") : null },
    { label: "Freight", value: q.freight ? formatMoney(q.freight, q.currency || "ETB") : null },
    { label: "Invoice no", value: q.invoiceNo },
    { label: "Bill of lading no", value: q.blNo },
    { label: "Containers", value: (q.containers ?? []).filter(Boolean).join(", ") || null },
  ]);

export const coverItems = (q) =>
  filledItems([
    { label: "Clause", value: q.clause ? clauseLabel(q.clause) : null },
    { label: "War", value: q.warCover ? "Covered (while waterborne)" : q.clause ? "Not covered" : null },
    { label: "Strikes", value: q.strikesCover ? "Covered" : q.clause ? "Not covered" : null },
    { label: "Deductible", value: q.deductible ? formatMoney(q.deductible, q.currency || "ETB") : null },
    { label: "Special conditions", value: q.specialConditions, wide: true },
  ]);

export const lcItems = (q) =>
  q.lc?.enabled
    ? filledItems([
        { label: "LC number", value: q.lc.number },
        { label: "Issuing bank (loss payee)", value: q.lcBank?.name },
        { label: "LC amount", value: q.lc.amount ? formatMoney(q.lc.amount, q.currency || "ETB") : null },
        { label: "LC expiry", value: q.lc.expiry ? formatDate(q.lc.expiry) : null },
      ])
    : [];
