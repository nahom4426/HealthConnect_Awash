import { describe, expect, it, vi } from "vitest";

// responseHandler toasts on errors; keep the test output quiet
vi.mock("@/utils/utils", async (orig) => ({ ...(await orig<object>()), toasted: vi.fn() }));

import { responseHandler } from "@/service/ApiResponseHandler";
import { formatCurrency } from "@/utils/utils";
import { PaymentStatus } from "@/types/interface";

const axiosError = (status: number, data: unknown) => Object.assign(new Error("Request failed"), { response: { status, data } });

describe("claim API responses (ApiResponseHandler contract)", () => {
  it("wraps a successful claim list response", async () => {
    const page = { content: [{ claimUuid: "c1", totalAmount: 1200 }], totalElements: 1 };
    const res = await responseHandler(Promise.resolve({ data: page } as any));
    expect(res).toEqual({ status: 200, data: page, success: true, error: "" });
  });

  it("resolves (never throws) a server error so claim pages can show it", async () => {
    const res = await responseHandler(Promise.reject(axiosError(500, { message: "Claim already processed" })));
    expect(res.success).toBe(false);
    expect(res.status).toBe(500);
    expect(res.error).toBe("Claim already processed");
  });

  it("flattens backend field validation errors into one message", async () => {
    const res = await responseHandler(
      Promise.reject(axiosError(400, { fieldErrors: [{ field: "claimAmount", message: "must be positive" }] }))
    );
    expect(res.success).toBe(false);
    expect(res.error).toBe("Claim Amount: must be positive");
  });

  it("parses error bodies that arrive as JSON strings", async () => {
    const res = await responseHandler(Promise.reject(axiosError(409, JSON.stringify({ message: "Duplicate claim" }))));
    expect(res.error).toBe("Duplicate claim");
  });

  it("reports network failures without a response", async () => {
    const err = Object.assign(new Error("Network Error"), { request: {}, code: "ERR_NETWORK" });
    const res = await responseHandler(Promise.reject(err));
    expect(res).toMatchObject({ success: false, status: "ERR_NETWORK", error: "Network Error" });
  });
});

describe("claim money and statuses", () => {
  it("formats claim amounts consistently", () => {
    expect(formatCurrency(1234567.5)).toMatch(/1,234,567\.50/);
    expect(formatCurrency(0)).toMatch(/0\.00/);
  });

  it("keeps the payment status the Claims Payment page filters on", () => {
    // Lost once when interface.ts was replaced during the Nyala migration
    expect(PaymentStatus.PAYMENT_REQUESTED).toBe("PAYMENT_REQUESTED");
    expect(PaymentStatus.REQUESTED).toBe("REQUESTED");
  });
});
