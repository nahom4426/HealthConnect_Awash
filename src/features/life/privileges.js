// Life privileges. The Life service checks its own codes (life.<resource>.<action>, seeded in
// AuthService); the screens were first wired to our Life_* names. Each Life_* name below lists the
// backend codes it stands for (mapping from docs/life-insurance/11-backend-contract-2026-10.md, G10),
// so a user holding either the name or any of its codes passes the same check in the router, the
// sidebar and the action buttons.
// Every Life role holds every life.*.read code, so only Life_Read maps to reads; the other names map to
// codes that tell the roles apart (a shared code would let one role pass another's check).
import { hasPrivilege } from "@/utils/privileges";

const write = (resource) => ["create", "update", "delete"].map((a) => `life.${resource}.${a}`);

export const LIFE_PRIVILEGES = {
  Life_Read: [
    "life.rider.read", "life.group_term.read", "life.insurance_term.read", "life.individual_rider.read", "life.group_rider.read",
    "life.quotation.read", "life.quoted_rider.read", "life.insured_person.read", "life.policy.read", "life.benefit.read",
    "life.individual_rider_benefit.read", "life.claim.read", "life.claim_attachment.read", "life.claim_log.read",
    "life.question.read", "life.possible_answer.read", "life.answer.read", "life.reinsurer.read", "life.reinsurance_treaty.read",
    "life.reinsurance_treaty_member.read", "life.reinsurance_fcl_group.read", "life.reinsurance_medical_parameter.read",
    "life.reinsurance_fcl_underwriting_range.read", "life.reinsurance_treaty_medical_requirement.read",
    "life.policy_treaty_mapping.read", "life.customer.read", "life.beneficiary.read", "life.underwriting.read",
    "life.premium.read", "life.document.read",
  ],
  Life_Product_Manage: [...write("rider"), ...write("individual_rider"), ...write("group_rider")],
  Life_Rate_Manage: [...write("group_term"), ...write("insurance_term"), ...write("individual_rider"), ...write("group_rider")],
  Life_Quotation_Create: [
    "life.quotation.create", ...write("insured_person"), ...write("quoted_rider"),
    ...write("benefit"), ...write("individual_rider_benefit"), "life.customer.create", "life.customer.update",
  ],
  // The backend needs life.quotation.update both to issue and to record payment, and finance holds it,
  // so issuing is told apart by life.quotation.create (whoever prepares quotations issues them)
  Life_Quotation_Issue: ["life.quotation.create"],
  Life_Payment_Record: ["life.premium.pay"],
  Life_Policy_Issue: ["life.policy.update", "life.benefit.issue"],
  Life_Policy_Service: ["life.policy.service", "life.benefit.service"],
  Life_Underwriting_Decide: [
    "life.underwriting.decide", ...write("question"), ...write("possible_answer"), ...write("answer"),
    "life.customer.verify", "life.beneficiary.update",
  ],
  Life_Reinsurance_Manage: [
    ...write("reinsurer"), ...write("reinsurance_treaty"), ...write("reinsurance_treaty_member"), ...write("reinsurance_fcl_group"),
    ...write("reinsurance_medical_parameter"), ...write("reinsurance_fcl_underwriting_range"),
    ...write("reinsurance_treaty_medical_requirement"),
  ],
  // life.claim.update covers preparing, reviewing and approving (backend follow-up #3), so it maps to none
  // of them. Until it is split, approving goes with life.claim.authorize: the claims manager holds both.
  Life_Claim_Prepare: ["life.claim.create", ...write("claim_attachment")],
  Life_Claim_Review: ["life.claim.register", "life.claim.assess", "life.claim.request_info"],
  Life_Claim_Approve: ["life.claim.authorize"],
  Life_Claim_Authorize: ["life.claim.authorize"],
  Life_Claim_Pay: ["life.claim.pay"],
  Life_Report_View: ["life.report.read", "life.dashboard.read"],
};

/** The given Life_* names plus every backend code they stand for (for route/nav meta.permissions). */
export function lifePermissions(...names) {
  return [...new Set(names.flat().flatMap((n) => [n, ...(LIFE_PRIVILEGES[n] || [])]))];
}

/** Template/script check: the user holds any of these Life_* names or one of their backend codes. */
export const lifeCan = (...names) => hasPrivilege(lifePermissions(...names));
