import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../constants";
import { currencyChoices, displayedCurrency } from "../utils/currencyChoices";
import { productSelectable } from "../utils/productAvailability";
import { suppliedVerifyUrl } from "../utils/verifyLink";

const inland = PRODUCTS.find((p) => p.value === "INLAND_TRANSIT");
const single = PRODUCTS.find((p) => p.value === "SINGLE_SHIPMENT");

describe("marine display safeguards", () => {
  it("leaves inland transit unselectable until config turns it on", () => {
    expect(productSelectable(inland, { inlandTransit: false })).toBe(false);
    expect(productSelectable(inland, {})).toBe(false);
    expect(productSelectable(inland, { inlandTransit: true })).toBe(true);
    expect(productSelectable(single, { inlandTransit: false })).toBe(true);
  });

  it("offers only the configured currencies and defaults to ETB", () => {
    expect(currencyChoices(null, ["ETB"])).toEqual(["ETB"]);
    expect(currencyChoices(null, null)).toEqual(["ETB"]);
    expect(currencyChoices(null, ["ETB"])).not.toEqual(expect.arrayContaining(["USD", "EUR"]));
    expect(displayedCurrency("", "ETB", ["ETB"])).toBe("ETB");
    expect(displayedCurrency("USD", "ETB", ["ETB"])).toBe("ETB");
    expect(displayedCurrency("ETB", "ETB", ["ETB"])).toBe("ETB");
  });

  it("shows a verification link only when the API supplies an absolute http address", () => {
    expect(suppliedVerifyUrl("")).toBe("");
    expect(suppliedVerifyUrl(null)).toBe("");
    expect(suppliedVerifyUrl("/verify/abc")).toBe("");
    expect(suppliedVerifyUrl("https://app.example/verify/abc")).toBe("https://app.example/verify/abc");
  });
});
