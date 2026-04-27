import { db } from "@/shared/lib/db";
import { encryptText, decryptText } from "@/shared/lib/crypto";

export interface MessageDTO {
  id: string;
  text: string;
  attachments: string[];
  senderId: string;
  sender: { id: string; firstName: string; avatar: string | null };
  createdAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface ConversationPreview {
  id: string;
  orderId: string | null;
  listingId: string | null;
  lastMessage: MessageDTO | null;
  unreadCount: number;
  otherUser: { id: string; firstName: string; avatar: string | null };
  updatedAt: Date;
}

function mapMessage(m: {
  id: string;
  text: string;
  attachments: string[];
  senderId: string;
  sender: { id: string; firstName: string; avatar: string | null };
  createdAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
}): MessageDTO {
  return {
    ...m,
    text: m.deletedAt ? "[сообщение удалено]" : decryptText(m.text),
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
            participants: { include: { user: { select: { id: true, firstName: true, avatar: true } } } },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: { id: true, firstName: true, avatar: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return participations.map(({ conversation, lastReadAt }: {
      conversation: {
        id: string;
        orderId: string | null;
        listingId: string | null;
        updatedAt: Date;
        participants: Array<{ userId: string; user: { id: string; firstName: string; avatar: string | null } }>;
        messages: Array<{
          id: string;
          text: string;
          attachments: string[];
          senderId: string;
          sender: { id: string; firstName: string; avatar: string | null };
          createdAt: Date;
        }>;
      };
      lastReadAt: Date | null;
    }) => {
      const other = conversation.participants.find((p) => p.userId !== userId)!.user;
      const last = conversation.messages[0] ?? null;
      const unread = last && (!lastReadAt || lastReadAt < last.createdAt) ? 1 : 0;
      return {
        id: conversation.id,
        orderId: conversation.orderId,
        listingId: conversation.listingId,
        lastMessage: last ? mapMessage({ ...last, deletedAt: null, deletedBy: null }) : null,
        unreadCount: unread,
        otherUser: other,
        updatedAt: conversation.updatedAt,
      };
    });
  },

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 30
  ): Promise<MessageDTO[]> {
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
      include: { sender: { select: { id: true, firstName: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse().map((m: {
      id: string;
      text: string;
      attachments: string[];
      senderId: string;
      sender: { id: string; firstName: string; avatar: string | null };
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
      include: { sender: { select: { id: true, firstName: true, avatar: true } } },
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
          participants: { include: { user: { select: { id: true, firstName: true, email: true, avatar: true } } } },
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
      include: { sender: { select: { id: true, firstName: true, avatar: true } } },
      orderBy: { createdAt: "asc" },
    });
    return messages.map((m: {
      id: string;
      text: string;
      attachments: string[];
      senderId: string;
      sender: { id: string; firstName: string; avatar: string | null };
      createdAt: Date;
      deletedAt: Date | null;
      deletedBy: string | null;
    }) => mapMessage(m));
  },

  async deleteMessage(messageId: string, adminId: string): Promise<void> {
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
    const participations = await db.conversationParticipant.findMany({
      where: { userId },
      select: {
        lastReadAt: true,
        conversation: {
          select: {
            messages: {
              where: { deletedAt: null, senderId: { not: userId } },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
    });

    let count = 0;
    for (const p of participations) {
      const lastMsg = p.conversation.messages[0];
      if (!lastMsg) continue;
      if (!p.lastReadAt || p.lastReadAt < lastMsg.createdAt) count++;
    }
    return count;
  },

  async exportConversation(conversationId: string, format: "json" | "csv"): Promise<Buffer> {
    const messages = await this.getMessagesAdmin(conversationId);
    if (format === "json") {
      return Buffer.from(JSON.stringify(messages, null, 2), "utf8");
    }
    const header = "id,sender,text,sentAt,deletedAt\n";
    const rows = messages.map((m) =>
      [m.id, m.sender.firstName, m.text, m.createdAt.toISOString(), m.deletedAt?.toISOString() ?? ""]
        .map((field) => `"${String(field).replace(/\r?\n/g, " ").replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    return Buffer.from(header + rows, "utf8");
  },
};
