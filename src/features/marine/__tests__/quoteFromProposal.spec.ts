import { describe, expect, it } from "vitest";
import { draftFromQuote, toPayload } from "../store/quoteDraft";
import { partiesItems, shipmentItems } from "../utils/quoteSummary";

describe("a shipment proposal opened as a marine quotation", () => {
  const quote = {
    product: "SINGLE_SHIPMENT",
    proposerName: "Blue Nile Importers PLC",
    insured: null,
    mode: "SEA",
    vesselImo: "9123456",
    portOfLoading: "CHINA",
    portOfDischarge: null,
    finalDestination: "Djibouti",
    goodsDescription: "Computers",
    currency: "ETB",
    invoiceValue: "1000000.00",
    freight: "2000000.00",
    hsCode: "8471.30",
    clause: "ICC_A",
  };

  it("shows the proposer and the typed route without a second entry", () => {
    expect(partiesItems(quote).find((row) => row.label === "Insured")?.value).toBe("Blue Nile Importers PLC");
    const shipment = shipmentItems(quote);
    expect(shipment.find((row) => row.label === "Port of loading")?.value).toBe("CHINA");
    expect(shipment.find((row) => row.label === "Final destination")?.value).toBe("Djibouti");
    expect(shipment.find((row) => row.label === "Vessel")?.value).toBe("IMO 9123456");
  });

  it("keeps those shipment fields when the quotation is edited", () => {
    const payload = toPayload(draftFromQuote(quote));
    expect(payload.goodsDescription).toBe("Computers");
    expect(payload.portOfLoading).toBe("CHINA");
    expect(payload.vesselImo).toBe("9123456");
    expect(payload.currency).toBe("ETB");
    expect(payload.invoiceValue).toBe("1000000.00");
    expect(payload.hsCode).toBe("8471.30");
    expect(payload.finalDestination).toBe("Djibouti");
  });
});
