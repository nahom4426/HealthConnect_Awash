import { createRequire } from "node:module";
import { expect, type Page } from "@playwright/test";

const require = createRequire(import.meta.url);

/**
 * Signs in with a placeholder session (the mock backend accepts any) and picks the Marine roles to
 * act as. The mock database starts fresh in every test because each test has its own browser context.
 */
export async function signIn(page: Page, roles: string[] | null = null) {
  await page.addInitScript((r) => {
    if (sessionStorage.getItem("e2e.init")) return;
    sessionStorage.setItem("e2e.init", "1");
    localStorage.setItem("userDetail", JSON.stringify({ user: { token: "e2e-placeholder", firstName: "E2E", lastName: "Tester", roleName: "Super Admin", privileges: ["All Privileges"], email: "e2e@local.test", username: "e2e" } }));
    localStorage.setItem("login_timestamp", String(Date.now()));
    localStorage.setItem("activeModule", "marine");
    if (r) localStorage.setItem("marine.devRoles", r.join(","));
    else localStorage.removeItem("marine.devRoles");
  }, roles);
}

/** Switches the acting role through the page's own "viewing as" control. */
export async function actAs(page: Page, role: string) {
  await page.getByLabel("Viewing as role").selectOption(role);
}

/** Calls the mock backend directly, for setting up data a walkthrough doesn't exercise. */
export async function mock(page: Page, method: string, url: string, data?: unknown, roles = "SENIOR_UNDERWRITER,UNDERWRITER,CLAIMS_HANDLER,CLAIMS_MANAGER,FINANCE,ADMIN") {
  return page.evaluate(
    async ({ method, url, data, roles }) => {
      const m = await import("/src/features/marine/mock/server.js");
      const res = await m.handleRequest({ method, url, data: data === undefined ? undefined : JSON.stringify(data), headers: { "x-dev-roles": roles, "x-dev-user": "E2E Tester" } }).catch((e: any) => e.response);
      return res.data;
    },
    { method, url, data, roles }
  );
}

export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date());
export const daysFromToday = (n: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date(Date.now() + n * 86400000));

export const SHIPMENT = {
  product: "SINGLE_SHIPMENT", insuredId: "1", insuredRole: "BUYER", incoterm: "FOB", mode: "SEA", vesselImo: "9074729", portOfLoading: "CNSHA",
  transshipmentPorts: [], portOfDischarge: "DJJIB", finalDestination: "Modjo dry port", hsCode: "520100", goodsDescription: "Raw cotton in bales",
  currency: "USD", invoiceValue: "100000.00", freight: "5000.00", containers: [], clause: "ICC_A", warCover: true, strikesCover: false, lc: { enabled: false },
};

/** Quotes, rates and binds a shipment in the mock; returns the bind result. */
export async function issueCertificate(page: Page, overrides: Record<string, unknown> = {}) {
  const q = await mock(page, "post", "/quotes", { ...SHIPMENT, sailingDate: today(), ...overrides });
  await mock(page, "post", `/quotes/${q.id}/rate`);
  return mock(page, "post", `/quotes/${q.id}/bind`);
}

/** No serious or critical WCAG 2.1 A/AA violations inside the page content (plan section 9). */
export async function expectAccessible(page: Page) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const violations = await page.evaluate(async () => {
    const r = await (window as any).axe.run(document.querySelector(".page-wrapper") ?? document.body, {
      resultTypes: ["violations"],
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return r.violations.filter((v: any) => ["serious", "critical"].includes(v.impact)).map((v: any) => `${v.id}: ${v.nodes.map((n: any) => n.target.join(" ")).join(", ")}`);
  });
  expect(violations).toEqual([]);
}

/** Picks an option from one of the app's search-as-you-type pickers. */
export async function pick(page: Page, placeholder: string | RegExp, query: string, option: string | RegExp, nth = 0) {
  const box = page.getByPlaceholder(placeholder).nth(nth);
  await box.click();
  await box.fill(query);
  await page.getByRole("option", { name: option }).first().click();
}
