// Life privileges. The Life service checks its own codes (life.<resource>.<action>, seeded in
// AuthService); the screens were first wired to our Life_* names. Each Life_* name below lists the
// backend codes it stands for (mapping from docs/life-insurance/11-backend-contract-2026-10.md, G10),
// so a user holding either the name or any of its codes passes the same check in the router, the
// sidebar and the action buttons.
import { hasPrivilege } from "@/utils/privileges";

const crud = (resource, actions = ["create", "read", "update", "delete"]) => actions.map((a) => `life.${resource}.${a}`);

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
  Life_Product_Manage: [...crud("rider"), ...crud("individual_rider"), ...crud("group_rider")],
  Life_Rate_Manage: [...crud("group_term"), ...crud("insurance_term"), ...crud("individual_rider"), ...crud("group_rider")],
  Life_Quotation_Create: [
    "life.quotation.create", ...crud("insured_person"), ...crud("quoted_rider"), ...crud("policy_treaty_mapping"),
    "life.benefit.create", "life.benefit.update", "life.benefit.delete", ...crud("individual_rider_benefit"),
    "life.customer.create", "life.customer.update",
  ],
  Life_Quotation_Issue: ["life.quotation.update"],
  Life_Payment_Record: ["life.quotation.update", "life.premium.pay"],
  Life_Policy_Issue: ["life.policy.update", "life.benefit.issue"],
  Life_Policy_Service: ["life.policy.service", "life.benefit.service"],
  Life_Underwriting_Decide: [
    "life.underwriting.decide", ...crud("question"), ...crud("possible_answer"), ...crud("answer"),
    "life.customer.verify", "life.beneficiary.update",
  ],
  Life_Reinsurance_Manage: [
    ...crud("reinsurer"), ...crud("reinsurance_treaty"), ...crud("reinsurance_treaty_member"), ...crud("reinsurance_fcl_group"),
    ...crud("reinsurance_medical_parameter"), ...crud("reinsurance_fcl_underwriting_range"),
    ...crud("reinsurance_treaty_medical_requirement"), ...crud("policy_treaty_mapping"),
  ],
  Life_Claim_Prepare: ["life.claim.create", "life.claim.update", ...crud("claim_attachment")],
  Life_Claim_Review: ["life.claim.update", "life.claim.register", "life.claim.assess", "life.claim.request_info"],
  Life_Claim_Approve: ["life.claim.update"],
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
