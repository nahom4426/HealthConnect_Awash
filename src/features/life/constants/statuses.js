// Status enums exactly as the Life Insurance OpenAPI document defines them.
// Do not add values here that the backend doesn't have; raise a backend gap instead
// (docs/life-insurance/07-status-lifecycle.md).

/** QuotationRequest/Response.quotationStatus — the group application pipeline */
export const QuotationStatus = Object.freeze({
  PENDING: "PENDING",
  ISSUED: "ISSUED",
  ACCEPTED: "ACCEPTED",
  PAID: "PAID",
});

/** PolicyResponse.policyStatus, InsuredRequest.status, rider rate tables */
export const PolicyStatus = Object.freeze({
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  MODIFIED: "MODIFIED",
  DISABLED: "DISABLED",
  LAPSED: "LAPSED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  RENEWED: "RENEWED",
});

/** BenefitRequest/Response.paymentFrequency: how the annual premium is split into instalments */
export const PaymentFrequency = Object.freeze({
  ANNUAL: "ANNUAL",
  SEMI_ANNUAL: "SEMI_ANNUAL",
  QUARTERLY: "QUARTERLY",
  MONTHLY: "MONTHLY",
  SINGLE: "SINGLE",
});

/** BenefitResponse.status (individual term policy) and IndividualRiderBenefit.status */
export const BenefitStatus = Object.freeze({
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  RENEWED: "RENEWED",
  DISABLED: "DISABLED",
  LAPSED: "LAPSED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
});

/** Question, group-term rate rows, reinsurer */
export const RecordStatus = Object.freeze({ ACTIVE: "ACTIVE", PENDING: "PENDING", DISABLED: "DISABLED" });

/** Reinsurance treaty, members, FCL groups/ranges, medical parameters, policy-treaty mapping */
export const TreatyStatus = Object.freeze({ ACTIVE: "ACTIVE", PENDING: "PENDING", REVISED: "REVISED" });

export const QuestionType = Object.freeze({ Text: "Text", Multiselect: "Multiselect", Numeric: "Numeric", Radio: "Radio" });
export const InsuranceType = Object.freeze({ Group: "Group", Individual: "Individual" });
export const TreatyType = Object.freeze({ Surplus: "Surplus", Risk_Premium: "Risk_Premium" });
export const ReinsuranceCoverage = Object.freeze({ Term_Only: "Term_Only", Term_And_Riders: "Term_And_Riders" });
export const ParticipationType = Object.freeze({ Leader: "Leader", Follower: "Follower" });

/**
 * Claim statuses are plain strings in Swagger (ClaimListResponse.status and the
 * *ByStatus fields have no enum). The work queues below are the backend's lists,
 * in the order a claim moves through them.
 */
export const ClaimQueues = Object.freeze([
  { key: "saved", label: "Saved (agency draft)", side: "agency" },
  { key: "requested", label: "Requested", side: "agency" },
  { key: "registered", label: "Registered", side: "insurance" },
  { key: "reviewed", label: "Reviewed", side: "insurance" },
  { key: "approved", label: "Approved", side: "insurance" },
  { key: "for-authorization", label: "Awaiting authorization", side: "insurance" },
  { key: "authorized", label: "Authorized", side: "insurance" },
  { key: "paid", label: "Paid", side: "both" },
  { key: "rejected", label: "Rejected", side: "both" },
]);
