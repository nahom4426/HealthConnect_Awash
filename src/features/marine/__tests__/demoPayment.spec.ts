import { describe, expect, it } from "vitest";
import { demoPaymentVisible } from "../utils/demoPayment";

describe("marine demo payment", () => {
  it("hides the payment amount until a quotation is rated", () => {
    expect(demoPaymentVisible({ demoPayment: true }, { premium: null })).toBe(false);
    expect(demoPaymentVisible({ demoPayment: true }, {})).toBe(false);
    expect(demoPaymentVisible({ demoPayment: true }, { premium: { total: null } })).toBe(false);
  });

  it("shows the demo section only for a rated quotation when the API allows it", () => {
    const rated = { premium: { total: "2500.00", currency: "ETB" } };
    expect(demoPaymentVisible({ demoPayment: true }, rated)).toBe(true);
    expect(demoPaymentVisible({ demoPayment: false }, rated)).toBe(false);
    expect(demoPaymentVisible({}, rated)).toBe(false);
    expect(demoPaymentVisible(null, rated)).toBe(false);
  });
});
