// Quote wizard draft (plan 1: Pinia holds only the session, flags, the wizard draft and UI
// preferences). Pickers keep whole objects here; toPayload() turns them into the ids the API takes.
import { defineStore } from "pinia";
import { ref } from "vue";

export function emptyDraft() {
  return {
    product: "SINGLE_SHIPMENT",
    insured: null,
    insuredRole: "",
    consignee: null,
    broker: null,
    incoterm: "",
    mode: "",
    vessel: null,
    loadingPort: null,
    transshipments: [],
    dischargePort: null,
    finalDestination: "",
    sailingDate: "",
    commodity: null,
    goodsDescription: "",
    packing: "",
    currency: "ETB",
    invoiceValue: "",
    freight: "",
    invoiceNo: "",
    blNo: "",
    voyageNo: "",
    containers: [],
    clause: "",
    warCover: false,
    strikesCover: false,
    deductible: "",
    specialConditions: "",
    lc: { enabled: false, number: "", bank: null, amount: "", expiry: "" },
    inland: emptyInland(),
    openCoverId: null,
  };
}

export const emptyInland = () => ({ from: null, to: null, truckPlate: "", driverName: "", convoyRef: "" });

function portFromCode(code) {
  return code ? { code, name: code } : null;
}

/** API quote → wizard draft */
export function draftFromQuote(q) {
  return {
    product: q.product ?? "SINGLE_SHIPMENT",
    insured: q.insured,
    insuredRole: q.insuredRole ?? "",
    consignee: q.consignee,
    broker: q.broker,
    incoterm: q.incoterm ?? "",
    mode: q.mode ?? "",
    vessel: q.vessel ?? (q.vesselImo ? { imo: q.vesselImo, name: `IMO ${q.vesselImo}` } : null),
    loadingPort: q.loadingPort ?? portFromCode(q.portOfLoading),
    transshipments: q.transshipments ?? [],
    dischargePort: q.dischargePort ?? portFromCode(q.portOfDischarge),
    finalDestination: q.finalDestination ?? "",
    sailingDate: q.sailingDate ?? "",
    commodity: q.commodity ?? (q.hsCode ? { hsCode: q.hsCode, description: q.hsCode } : null),
    goodsDescription: q.goodsDescription ?? "",
    packing: q.packing ?? "",
    currency: q.currency ?? "ETB",
    invoiceValue: q.invoiceValue ?? "",
    freight: q.freight ?? "",
    invoiceNo: q.invoiceNo ?? "",
    blNo: q.blNo ?? "",
    voyageNo: q.voyageNo ?? "",
    containers: q.containers ?? [],
    clause: q.clause ?? "",
    warCover: !!q.warCover,
    strikesCover: !!q.strikesCover,
    deductible: q.deductible ?? "",
    specialConditions: q.specialConditions ?? "",
    lc: { enabled: !!q.lc?.enabled, number: q.lc?.number ?? "", bank: q.lcBank ?? null, amount: q.lc?.amount ?? "", expiry: q.lc?.expiry ?? "" },
    inland: q.inland
      ? { from: q.inlandFrom, to: q.inlandTo, truckPlate: q.inland.truckPlate ?? "", driverName: q.inland.driverName ?? "", convoyRef: q.inland.convoyRef ?? "" }
      : emptyInland(),
    openCoverId: q.openCoverId ?? null,
  };
}

/** Wizard draft → API body */
export function toPayload(d) {
  const inlandOnly = d.product === "INLAND_TRANSIT";
  const sea = !inlandOnly && (d.mode === "SEA" || d.mode === "SEA_ROAD");
  const inland = inlandOnly || d.mode === "SEA_ROAD";
  return {
    product: d.product,
    insuredId: d.insured?.id ?? null,
    insuredRole: d.insuredRole || null,
    consigneeId: d.consignee?.id ?? null,
    brokerId: d.broker?.id ?? null,
    incoterm: d.incoterm || null,
    mode: inlandOnly ? "ROAD" : d.mode || null,
    vesselImo: sea ? d.vessel?.imo ?? null : null,
    portOfLoading: inlandOnly ? null : d.loadingPort?.code ?? null,
    transshipmentPorts: inlandOnly ? [] : d.transshipments.map((p) => p.code),
    portOfDischarge: inlandOnly ? null : d.dischargePort?.code ?? null,
    finalDestination: inlandOnly ? d.inland.to?.name ?? "" : d.finalDestination.trim(),
    sailingDate: d.sailingDate || null,
    hsCode: d.commodity?.hsCode ?? null,
    goodsDescription: d.goodsDescription.trim(),
    packing: d.packing.trim(),
    currency: d.currency,
    invoiceValue: d.invoiceValue || null,
    freight: d.freight || null,
    invoiceNo: d.invoiceNo.trim(),
    blNo: d.blNo.trim(),
    voyageNo: d.voyageNo.trim(),
    containers: d.containers,
    clause: d.clause || null,
    warCover: d.warCover,
    strikesCover: d.strikesCover,
    deductible: d.deductible || null,
    specialConditions: d.specialConditions.trim(),
    lc: d.lc.enabled
      ? { enabled: true, number: d.lc.number.trim(), bankId: d.lc.bank?.id ?? null, amount: d.lc.amount || null, expiry: d.lc.expiry || null }
      : { enabled: false },
    inland: inland
      ? { from: d.inland.from?.code ?? null, to: d.inland.to?.code ?? null, truckPlate: d.inland.truckPlate.trim(), driverName: d.inland.driverName.trim(), convoyRef: d.inland.convoyRef.trim() }
      : null,
    openCoverId: d.openCoverId,
  };
}

export const useQuoteDraft = defineStore("marineQuoteDraft", () => {
  const draft = ref(emptyDraft());
  const quote = ref(null); // last saved or rated quote from the API
  const dirty = ref(false);
  const step = ref(0);
  const furthest = ref(0);

  function start(fromQuote = null) {
    draft.value = fromQuote ? draftFromQuote(fromQuote) : emptyDraft();
    quote.value = fromQuote;
    dirty.value = false;
    step.value = 0;
    furthest.value = fromQuote ? 3 : 0;
  }

  return { draft, quote, dirty, step, furthest, start };
});
