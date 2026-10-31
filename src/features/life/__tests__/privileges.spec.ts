import { describe, expect, it, vi } from "vitest";

// The check itself reads the signed-in user; only the name-to-code map is tested here
vi.mock("@/utils/privileges", () => ({ hasPrivilege: () => true }));
import { LIFE_PRIVILEGES, lifePermissions } from "../privileges";

describe("Life privilege map", () => {
  it("expands our Life_* names to the backend's life.* codes, keeping the names", () => {
    const perms = lifePermissions("Life_Claim_Pay", "Life_Policy_Issue");
    expect(perms).toEqual(expect.arrayContaining(["Life_Claim_Pay", "life.claim.pay", "Life_Policy_Issue", "life.policy.update", "life.benefit.issue"]));
    expect(new Set(perms).size).toBe(perms.length);
  });

  it("accepts arrays as well as separate names, and passes unknown names through", () => {
    expect(lifePermissions(["Life_Report_View"])).toEqual(["Life_Report_View", "life.report.read", "life.dashboard.read"]);
    expect(lifePermissions("Dashboard")).toEqual(["Dashboard"]);
  });

  it("only maps to codes of the form life.<resource>.<action>", () => {
    for (const codes of Object.values(LIFE_PRIVILEGES)) {
      for (const c of codes) expect(c).toMatch(/^life\.[a-z_]+\.[a-z_]+$/);
    }
  });
});

// The 8 Life roles as seeded in AuthService (2026-10-31): their write codes, plus the read codes every
// Life role holds. Each role must pass only its own checks.
const READS = LIFE_PRIVILEGES.Life_Read;
const ROLES: Record<string, string[]> = {
  "Life Claims Manager": ["Life_Claim_Approve", "Life_Claim_Authorize", "Life_Report_View", "life.claim.authorize", "life.claim.update", "life.report.read", "life.dashboard.read"],
  "Life Claims Officer": ["Life_Claim_Review", "life.claim.assess", "life.claim.register", "life.claim.request_info", "life.claim.update"],
  "Life Claims Agency": ["Life_Claim_Prepare", "life.claim.create", "life.claim.update", "life.claim_attachment.create", "life.claim_attachment.delete", "life.claim_attachment.update"],
  "Life Reinsurance Manager": ["Life_Reinsurance_Manage", "Life_Report_View", "life.policy_treaty_mapping.create", "life.policy_treaty_mapping.update", "life.reinsurer.create", "life.reinsurance_treaty.update", "life.report.read"],
  "Life Policy Administrator": ["Life_Policy_Issue", "Life_Policy_Service", "life.benefit.issue", "life.benefit.service", "life.policy.service", "life.policy.update"],
  "Life Finance Officer": ["Life_Claim_Pay", "Life_Payment_Record", "Life_Report_View", "life.claim.pay", "life.premium.pay", "life.quotation.update", "life.report.read"],
  "Life Underwriter": [
    "Life_Quotation_Create", "Life_Quotation_Issue", "Life_Underwriting_Decide", "life.quotation.create", "life.quotation.update", "life.insured_person.create",
    "life.policy_treaty_mapping.create", "life.customer.create", "life.customer.verify", "life.question.create", "life.underwriting.decide", "life.benefit.create",
  ],
  "Life Product Manager": ["Life_Product_Manage", "Life_Rate_Manage", "Life_Report_View", "life.rider.create", "life.group_term.update", "life.individual_rider.create", "life.report.read"],
};
const EXPECTED: Record<string, string[]> = {
  "Life Claims Manager": ["Life_Claim_Approve", "Life_Claim_Authorize", "Life_Report_View"],
  "Life Claims Officer": ["Life_Claim_Review"],
  "Life Claims Agency": ["Life_Claim_Prepare"],
  "Life Reinsurance Manager": ["Life_Reinsurance_Manage", "Life_Report_View"],
  "Life Policy Administrator": ["Life_Policy_Issue", "Life_Policy_Service"],
  "Life Finance Officer": ["Life_Payment_Record", "Life_Claim_Pay", "Life_Report_View"],
  "Life Underwriter": ["Life_Quotation_Create", "Life_Quotation_Issue", "Life_Underwriting_Decide"],
  "Life Product Manager": ["Life_Product_Manage", "Life_Rate_Manage", "Life_Report_View"],
};

describe("Life roles", () => {
  const passes = (held: string[], name: string) => lifePermissions(name).some((p) => held.includes(p));
  const names = Object.keys(LIFE_PRIVILEGES).filter((n) => n !== "Life_Read");

  for (const [role, codes] of Object.entries(ROLES)) {
    it(`${role} passes only its own checks`, () => {
      const held = [...codes, ...READS];
      expect(names.filter((n) => passes(held, n)).sort()).toEqual([...EXPECTED[role]].sort());
    });
    it(`${role} passes them on the backend codes alone`, () => {
      const held = [...codes.filter((c) => c.startsWith("life.")), ...READS];
      expect(names.filter((n) => passes(held, n)).sort()).toEqual([...EXPECTED[role]].sort());
    });
  }
});
