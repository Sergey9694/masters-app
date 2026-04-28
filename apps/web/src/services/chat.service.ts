import { db } from "@/shared/lib/db";
import { encryptText, decryptText } from "@/shared/lib/crypto";
import { MessageDTO, ConversationPreview } from "@uslugi/shared-types";
import { isUserOnline } from "@/shared/lib/redis";

// Internal Prisma-mapped types with Date objects
interface InternalMessage {
  id: string;
  text: string;
  attachments: string[];
  senderId: string;
  sender: { id: string; firstName: string; lastName?: string | null; avatar: string | null };
  createdAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
}

function mapMessage(m: InternalMessage): MessageDTO {
  return {
    ...m,
    text: m.deletedAt ? "[сообщение удалено]" : decryptText(m.text),
    createdAt: m.createdAt.toISOString(),
    deletedAt: m.deletedAt?.toISOString() ?? null,
  };
}

export const chatService = {
  async startConversation(
    userId: string,
    targetUserId: string,
    context: { orderId?: string; listingId?: string }
  ) {
    const existing = await db.conversation.findFirst({
      where: {
        ...(context.orderId ? { orderId: context.orderId } : {}),
        ...(context.listingId ? { listingId: context.listingId } : {}),
        participants: {
          every: { userId: { in: [userId, targetUserId] } },
        },
      },
    });
    if (existing) return existing;

    return db.conversation.create({
      data: {
        orderId: context.orderId,
        listingId: context.listingId,
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
    });
  },

  async getConversations(userId: string): Promise<ConversationPreview[]> {
    const participations = await db.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, lastSeenAt: true } } } },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
      take: 50, // H2: Limit conversations
    });

    const results = await Promise.all(participations.map(async ({ conversation, lastReadAt }) => {
      const other = conversation.participants.find((p) => p.userId !== userId)!.user;
      const last = conversation.messages[0] ?? null;
      const unread = last && (!lastReadAt || lastReadAt < last.createdAt) ? 1 : 0;
      const isOnline = await isUserOnline(other.id);

      return {
        id: conversation.id,
        orderId: conversation.orderId,
        listingId: conversation.listingId,
        lastMessage: last ? mapMessage({ ...last, deletedAt: null, deletedBy: null }) : null,
        unreadCount: unread,
        otherUser: {
          ...other,
          lastSeenAt: other.lastSeenAt?.toISOString() ?? null,
          isOnline,
        },
        updatedAt: conversation.updatedAt.toISOString(),
      };
    }));

    return results;
  },

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 30
  ): Promise<MessageDTO[]> {
    const user = await db.user.findUnique({ where: { id: userId }, select: { chatBlockedAt: true } });
    if (user?.chatBlockedAt) throw new Error("Нет доступа к диалогу (аккаунт заблокирован)");

    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) throw new Error("Нет доступа к диалогу");

    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorMsg = await db.message.findUnique({ where: { id: cursor }, select: { createdAt: true } });
      if (!cursorMsg) throw new Error("Сообщение-курсор не найдено");
      cursorDate = cursorMsg.createdAt;
    }

    const messages = await db.message.findMany({
      where: {
        conversationId,
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse().map((m: {
      id: string;
      text: string;
      attachments: string[];
      senderId: string;
      sender: { id: string; firstName: string; lastName: string | null; avatar: string | null };
      createdAt: Date;
      deletedAt: Date | null;
      deletedBy: string | null;
    }) => mapMessage(m));
  },

  async sendMessage(
    conversationId: string,
    userId: string,
    text: string,
    attachments: string[] = []
  ): Promise<MessageDTO> {
    const user = await db.user.findUnique({ where: { id: userId }, select: { chatBlockedAt: true } });
    if (user?.chatBlockedAt) throw new Error("Ваши сообщения заблокированы администратором");

    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) throw new Error("Нет доступа к диалогу");

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        text: encryptText(text),
        attachments,
      },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });

    await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    return mapMessage({ ...message, deletedAt: null, deletedBy: null });
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  },
  
  async getConversationParticipants(conversationId: string) {
    return db.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
  },

  async getAllConversations(
    filters: { userId?: string; dateFrom?: Date; dateTo?: Date },
    page: number,
    pageSize = 20
  ) {
    const where = {
      ...(filters.userId ? { participants: { some: { userId: filters.userId } } } : {}),
      ...(filters.dateFrom || filters.dateTo ? {
        createdAt: {
          ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
          ...(filters.dateTo ? { lte: filters.dateTo } : {}),
        },
      } : {}),
    };
    const [data, total] = await db.$transaction([
      db.conversation.findMany({
        where,
        include: {
          participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.conversation.count({ where }),
    ]);
    return { data, total };
  },

  async getMessagesAdmin(conversationId: string): Promise<MessageDTO[]> {
    const messages = await db.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 200, // H3: Admin messages limit
    });
    return messages.reverse().map((m: {
      id: string;
      text: string;
      attachments: string[];
      senderId: string;
      sender: { id: string; firstName: string; lastName: string | null; avatar: string | null };
      createdAt: Date;
      deletedAt: Date | null;
      deletedBy: string | null;
    }) => mapMessage(m));
  },

  async deleteMessage(messageId: string, adminId: string): Promise<void> {
    const admin = await db.user.findUnique({ where: { id: adminId }, select: { role: true } });
    if (admin?.role !== "ADMIN") throw new Error("Только администратор может удалять сообщения");

    const message = await db.message.findUnique({ where: { id: messageId } });
    if (!message) throw new Error("Сообщение не найдено");
    
    await db.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), deletedBy: adminId },
    });
  },

  async blockUserChat(userId: string): Promise<void> {
    await db.user.update({ where: { id: userId }, data: { chatBlockedAt: new Date() } });
  },

  async unblockUserChat(userId: string): Promise<void> {
    await db.user.update({ where: { id: userId }, data: { chatBlockedAt: null } });
  },

  async getUnreadCount(userId: string): Promise<number> {
    // H4: Optimized count of unread messages across all conversations
    const participations = await db.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    if (participations.length === 0) return 0;

    const unreadPromises = participations.map((p) =>
      db.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          deletedAt: null,
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      })
    );

    const counts = await Promise.all(unreadPromises);
    return counts.reduce((sum, c) => sum + c, 0);
  },

  async exportConversation(conversationId: string, format: "json" | "csv"): Promise<Buffer> {
    const messages = await this.getMessagesAdmin(conversationId);
    if (format === "json") {
      return Buffer.from(JSON.stringify(messages, null, 2), "utf8");
    }
    const header = "id,sender,text,sentAt,deletedAt\n";
    const rows = messages.map((m) =>
      [m.id, m.sender.firstName, m.text, m.createdAt, m.deletedAt ?? ""]
        .map((field) => `"${String(field).replace(/\r?\n/g, " ").replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    return Buffer.from(header + rows, "utf8");
  },
};
