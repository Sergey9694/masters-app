import { test, expect } from "@playwright/test";

/**
 * E2E тесты модуля чата.
 *
 * Тесты разделены на две группы:
 *  1. UI-тесты страницы /chat (с мокированием API через page.route)
 *  2. REST API тесты (проверка 401 без аутентификации — не требуют БД)
 */

test.describe("Chat page — UI", () => {
  /**
   * Неаутентифицированный пользователь должен быть перенаправлен на страницу входа.
   * proxy.ts защищает маршрут /chat — редирект происходит на сервере.
   */
  test("redirects unauthenticated users to /auth/login", async ({ page }) => {
    await page.goto("/chat");
    await expect(page).toHaveURL(/auth\/login/);
  });

  /**
   * Страница /chat без cookies может перенаправить на логин либо показать UI.
   * Мокируем API ответ с пустым списком диалогов.
   * Тест принимает оба варианта — ключевое условие: нет необработанных серверных ошибок.
   */
  test("shows empty state or redirects when no conversations", async ({
    page,
  }) => {
    // Мок для API диалогов — пустой список
    await page.route("**/api/v1/conversations**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto("/chat");

    const currentPath = new URL(page.url()).pathname;

    // Допустимо: либо мы на /chat (аутентифицированы), либо редирект на логин
    expect(["/chat", "/auth/login"]).toContain(currentPath);

    // Не должно быть 500-ошибки Next.js
    const errorHeading = page.getByRole("heading", { name: /500|server error/i });
    await expect(errorHeading).not.toBeVisible();
  });
});

test.describe("REST API — Conversations", () => {
  /**
   * GET /api/v1/conversations без cookie аутентификации
   * должен вернуть 401 Unauthorized.
   */
  test("GET /api/v1/conversations returns 401 without auth", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/conversations");
    expect(response.status()).toBe(401);
  });

  /**
   * GET /api/v1/conversations/:id/messages без аутентификации → 401.
   */
  test("GET /api/v1/conversations/:id/messages returns 401 without auth", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/v1/conversations/nonexistent-id/messages"
    );
    expect(response.status()).toBe(401);
  });

  /**
   * POST /api/v1/conversations/:id/messages без аутентификации → 401.
   */
  test("POST /api/v1/conversations/:id/messages returns 401 without auth", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/v1/conversations/nonexistent-id/messages",
      {
        data: { text: "Hello" },
      }
    );
    expect(response.status()).toBe(401);
  });

  /**
   * POST с пустым телом без аутентификации → всё равно 401
   * (аутентификация проверяется до валидации тела).
   */
  test("POST /api/v1/conversations/:id/messages with empty text returns 401 without auth", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/v1/conversations/nonexistent-id/messages",
      {
        data: { text: "" },
      }
    );
    expect(response.status()).toBe(401);
  });
});
