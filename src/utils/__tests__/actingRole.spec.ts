import { afterEach, describe, expect, it, vi } from "vitest";

// actingRole reads import.meta.env at module load, so each case re-imports it
async function load(env: Record<string, unknown>) {
  vi.resetModules();
  vi.stubEnv("DEV", env.DEV as boolean);
  if (env.VITE_ENABLE_ROLE_SWITCHER !== undefined) vi.stubEnv("VITE_ENABLE_ROLE_SWITCHER", String(env.VITE_ENABLE_ROLE_SWITCHER));
  return import("../actingRole");
}

function signIn(user: Record<string, unknown>) {
  localStorage.setItem("userDetail", JSON.stringify(user));
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe("acting role in production builds", () => {
  it("always uses the signed-in user's role, even if a demo role is stored", async () => {
    const m = await load({ DEV: false });
    signIn({ roleCode: "ROLE_ADJUSTOR" });
    localStorage.setItem("standard_active_testing_role", "ROLE_UNDERWRITER");
    expect(m.roleSwitcherEnabled).toBe(false);
    expect(m.getActingRole()).toBe("ROLE_ADJUSTOR");
  });

  it("ignores attempts to pick a demo role", async () => {
    const m = await load({ DEV: false });
    signIn({ roleCode: "ROLE_CUSTOMER" });
    m.setActingRole("ROLE_CLAIM_MANAGER");
    expect(localStorage.getItem("standard_active_testing_role")).toBeNull();
    expect(m.getActingRole()).toBe("ROLE_CUSTOMER");
  });

  it("returns no role when nobody is signed in", async () => {
    const m = await load({ DEV: false });
    expect(m.getActingRole()).toBe("");
  });

  it("reads the role from the nested user/role shapes the backends return", async () => {
    const m = await load({ DEV: false });
    signIn({ user: { role: { roleCode: "ROLE_UNDERWRITER" } } });
    expect(m.getSignedInRole()).toBe("ROLE_UNDERWRITER");
  });
});

describe("acting role in demo builds", () => {
  it("lets the switcher override the signed-in role in dev", async () => {
    const m = await load({ DEV: true });
    signIn({ roleCode: "ROLE_ADJUSTOR" });
    m.setActingRole("ROLE_CLAIM_MANAGER");
    expect(m.getActingRole()).toBe("ROLE_CLAIM_MANAGER");
  });

  it("can be enabled on a built demo with VITE_ENABLE_ROLE_SWITCHER", async () => {
    const m = await load({ DEV: false, VITE_ENABLE_ROLE_SWITCHER: "true" });
    expect(m.roleSwitcherEnabled).toBe(true);
  });

  it("clearActingRole drops the demo and legacy keys", async () => {
    const m = await load({ DEV: true });
    signIn({ roleCode: "ROLE_ADJUSTOR" });
    localStorage.setItem("standard_active_testing_role", "ROLE_UNDERWRITER");
    localStorage.setItem("awash_active_testing_role", "ROLE_UNDERWRITER");
    m.clearActingRole();
    expect(localStorage.getItem("awash_active_testing_role")).toBeNull();
    expect(m.getActingRole()).toBe("ROLE_ADJUSTOR");
  });
});
