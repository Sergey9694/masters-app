SELECT id, email, "telegramId"::text, "authProvider" FROM "User" WHERE email = 'admin@test.com' OR "telegramId" IS NOT NULL;
