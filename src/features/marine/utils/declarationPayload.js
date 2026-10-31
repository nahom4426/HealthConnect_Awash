/** Shipment fields for a declaration. Cover terms are sent so the draft is complete; the server replaces them with the agreement. */
export function declarationPayload(cover, form) {
  return {
    product: "SINGLE_SHIPMENT",
    insuredId: cover?.insured?.id ?? cover?.insuredId ?? null,
    insuredRole: form.insuredRole || null,
    brokerId: cover?.broker?.id ?? cover?.brokerId ?? null,
    incoterm: form.incoterm || null,
    currency: cover?.currency ?? null,
    clause: cover?.clause ?? null,
    warCover: !!cover?.warCover,
    strikesCover: !!cover?.strikesCover,
    mode: form.mode || null,
    vesselImo: form.vessel?.imo ?? null,
    portOfLoading: form.loadingPort?.code ?? null,
    portOfDischarge: form.dischargePort?.code ?? null,
    finalDestination: (form.finalDestination || "").trim(),
    sailingDate: form.sailingDate || null,
    hsCode: form.commodity?.hsCode ?? null,
    goodsDescription: (form.goodsDescription || "").trim(),
    packing: (form.packing || "").trim(),
    invoiceValue: form.invoiceValue || null,
    freight: form.freight || null,
    invoiceNo: (form.invoiceNo || "").trim(),
    blNo: (form.blNo || "").trim(),
    voyageNo: (form.voyageNo || "").trim(),
    openCoverId: cover?.id ?? null,
  };
}
