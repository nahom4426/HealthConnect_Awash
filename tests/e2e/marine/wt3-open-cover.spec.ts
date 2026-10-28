// WT3: declare a shipment on an open cover, then the year-end adjustment (plan section 10, FE-29 to FE-33).
import { expect, test } from "@playwright/test";
import { actAs, daysFromToday, expectAccessible, pick, signIn } from "./helpers";

test("a declaration uses the agreed rate and reduces the balance; finance posts the adjustment once", async ({ page }) => {
  await signIn(page, ["UNDERWRITER"]);
  await page.goto("/marine/open-covers");
  await page.getByRole("link", { name: /^OC-\d{4}-00001$/ }).click();
  await expect(page.getByText("USD 5,000,000.00").first()).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Declare shipment" }).first().click();

  // Insured, broker and terms are fixed by the cover
  await expect(page.getByText("Fixed by open cover")).toBeVisible();
  await page.getByText("Buyer", { exact: true }).click();
  await page.getByLabel("Incoterm").selectOption("FOB");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Mode of conveyance").selectOption("SEA");
  const imo = page.getByPlaceholder("7 digits, e.g. 9074729");
  await imo.fill("9532161");
  await imo.press("Enter");
  await expect(page.getByText("Maersk Kalahari")).toBeVisible();
  await pick(page, "Search port by name or UN/LOCODE", "Shanghai", /CNSHA/, 0);
  await pick(page, "Search port by name or UN/LOCODE", "DJJIB", /DJJIB/, 0);
  await page.getByLabel("Final destination").fill("Modjo dry port");
  // Ten days after sailing is late on a 7-day cover
  await page.getByLabel("Sailing date").fill(daysFromToday(-10));
  await expect(page.getByText(/Late declaration/)).toBeVisible();
  // Only the cover's commodities are offered
  await pick(page, "Search by HS code or description", "wheat", /100190/);
  await page.getByLabel("Goods description").fill("Milling wheat in bulk");
  await page.getByLabel("Invoice value").fill("100000");
  await page.getByLabel("Freight").fill("5000");
  await page.getByLabel("Freight").blur();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Clause, war and strikes follow the open cover's terms.")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Get quote" }).click();
  await expect(page.getByText("Agreed rate (open cover)")).toBeVisible();
  await expect(page.getByText("Remaining after")).toBeVisible();
  await page.getByRole("button", { name: "Bind", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Bind" }).click();

  // Back on the cover: the declaration is listed, late, and the balance went down
  await expect(page).toHaveURL(/\/marine\/open-covers\/1$/);
  await expect(page.getByText("USD 4,884,500.00")).toBeVisible();
  await expect(page.getByText("Late", { exact: true })).toBeVisible();

  // Finance adjusts last year's cover
  await actAs(page, "FINANCE");
  await page.goto("/marine/open-covers/2");
  await page.getByRole("button", { name: "Year-end adjustment" }).first().click();
  await expect(page.getByText("Refund to insured")).toBeVisible();
  await page.getByRole("button", { name: "Post adjustment" }).click();
  await expect(page.getByText(/accounting export ACC-/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Year-end adjustment" })).toHaveCount(0);
});
