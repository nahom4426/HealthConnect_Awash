// WT5: handle a claim from registration to close (plan section 10, FE-37 to FE-45).
import { expect, test, type Page } from "@playwright/test";
import { actAs, daysFromToday, expectAccessible, issueCertificate, signIn } from "./helpers";

const pdf = (name: string) => ({ name, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });

async function uploadOnDocuments(page: Page, label: string, file: string) {
  const row = page.locator("li", { hasText: label }).first();
  await row.getByRole("button", { name: "Upload" }).click();
  await row.locator("input[type=file]").setInputFiles(pdf(file));
  await expect(row.getByText("Received")).toBeVisible();
}

test("register, survey, recover, assess, settle to the LC bank and close", async ({ page }) => {
  await signIn(page, ["CLAIMS_HANDLER"]);
  await page.goto("/marine/claims");
  const bound = await issueCertificate(page, {
    sailingDate: daysFromToday(-12),
    lc: { enabled: true, number: "LC-AW-77", bankId: "6", amount: "100000", expiry: daysFromToday(40) },
  });

  // Register from the policy's Claims tab: the certificate is pre-filled and the LC bank is payee
  await page.goto(`/marine/policies/${bound.policy.id}?tab=claims`);
  await page.getByRole("link", { name: "Register claim" }).click();
  await expect(page.getByText("Awash Bank").first()).toBeVisible();
  await page.getByLabel("Loss date").fill(daysFromToday(-3));
  await page.getByLabel("Delivery date").fill(daysFromToday(-2));
  await page.getByLabel("Claim type").selectOption("PARTICULAR_AVERAGE");
  await page.getByLabel("Cause of loss").selectOption("WATER_DAMAGE");
  await page.getByLabel("Estimated amount").fill("12000");
  await page.getByLabel("Description").fill("Bales wet on arrival at the dry port");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Register claim" }).click();
  await expect(page).toHaveURL(/\/marine\/claims\/\d+$/);
  await expect(page.getByText("Covered under ICC A")).toBeVisible();

  // Survey: appoint, then the report closes the survey deadline and marks the claim Surveyed
  await page.getByRole("tab", { name: "Survey" }).click();
  await page.getByPlaceholder("Search surveyor by name or TIN").click();
  await page.getByPlaceholder("Search surveyor by name or TIN").fill("Horn");
  await page.getByRole("option", { name: /Horn Marine Surveyors/ }).click();
  await page.getByRole("button", { name: "Appoint surveyor" }).click();
  await page.locator("input[type=file][accept='.pdf,application/pdf']").setInputFiles(pdf("survey-report.pdf"));
  await expect(page.getByText("Surveyed", { exact: true }).first()).toBeVisible();

  // Recovery: the notice date meets the carrier notice deadline
  await page.getByRole("tab", { name: "Recovery" }).click();
  await page.getByPlaceholder("Search carrier by name or TIN").click();
  await page.getByPlaceholder("Search carrier by name or TIN").fill("Mediterranean");
  await page.getByRole("option", { name: /Mediterranean Shipping Agency/ }).click();
  await page.getByLabel("Notice sent").fill(daysFromToday(0));
  await page.getByLabel("Amount claimed").fill("5000");
  await page.getByRole("button", { name: "Save recovery" }).click();
  await page.getByRole("tab", { name: /Deadlines/ }).click();
  await expect(page.locator("tr", { hasText: "Carrier notice" }).getByText("Met")).toBeVisible();

  // Documents
  await page.getByRole("tab", { name: /Documents/ }).click();
  await uploadOnDocuments(page, "Original certificate", "certificate.pdf");
  await uploadOnDocuments(page, "Bill of lading", "bl.pdf");

  // Assess, then the manager settles; a missing document is listed first
  await page.getByRole("button", { name: "Assess" }).click();
  await page.getByText("Yes", { exact: true }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();

  await actAs(page, "CLAIMS_MANAGER");
  await page.getByRole("button", { name: "Settle" }).click();
  await page.getByRole("alertdialog").or(page.getByRole("dialog")).getByRole("button", { name: "Send to Finance" }).click();
  await expect(page.getByText("Commercial invoice is missing")).toBeVisible();
  await page.getByText("Commercial invoice is missing").click();
  await uploadOnDocuments(page, "Commercial invoice", "invoice.pdf");
  await uploadOnDocuments(page, "Carrier notice or protest letter", "notice.pdf");
  await page.getByRole("button", { name: "Settle" }).click();
  await expect(page.getByText("Awash Bank").first()).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Send to Finance" }).click();
  await expect(page.getByText(/Waiting for Finance to pay PV-/)).toBeVisible();

  // Finance pays the request with the bank reference; the claim then shows Paid (recovery open)
  const claimUrl = page.url();
  await actAs(page, "FINANCE");
  await page.goto("/marine/finance/claim-payments");
  await page.getByRole("button", { name: "Pay", exact: true }).click();
  await page.getByPlaceholder("Transfer or transaction ID").fill("TT-2026-118");
  await page.getByRole("dialog").getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Paid", { exact: true }).first()).toBeVisible();
  await actAs(page, "CLAIMS_MANAGER");
  await page.goto(claimUrl);
  await expect(page.getByText("Recovery", { exact: true }).first()).toBeVisible();

  // Close waits for the recovery to be resolved
  await expect(page.getByRole("button", { name: "Close", exact: true })).toBeDisabled();
  await page.getByRole("tab", { name: "Recovery" }).click();
  await page.getByLabel("Amount recovered").fill("4000");
  await page.getByLabel("Status").selectOption("PARTLY_RECOVERED");
  await page.getByRole("button", { name: "Save recovery" }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Close claim" }).click();
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  await expectAccessible(page);
});
