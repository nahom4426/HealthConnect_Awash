// WT1: quote, bind and issue a single-shipment certificate (plan section 10).
import { expect, test } from "@playwright/test";
import { expectAccessible, pick, signIn, today } from "./helpers";

test("an underwriter quotes, binds and emails a certificate", async ({ page }) => {
  await signIn(page, ["UNDERWRITER"]);
  await page.goto("/marine/quotes");
  await page.getByRole("button", { name: "New quote" }).first().click();

  // Step 1: parties, with the Incoterm warning
  await pick(page, "Search insured by name or TIN", "Abyss", /Abyssinia Agro/);
  await page.getByText("Buyer", { exact: true }).click();
  await page.getByLabel("Incoterm").selectOption("CIF");
  await expect(page.getByText("Under CIF the seller normally insures.")).toBeVisible();
  await page.getByLabel("Incoterm").selectOption("FOB");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Next" }).click();

  // Step 2: shipment; the IMO lookup fills the vessel card
  await page.getByLabel("Mode of conveyance").selectOption("SEA");
  const imo = page.getByPlaceholder("7 digits, e.g. 9074729");
  await imo.fill("9074728");
  await imo.press("Enter");
  await expect(page.getByText("This IMO number's check digit is wrong")).toBeVisible();
  await imo.fill("9074729");
  await imo.press("Enter");
  await expect(page.getByText("MV Abay Star")).toBeVisible();
  await pick(page, "Search port by name or UN/LOCODE", "Shanghai", /CNSHA/, 0);
  await pick(page, "Search port by name or UN/LOCODE", "DJJIB", /DJJIB/, 0);
  await page.getByLabel("Final destination").fill("Modjo dry port");
  await page.getByLabel("Sailing date").fill(today());
  await pick(page, "Search by HS code or description", "cotton", /520100/);
  await page.getByLabel("Goods description").fill("Raw cotton in 400 pressed bales");
  await page.getByLabel("Invoice value").fill("100000");
  await page.getByLabel("Freight").fill("5000");
  await page.getByLabel("Freight").blur();
  await expect(page.getByText("USD 115,500.00").first()).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  // Step 3: cover
  await page.getByText("ICC A (all risks)").click();
  await page.getByRole("button", { name: "Next" }).click();

  // Step 4: price; changing an input after rating blocks Bind until re-rated
  await page.getByRole("button", { name: "Get quote" }).click();
  await expect(page.getByText("Total premium")).toBeVisible();
  await expect(page).toHaveURL(/\/marine\/quotes\/\d+\/edit/);
  await page.getByRole("button", { name: "Bind", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Bind" }).click();
  await expect(page).toHaveURL(/\/marine\/policies\/\d+/);

  // Policy → certificate (issued a few seconds after binding) → email
  await page.getByRole("tab", { name: /Certificates/ }).click();
  await page.getByRole("link", { name: /^C-\d{4}-\d{5}$/ }).click();
  await expect(page.getByText("Issued", { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Email" }).click();
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/Emailed by/)).toBeVisible();
  await expectAccessible(page);
});
