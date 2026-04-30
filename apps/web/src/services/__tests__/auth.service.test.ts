import { beforeEach, describe, expect, it, vi } from "vitest";

const createEmailToken = vi.fn();
const verifyEmailToken = vi.fn();
const sendEmail = vi.fn();
const logAudit = vi.fn();
const genSalt = vi.fn();
const hash = vi.fn();
const compare = vi.fn();

const mockDb = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/shared/lib/db", () => ({ db: mockDb }));
vi.mock("@/shared/lib/email", () => ({
  createEmailToken,
  verifyEmailToken,
  sendEmail,
}));
vi.mock("@/shared/lib/audit", () => ({ logAudit }));
vi.mock("bcryptjs", () => ({ genSalt, hash, compare }));

const { authService } = await import("../auth.service");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  genSalt.mockResolvedValue("salt");
  hash.mockResolvedValue("password-hash");
  compare.mockResolvedValue(true);
});

describe("authService.register", () => {
  it("rejects duplicate email", async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: "existing-user" });

    await expect(
      authService.register({
        email: "ivan@example.com",
        password: "secret123",
        firstName: "Иван",
      }),
    ).rejects.toThrow("уже существует");
    expect(mockDb.user.create).not.toHaveBeenCalled();
  });

  it("hashes password, creates user and sends verification email", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue({ id: "user-1", email: "ivan@example.com" });
    createEmailToken.mockResolvedValue("verify-token");
    sendEmail.mockResolvedValue(undefined);

    const user = await authService.register({
      email: "ivan@example.com",
      password: "secret123",
      firstName: "Иван",
    });

    expect(hash).toHaveBeenCalledWith("secret123", "salt");
    expect(mockDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "ivan@example.com",
        passwordHash: "password-hash",
        firstName: "Иван",
        authProvider: "EMAIL",
      }),
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ivan@example.com",
        html: expect.stringContaining("verify-token"),
      }),
    );
    expect(user.id).toBe("user-1");
  });
});

describe("authService.validateCredentials", () => {
  it("returns null for invalid password", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ivan@example.com",
      firstName: "Иван",
      role: "USER",
      passwordHash: "stored-hash",
      emailVerified: new Date(),
    });
    compare.mockResolvedValue(false);

    await expect(authService.validateCredentials("ivan@example.com", "bad")).resolves.toBeNull();
  });

  it("rejects unverified email", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ivan@example.com",
      firstName: "Иван",
      role: "USER",
      passwordHash: "stored-hash",
      emailVerified: null,
    });

    await expect(
      authService.validateCredentials("ivan@example.com", "secret123"),
    ).rejects.toThrow("Email не подтвержден");
  });

  it("returns safe user payload for valid credentials", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ivan@example.com",
      firstName: "Иван",
      role: "USER",
      passwordHash: "stored-hash",
      emailVerified: new Date(),
    });

    await expect(
      authService.validateCredentials("ivan@example.com", "secret123"),
    ).resolves.toEqual({
      id: "user-1",
      name: "Иван",
      email: "ivan@example.com",
      role: "USER",
    });
  });
});

describe("authService.passwordReset", () => {
  it("logs audit event and sends reset link", async () => {
    const email = "reset-1@example.com";
    mockDb.user.findUnique.mockResolvedValue({ id: "user-1", firstName: "Иван" });
    createEmailToken.mockResolvedValue("reset-token");
    logAudit.mockResolvedValue(undefined);
    sendEmail.mockResolvedValue(undefined);

    await authService.requestPasswordReset(email);

    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "UPDATE",
        entity: "User",
      }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: email,
        html: expect.stringContaining("reset-token"),
      }),
    );
  });

  it("resets password with a valid reset token", async () => {
    verifyEmailToken.mockResolvedValue({ email: "ivan@example.com", type: "reset" });
    mockDb.user.update.mockResolvedValue({ id: "user-1" });

    const user = await authService.resetPassword("token", "new-password");

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { email: "ivan@example.com" },
      data: { passwordHash: "password-hash" },
    });
    expect(user.id).toBe("user-1");
  });
});
