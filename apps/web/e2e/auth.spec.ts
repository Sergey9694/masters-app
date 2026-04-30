import { expect, test } from "@playwright/test";

test.describe("Auth", () => {
  test("renders login and register pages", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: "С возвращением" })).toBeVisible();

    await page.goto("/auth/register");
    await expect(page.getByRole("heading", { name: "Создать аккаунт" })).toBeVisible();
  });

  test("rejects invalid login and registration payloads before DB work", async ({ request }) => {
    const loginResponse = await request.post("/api/v1/auth/login", {
      data: { email: "not-an-email", password: "" },
    });
    expect(loginResponse.status()).toBe(400);

    const registerResponse = await request.post("/api/v1/auth/register", {
      data: { email: "bad", password: "1", name: "" },
    });
    expect(registerResponse.status()).toBe(400);
  });
});
