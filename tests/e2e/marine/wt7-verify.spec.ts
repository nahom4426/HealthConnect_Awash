// WT7: a bank or customs officer verifies a certificate by QR, on a phone (plan section 10, FE-19).
import { expect, test } from "@playwright/test";
import { expectAccessible, issueCertificate, mock, signIn } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("the public check shows Valid, then not found for a random token", async ({ page }) => {
  await signIn(page);
  await page.goto("/marine/quotes");
  const bound = await issueCertificate(page);
  const cert = await mock(page, "get", `/certificates/${bound.certificate.id}`);

  // The officer has no session
  await page.evaluate(() => localStorage.removeItem("userDetail"));
  await page.goto(`/verify/${cert.token}`);
  // The first visit compiles the page on the dev server, so allow it longer
  await expect(page.getByText(cert.certNo, { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Valid|still being issued/)).toBeVisible();
  await expect(page.getByText(/premium/i)).toHaveCount(0);
  await expectAccessible(page);

  await page.goto("/verify/not-a-real-token");
  await expect(page.getByText("We couldn't verify this certificate.")).toBeVisible();
});
