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
