import { db } from "@/shared/lib/db";

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  cityId?: string;
  avatar?: string;
}

export const userService = {
  /**
   * Find user by ID
   */
  async getById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        city: true,
        providerProfile: true,
      },
    });
  },

  /**
   * Find user by Telegram ID
   */
  async getByTelegramId(telegramId: bigint) {
    return db.user.findUnique({
      where: { telegramId },
      include: {
        providerProfile: true,
      },
    });
  },

  /**
   * Update user profile
   */
  async update(id: string, data: UpdateUserInput) {
    return db.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Ban/Unban user
   */
  async setBanStatus(id: string, isBanned: boolean) {
    return db.user.update({
      where: { id },
      data: { isBanned },
    });
  }
};
