import { db } from "@/shared/lib/db";
import { createEmailToken, verifyEmailToken, sendEmail } from "@/shared/lib/email";
import { logAudit } from "@/shared/lib/audit";

export interface RegisterInput {
  email: string;
  password?: string;
  firstName: string;
  lastName?: string;
  authProvider?: "EMAIL" | "TELEGRAM" | "GOOGLE";
}

export const authService = {
  /**
   * Register a new user via Email
   */
  async register(data: RegisterInput) {
    const existing = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existing) {
      throw new Error("Пользователь с таким email уже существует");
    }

    let passwordHash: string | undefined;
    if (data.password) {
      const bcrypt = await import("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(data.password, salt);
    }

    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName || "",
        authProvider: data.authProvider || "EMAIL",
        emailVerified: null,
      },
    });

    // Send verification email if it's Email provider
    if (data.authProvider === "EMAIL" || !data.authProvider) {
      const token = await createEmailToken({ email: data.email, type: "verify" });
      const verifyLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify?token=${token}`;

      await sendEmail({
        to: data.email,
        subject: "Подтвердите ваш email — УслугиРядом",
        html: `<p>Здравствуйте, ${data.firstName}!</p><p>Для завершения регистрации подтвердите ваш email, перейдя по ссылке:</p><a href="${verifyLink}">${verifyLink}</a>`,
      });
    }

    return user;
  },

  /**
   * Verify email via token
   */
  async verifyEmail(token: string) {
    const payload = await verifyEmailToken(token);
    if (!payload || payload.type !== "verify") {
      throw new Error("Неверный или просроченный токен");
    }

    return db.user.update({
      where: { email: payload.email },
      data: { emailVerified: new Date() },
    });
  },

  /**
   * Request password reset link
   */
  async requestPasswordReset(email: string) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, firstName: true }
    });

    if (user) {
      const token = await createEmailToken({ email, type: "reset" });
      const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "User",
        entityId: user.id,
        metadata: { info: "Password reset requested" },
      });

      await sendEmail({
        to: email,
        subject: "Восстановление пароля — УслугиРядом",
        html: `<p>Вы запросили сброс пароля. Перейдите по ссылке для установки нового:</p><a href="${resetLink}">${resetLink}</a>`,
      });
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string) {
    const payload = await verifyEmailToken(token);
    if (!payload || payload.type !== "reset") {
      throw new Error("Неверный или просроченный токен");
    }

    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return db.user.update({
      where: { email: payload.email },
      data: { passwordHash },
    });
  }
};
