// WT2: decide a referral (plan section 10, FE-22 to FE-24).
import { expect, test } from "@playwright/test";
import { actAs, expectAccessible, mock, signIn, SHIPMENT, today } from "./helpers";

test("sanctions block approval; a senior underwriter approves above authority; the owner binds", async ({ page }) => {
  await signIn(page, ["UNDERWRITER"]);
  await page.goto("/marine/underwriting");
  // A quote with a possible sanctions match on the consignee, and a high-value one
  const flagged = await mock(page, "post", "/quotes", { ...SHIPMENT, sailingDate: today(), consigneeId: "12" });
  await mock(page, "post", `/quotes/${flagged.id}/rate`);
  const big = await mock(page, "post", "/quotes", { ...SHIPMENT, sailingDate: today(), invoiceValue: "400000.00" });
  await mock(page, "post", `/quotes/${big.id}/rate`);
  await page.reload();

  // Assign to me moves the row into My referrals
  const row = page.getByRole("row", { name: new RegExp(flagged.quoteNo) });
  await row.getByRole("button", { name: "Assign to me" }).click();
  await expect(page.getByText(`${flagged.quoteNo} assigned to you`)).toBeVisible();
  await page.goto("/marine/underwriting?assignee=me");
  await expect(page.getByRole("row", { name: new RegExp(flagged.quoteNo) })).toBeVisible();
  await expectAccessible(page);

  // Potential match blocks Approve until reviewed
  await page.getByRole("link", { name: flagged.quoteNo }).click();
  await expect(page.getByRole("button", { name: "Approve" })).toBeDisabled();
  await page.getByRole("button", { name: "Review" }).click();
  await page.getByText("Confirm match").click();
  await page.getByPlaceholder("Why this is or isn't the listed party").fill("Same entity as the UN listing UN-SO-0412");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByText("Sanctions match confirmed. This quote can't be bound.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expectAccessible(page);

  // High value: an underwriter can only send it up; a senior underwriter approves
  await page.goto("/marine/underwriting");
  await page.getByRole("link", { name: big.quoteNo }).click();
  await expect(page.getByRole("button", { name: "Send to senior underwriter" })).toBeVisible();
  await page.getByRole("button", { name: "Decline" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("A note of at least 10 characters is required to decline")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await actAs(page, "SENIOR_UNDERWRITER");
  await page.reload();
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByPlaceholder("Shown to the quote owner on the quote").fill("Known shipper, approved at tariff");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page).toHaveURL(/\/marine\/underwriting$/);

  // The owner sees Approved and binds
  await page.goto(`/marine/quotes/${big.id}`);
  await expect(page.getByText("Approved by underwriting")).toBeVisible();
  await page.getByRole("button", { name: "Bind", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Bind" }).click();
  await expect(page).toHaveURL(/\/marine\/policies\/\d+/);
});
