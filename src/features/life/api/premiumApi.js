// Premium schedule and payments (contract 2026-10, G6). Amounts, taxes and overdue days are the
// backend's; a payment is for the schedule item's amountDue.
import { lifeApi } from "./lifeClient";

/** GET /premium/schedule · query: quotationUuid | benefitUuid · returns: ScheduleItemResponse[] */
export function getPremiumSchedule(params = {}) {
  return lifeApi().get(`/premium/schedule`, { params });
}
/** POST /premium/payment · body: PremiumPaymentRequest { scheduleItemUuid, amount = amountDue, receiptNumber (unique), receiptDate, method, reference? } */
export function recordPremiumPayment(data) {
  return lifeApi().post(`/premium/payment`, data);
}
/** GET /premium/payments · query: quotationUuid | benefitUuid, from, to, page, limit · returns: { content: PremiumPaymentResponse[], … } */
export function getPremiumPayments(params = {}) {
  return lifeApi().get(`/premium/payments`, { params });
}
/** GET /premium/outstanding · query: quotationUuid | benefitUuid, asOf · returns: ScheduleItemResponse[] (unpaid, due on or before asOf) */
export function getOutstandingPremiums(params = {}) {
  return lifeApi().get(`/premium/outstanding`, { params });
}
/** GET /premium/receipt/{paymentUuid} · returns: PDF */
export function getPremiumReceipt(paymentUuid) {
  return lifeApi().get(`/premium/receipt/${paymentUuid}`, { responseType: "blob" });
}
