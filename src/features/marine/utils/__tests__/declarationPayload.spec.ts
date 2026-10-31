import { describe, expect, it } from "vitest";
import { declarationPayload } from "../declarationPayload";

describe("declarationPayload", () => {
  it("keeps the agreement's parties and currency and sends the shipment", () => {
    const body = declarationPayload(
      {
        id: "9",
        currency: "ETB",
        clause: "ICC_B",
        warCover: false,
        strikesCover: true,
        insured: { id: "1" },
        broker: { id: "3" },
      },
      {
        insuredRole: "BUYER",
        incoterm: "FOB",
        mode: "SEA",
        vessel: { imo: "9074729" },
        loadingPort: { code: "CNSHA" },
        dischargePort: { code: "ERMSW" },
        finalDestination: "ethiopia",
        sailingDate: "2027-01-30",
        commodity: { hsCode: "090111" },
        goodsDescription: " Printers ",
        packing: "",
        invoiceValue: "500000.00",
        freight: "",
        invoiceNo: " INV-1 ",
        blNo: "BL-1",
        voyageNo: " V9 ",
      }
    );

    expect(body).toMatchObject({
      product: "SINGLE_SHIPMENT",
      insuredId: "1",
      brokerId: "3",
      currency: "ETB",
      clause: "ICC_B",
      strikesCover: true,
      warCover: false,
      vesselImo: "9074729",
      portOfLoading: "CNSHA",
      portOfDischarge: "ERMSW",
      hsCode: "090111",
      goodsDescription: "Printers",
      invoiceNo: "INV-1",
      voyageNo: "V9",
      openCoverId: "9",
    });
  });
});
