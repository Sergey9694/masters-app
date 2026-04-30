import { test, expect } from "@playwright/test";

test.describe("Trust/Safety — Admin reports", () => {
  test("redirects unauthenticated users away from /admin/reports", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page).toHaveURL(/admin\/login|auth\/login/);
  });
});
