import { expect, test } from "@playwright/test";

test.describe("Listing flow protection", () => {
  test("redirects unauthenticated users from listing creation page", async ({ page }) => {
    await page.goto("/my-listings/new");
    await expect(page).toHaveURL(/auth\/login/);
  });

  test("rejects unauthenticated listing creation", async ({ request }) => {
    const response = await request.post("/api/v1/listings", {
      data: {
        categoryId: "category-1",
        cityId: "city-1",
        title: "Уборка квартиры",
        description: "Быстро и аккуратно",
      },
    });

    expect(response.status()).toBe(401);
  });
});
