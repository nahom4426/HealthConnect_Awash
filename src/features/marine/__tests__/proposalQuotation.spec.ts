import { describe, expect, it } from "vitest";
import { fieldRequired, fieldVisible, validateAnswers } from "../../fire/schemaForm";
import { productChoiceValid, visibleProducts } from "../utils/marineProducts";
import { bindingEligibility, customerReference, proposalAnswers, ratingBlockers, submittedValue } from "../utils/quotationView";

const products = [
  { code: "SINGLE_SHIPMENT", visible: true, available: true },
  { code: "INLAND_TRANSIT", visible: true, available: false, unavailableReason: "Not available yet." },
  { code: "HULL", visible: false, available: false },
];

describe("marine proposal product selection", () => {
  it("shows single shipment and inland transit, and hides hull", () => {
    expect(visibleProducts(products).map((product) => product.code)).toEqual(["SINGLE_SHIPMENT", "INLAND_TRANSIT"]);
  });

  it("accepts only an available product from the config", () => {
    expect(productChoiceValid(products, "SINGLE_SHIPMENT")).toBe(true);
    expect(productChoiceValid(products, "INLAND_TRANSIT")).toBe(false);
    expect(productChoiceValid(products, "HULL")).toBe(false);
    expect(productChoiceValid(null, "SINGLE_SHIPMENT")).toBe(false);
  });
});

describe("proposal arrangement", () => {
  const voyage = { id: "portOfLoading", label: "Loading", required: true, visibleWhen: { field: "insuranceArrangement", equals: "SINGLE_SHIPMENT" } };
  const routes = { id: "tradingRoutes", label: "Routes", required: true, visibleWhen: { field: "insuranceArrangement", equals: "OPEN_COVER" } };

  it("shows the voyage for a single shipment and the trading profile for open cover", () => {
    expect(fieldVisible(voyage, { insuranceArrangement: "SINGLE_SHIPMENT" })).toBe(true);
    expect(fieldVisible(routes, { insuranceArrangement: "SINGLE_SHIPMENT" })).toBe(false);
    expect(fieldVisible(voyage, { insuranceArrangement: "OPEN_COVER" })).toBe(false);
    expect(fieldRequired(voyage, { insuranceArrangement: "OPEN_COVER" })).toBe(false);
    expect(fieldRequired(routes, { insuranceArrangement: "OPEN_COVER" })).toBe(true);
  });

  it("does not require a loading port on an open cover proposal", () => {
    const steps = [
      { fields: [{ id: "insuranceArrangement", type: "text", label: "Arrangement", required: true }] },
      { visibleWhen: { field: "insuranceArrangement", equals: "SINGLE_SHIPMENT" }, fields: [voyage] },
      { visibleWhen: { field: "insuranceArrangement", equals: "OPEN_COVER" }, fields: [routes] },
    ];
    expect(validateAnswers(steps, {
      insuranceArrangement: "OPEN_COVER",
      tradingRoutes: "Shanghai to Djibouti",
    })).toBe("");
  });

  it("does not require mode of conveyance when open cover hides the voyage step", () => {
    const conveyanceMode = {
      id: "conveyanceMode",
      type: "dropdown",
      label: "Mode of conveyance",
      required: true,
    };
    const conveyanceTypes = {
      id: "conveyanceTypes",
      type: "multiselect",
      label: "Conveyance types",
      required: true,
    };
    const steps = [
      { fields: [{ id: "insuranceArrangement", type: "arrangement", label: "Arrangement", required: true }] },
      {
        visibleWhen: { field: "insuranceArrangement", equals: "SINGLE_SHIPMENT" },
        fields: [conveyanceMode],
      },
      {
        visibleWhen: { field: "insuranceArrangement", equals: "OPEN_COVER" },
        fields: [conveyanceTypes],
      },
    ];
    expect(validateAnswers(steps, {
      insuranceArrangement: "OPEN_COVER",
      conveyanceTypes: ["SEA"],
    })).toBe("");
    expect(validateAnswers(steps, {
      insuranceArrangement: "OPEN_COVER",
      conveyanceTypes: [],
    })).toBe("Conveyance types is required");
  });
});

describe("proposal and quotation", () => {
  const quote = {
    status: "QUOTED",
    quotationStage: "QUOTED",
    goodsDescription: "Tea",
    proposalAnswers: JSON.stringify({
      proposerName: "Blue Nile",
      goodsDescription: "Coffee",
      selectedPerils: ["ICC_A"],
      riskItems: [{ itemType: "CARGO_VALUE", sumInsured: "1000" }],
    }),
    premium: { total: "2500.00" },
  };

  it("keeps the original proposal answers beside a revised quotation value", () => {
    expect(proposalAnswers(quote)?.goodsDescription).toBe("Coffee");
    expect(customerReference(quote).map((row) => row.value)).toContain("Coffee");
    expect(submittedValue(quote, "goodsDescription", quote.goodsDescription)).toBe("Coffee");
    expect(submittedValue(quote, "goodsDescription", "Coffee")).toBeNull();
  });

  it("requires an insured selected from master data and shows that name on the quotation", () => {
    const steps = [{ fields: [{ id: "insuredParty", type: "party", label: "Insured", required: true }] }];
    expect(validateAnswers(steps, { insuredParty: null })).toBe("Insured is required");
    expect(validateAnswers(steps, { insuredParty: { id: "44", name: "Blue Nile" } })).toBe("");
    const withParty = {
      proposalAnswers: JSON.stringify({ insuredParty: { id: "44", name: "Blue Nile" }, consignee: { id: "45", name: "Dry Port" } }),
    };
    expect(customerReference(withParty).map((row) => row.value)).toEqual(expect.arrayContaining(["Blue Nile", "Dry Port"]));
  });

  it("shows why an unrated quotation has no premium", () => {
    expect(ratingBlockers({
      premium: null,
      ratingBlockers: ["A vessel with a valid IMO number is required for sea modes"],
    })).toEqual(["A vessel with a valid IMO number is required for sea modes"]);
    expect(ratingBlockers(quote)).toEqual([]);
  });

  it("does not treat an unrated quotation as ready to bind", () => {
    expect(bindingEligibility({ status: "DRAFT", quotationStage: "PENDING_UNDERWRITING", premium: null })).toMatch(/No premium/);
    expect(bindingEligibility({ status: "QUOTED", sanctionsConfirmed: true, premium: { total: "1.00" } })).toMatch(/sanctions/i);
    expect(bindingEligibility(quote)).toMatch(/demo payment/i);
  });
});
