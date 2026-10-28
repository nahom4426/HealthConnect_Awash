// Field rules for the quote wizard, one function per step (plan 5.2). Each returns
// { field: message } for the fields that fail; field names are the wizard draft's keys.
import { hasInlandLeg, isSeaMode } from "../constants";
import { parseDecimal } from "./money";
import { isValidContainerNo, isValidImo } from "./imo";
import { addDays, todayIso } from "./format";

const blank = (v) => v === null || v === undefined || String(v).trim() === "";
const gt0 = (v) => (parseDecimal(v) ?? 0n) > 0n;
const gte0 = (v) => {
  const d = parseDecimal(v);
  return d !== null && d >= 0n;
};

export function partiesErrors(d) {
  const e = {};
  if (blank(d.product)) e.product = "Pick a product";
  if (!d.insured) e.insured = "Insured is required";
  if (blank(d.insuredRole)) e.insuredRole = "Say whether the insured is the buyer or the seller";
  if (blank(d.incoterm)) e.incoterm = "Incoterm is required";
  return e;
}

export function shipmentErrors(d, today = todayIso()) {
  const e = {};
  const inlandOnly = d.product === "INLAND_TRANSIT";
  if (!inlandOnly) {
    if (blank(d.mode)) e.mode = "Mode of conveyance is required";
    if (isSeaMode(d.mode)) {
      if (!d.vessel) e.vessel = "Vessel is required for sea shipments";
      else if (!isValidImo(d.vessel.imo)) e.vessel = "This IMO number's check digit is wrong";
    }
    if (!d.loadingPort) e.loadingPort = "Port of loading is required";
    if ((d.transshipments ?? []).length > 5) e.transshipments = "At most 5 transshipment ports";
    if (!d.dischargePort) e.dischargePort = "Port of discharge is required";
    else if (d.loadingPort && d.loadingPort.code === d.dischargePort.code) e.dischargePort = "Port of discharge must differ from the port of loading";
    if (blank(d.finalDestination)) e.finalDestination = "Final destination is required";
  }
  if (hasInlandLeg(d.product, d.mode)) {
    if (!d.inland?.from) e["inland.from"] = "Where the road leg starts is required";
    if (!d.inland?.to) e["inland.to"] = "Dry port is required";
    if (blank(d.inland?.truckPlate)) e["inland.truckPlate"] = "Truck plate is required";
    if (blank(d.inland?.driverName)) e["inland.driverName"] = "Driver name is required";
  }
  if (blank(d.sailingDate)) e.sailingDate = `${inlandOnly ? "Departure" : "Sailing"} date is required`;
  else if (d.sailingDate < addDays(today, -30)) e.sailingDate = `${inlandOnly ? "Departure" : "Sailing"} date can't be more than 30 days in the past`;
  if (!d.commodity) e.commodity = "Commodity is required";
  if (blank(d.goodsDescription)) e.goodsDescription = "Goods description is required";
  else if (d.goodsDescription.length > 500) e.goodsDescription = "At most 500 characters";
  if (!gt0(d.invoiceValue)) e.invoiceValue = "Invoice value must be greater than 0";
  if (!gte0(d.freight)) e.freight = "Freight must be 0 or more";
  const badContainers = (d.containers ?? []).filter((c) => !isValidContainerNo(c));
  if (badContainers.length) e.containers = `Container numbers are 4 letters and 7 digits: ${badContainers.join(", ")}`;
  return e;
}

export function coverErrors(d) {
  const e = {};
  if (blank(d.clause)) e.clause = "Pick a clause";
  if (!blank(d.deductible) && !gte0(d.deductible)) e.deductible = "Deductible must be 0 or more";
  if ((d.specialConditions ?? "").length > 2000) e.specialConditions = "At most 2000 characters";
  if (d.lc?.enabled) {
    if (blank(d.lc.number)) e["lc.number"] = "LC number is required";
    if (!d.lc.bank) e["lc.bank"] = "Issuing bank is required";
    if (!gt0(d.lc.amount)) e["lc.amount"] = "LC amount must be greater than 0";
    if (blank(d.lc.expiry)) e["lc.expiry"] = "LC expiry is required";
    else if (d.sailingDate && d.lc.expiry <= d.sailingDate) e["lc.expiry"] = "LC expiry must be after the sailing date";
  }
  return e;
}

export const STEP_RULES = [partiesErrors, shipmentErrors, coverErrors];

/** Which step (0-based) a draft field belongs to, so a server error can send the user there. */
export const FIELD_STEP = {
  product: 0, insured: 0, insuredRole: 0, consignee: 0, broker: 0, incoterm: 0,
  mode: 1, vessel: 1, loadingPort: 1, transshipments: 1, dischargePort: 1, finalDestination: 1, sailingDate: 1,
  commodity: 1, goodsDescription: 1, packing: 1, invoiceValue: 1, freight: 1, invoiceNo: 1, blNo: 1, containers: 1,
  "inland.from": 1, "inland.to": 1, "inland.truckPlate": 1, "inland.driverName": 1, "inland.convoyRef": 1,
  clause: 2, warCover: 2, strikesCover: 2, deductible: 2, specialConditions: 2,
  "lc.number": 2, "lc.bank": 2, "lc.amount": 2, "lc.expiry": 2,
};

/** API field names (422 responses) → wizard draft keys. */
export const API_FIELD = {
  insuredId: "insured", consigneeId: "consignee", brokerId: "broker", vesselImo: "vessel", portOfLoading: "loadingPort",
  portOfDischarge: "dischargePort", transshipmentPorts: "transshipments", hsCode: "commodity", "lc.bankId": "lc.bank",
};

export const FIELD_LABELS = {
  product: "Product", insured: "Insured", insuredRole: "Insured is the", consignee: "Consignee", broker: "Broker", incoterm: "Incoterm",
  mode: "Mode of conveyance", vessel: "Vessel", loadingPort: "Port of loading", transshipments: "Transshipment ports",
  dischargePort: "Port of discharge", finalDestination: "Final destination", sailingDate: "Sailing date", commodity: "Commodity",
  goodsDescription: "Goods description", invoiceValue: "Invoice value", freight: "Freight", containers: "Container numbers",
  clause: "Clause", deductible: "Deductible", specialConditions: "Special conditions",
  "lc.number": "LC number", "lc.bank": "Issuing bank", "lc.amount": "LC amount", "lc.expiry": "LC expiry",
  "inland.from": "Road leg from", "inland.to": "Dry port", "inland.truckPlate": "Truck plate", "inland.driverName": "Driver name",
};
