// WT6: act on a deadline alert (plan section 10, FE-43, FE-45).
import { expect, test } from "@playwright/test";
import { daysFromToday, issueCertificate, mock, signIn } from "./helpers";

test("an overdue deadline shows in the bell; marking it met needs a note and clears it", async ({ page }) => {
  await signIn(page, ["CLAIMS_HANDLER"]);
  await page.goto("/marine/claims");
  const bound = await issueCertificate(page, { sailingDate: daysFromToday(-20) });
  const claim = await mock(page, "post", "/claims", {
    certificateId: bound.certificate.id, lossDate: daysFromToday(-15), notifiedDate: daysFromToday(-14), deliveryDate: daysFromToday(-14),
    type: "PARTICULAR_AVERAGE", cause: "BREAKAGE", description: "Crates broken", estimatedAmount: "3000.00", payeeId: "1",
  });

  await page.goto("/marine/dashboard");
  const bell = page.getByRole("button", { name: /Alerts: \d+ items? need/ });
  await expect(bell).toHaveAccessibleName(/Alerts: 2 items need you/);
  await bell.click();
  await page.getByRole("link", { name: new RegExp(`${claim.claimNo}.*Carrier notice`) }).click();
  await expect(page).toHaveURL(new RegExp(`/marine/claims/${claim.id}\\?tab=deadlines`));

  const row = page.locator("tr", { hasText: "Carrier notice" });
  await expect(row.getByText(/overdue/)).toBeVisible();
  await row.getByRole("button", { name: "Mark met" }).click();
  await page.getByRole("button", { name: "Mark met" }).last().click();
  await expect(page.getByText("Note is required")).toBeVisible();
  await page.getByRole("alertdialog").locator("textarea").fill("Notice faxed to the carrier's agent on arrival");
  await page.getByRole("button", { name: "Mark met" }).last().click();
  await expect(row.getByText("Met", { exact: true })).toBeVisible();

  await page.goto("/marine/dashboard");
  await expect(page.getByRole("button", { name: /Alerts:/ })).toHaveAccessibleName(/Alerts: 1 item needs you/);
});
