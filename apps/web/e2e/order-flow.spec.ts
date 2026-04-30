import { expect, test } from "@playwright/test";

test.describe("Order flow protection", () => {
  test("redirects unauthenticated users from order creation page", async ({ page }) => {
    await page.goto("/orders/new");
    await expect(page).toHaveURL(/auth\/login/);
  });

  test("rejects unauthenticated order mutations", async ({ request }) => {
    const createOrderResponse = await request.post("/api/v1/orders", {
      data: {
        categoryId: "category-1",
        cityId: "city-1",
        title: "Ремонт",
        description: "Нужно починить",
      },
    });
    expect(createOrderResponse.status()).toBe(401);

    const proposalResponse = await request.post("/api/v1/orders/order-1/proposals", {
      data: { price: 1000, message: "Готов помочь" },
    });
    expect(proposalResponse.status()).toBe(401);
  });
});
