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
    currency: "USD",
    invoiceValue: "",
    freight: "",
    invoiceNo: "",
    blNo: "",
    containers: [],
    clause: "",
    warCover: false,
    strikesCover: false,
    deductible: "",
    specialConditions: "",
    lc: { enabled: false, number: "", bank: null, amount: "", expiry: "" },
  };
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
    vessel: q.vessel,
    loadingPort: q.loadingPort,
    transshipments: q.transshipments ?? [],
    dischargePort: q.dischargePort,
    finalDestination: q.finalDestination ?? "",
    sailingDate: q.sailingDate ?? "",
    commodity: q.commodity,
    goodsDescription: q.goodsDescription ?? "",
    packing: q.packing ?? "",
    currency: q.currency ?? "USD",
    invoiceValue: q.invoiceValue ?? "",
    freight: q.freight ?? "",
    invoiceNo: q.invoiceNo ?? "",
    blNo: q.blNo ?? "",
    containers: q.containers ?? [],
    clause: q.clause ?? "",
    warCover: !!q.warCover,
    strikesCover: !!q.strikesCover,
    deductible: q.deductible ?? "",
    specialConditions: q.specialConditions ?? "",
    lc: { enabled: !!q.lc?.enabled, number: q.lc?.number ?? "", bank: q.lcBank ?? null, amount: q.lc?.amount ?? "", expiry: q.lc?.expiry ?? "" },
  };
}

/** Wizard draft → API body */
export function toPayload(d) {
  const sea = d.mode === "SEA" || d.mode === "SEA_ROAD";
  return {
    product: d.product,
    insuredId: d.insured?.id ?? null,
    insuredRole: d.insuredRole || null,
    consigneeId: d.consignee?.id ?? null,
    brokerId: d.broker?.id ?? null,
    incoterm: d.incoterm || null,
    mode: d.mode || null,
    vesselImo: sea ? d.vessel?.imo ?? null : null,
    portOfLoading: d.loadingPort?.code ?? null,
    transshipmentPorts: d.transshipments.map((p) => p.code),
    portOfDischarge: d.dischargePort?.code ?? null,
    finalDestination: d.finalDestination.trim(),
    sailingDate: d.sailingDate || null,
    hsCode: d.commodity?.hsCode ?? null,
    goodsDescription: d.goodsDescription.trim(),
    packing: d.packing.trim(),
    currency: d.currency,
    invoiceValue: d.invoiceValue || null,
    freight: d.freight || null,
    invoiceNo: d.invoiceNo.trim(),
    blNo: d.blNo.trim(),
    containers: d.containers,
    clause: d.clause || null,
    warCover: d.warCover,
    strikesCover: d.strikesCover,
    deductible: d.deductible || null,
    specialConditions: d.specialConditions.trim(),
    lc: d.lc.enabled
      ? { enabled: true, number: d.lc.number.trim(), bankId: d.lc.bank?.id ?? null, amount: d.lc.amount || null, expiry: d.lc.expiry || null }
      : { enabled: false },
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
