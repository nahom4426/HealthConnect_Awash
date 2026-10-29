// WT4: amend, then cancel a certificate (plan section 10, FE-25, FE-26).
import { expect, test } from "@playwright/test";
import { expectAccessible, issueCertificate, mock, signIn } from "./helpers";

test("amending issues version 2 and supersedes the old QR; cancelling shows Cancelled", async ({ page }) => {
  await signIn(page, ["UNDERWRITER"]);
  await page.goto("/marine/certificates");
  const bound = await issueCertificate(page);
  const v1 = await mock(page, "get", `/certificates/${bound.certificate.id}`);

  await page.goto(`/marine/certificates/${v1.id}`);
  await page.getByRole("link", { name: "Amend" }).click();
  await expect(page.getByLabel("Invoice value")).toHaveValue("100,000.00");
  await page.getByLabel("Invoice value").fill("120000");
  await page.getByLabel("Invoice value").blur();
  await expect(page.getByText("Sum insured USD 115,500.00 → USD 137,500.00")).toBeVisible();
  await page.getByLabel("Reason for amendment").fill("Final commercial invoice received from the seller");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Issue version 2" }).click();
  await expect(page.getByRole("heading", { name: new RegExp(`${v1.certNo} · v2`) })).toBeVisible();

  await page.goto(`/verify/${v1.token}`);
  await expect(page.getByText("Superseded by a newer version")).toBeVisible();

  // Cancel the new version
  const v2 = (await mock(page, "get", `/certificates?q=${v1.certNo}`)).content.find((c: any) => c.version === 2);
  await page.goto(`/marine/certificates/${v2.id}`);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByLabel("Reason").selectOption("SHIPMENT_CANCELLED");
  await page.getByLabel("Note").fill("Buyer cancelled the order");
  await page.getByRole("button", { name: "Cancel certificate" }).click();
  await expect(page.getByText("Cancelled", { exact: true }).first()).toBeVisible();
  await page.goto(`/verify/${v2.token}`);
  await expect(page.getByText("This certificate was cancelled and gives no cover.")).toBeVisible();
});
