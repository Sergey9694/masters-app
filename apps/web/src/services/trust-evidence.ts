import { createHash } from "node:crypto";
import type { Prisma, ReportReason, ReportTargetType } from "@prisma/client";
import { db } from "@/shared/lib/db";

export interface CreateReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  targetUserId?: string;
  conversationId?: string;
  messageId?: string;
  orderId?: string;
}

function hashEncryptedText(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

async function buildChatEvidence(conversationId: string, reportedMessageId?: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, orderId: true, listingId: true },
  });
  if (!conversation) throw new Error("Диалог не найден");

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      senderId: true,
      createdAt: true,
      text: true,
      attachments: true,
      deletedAt: true,
    },
  });

  return {
    version: 1,
    conversationId: conversation.id,
    reportedMessageId: reportedMessageId ?? null,
    messages: messages.reverse().map((message) => ({
      id: message.id,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      encryptedText: message.text,
      textHash: hashEncryptedText(message.text),
      attachments: message.attachments,
      deletedAt: message.deletedAt?.toISOString() ?? null,
    })),
    context: {
      orderId: conversation.orderId,
      listingId: conversation.listingId,
    },
  } satisfies Prisma.InputJsonValue;
}

export async function resolveReportContext(input: CreateReportInput) {
  if (input.targetUserId === input.reporterId || input.targetId === input.reporterId) {
    throw new Error("Нельзя пожаловаться на самого себя");
  }

  if (input.targetType === "MESSAGE") {
    const message = await db.message.findUnique({
      where: { id: input.targetId },
      select: {
        id: true,
        senderId: true,
        conversationId: true,
        conversation: { select: { participants: { select: { userId: true } } } },
      },
    });
    if (!message) throw new Error("Сообщение не найдено");
    const hasAccess = message.conversation.participants.some((p) => p.userId === input.reporterId);
    if (!hasAccess) throw new Error("Нет доступа к сообщению");
    if (message.senderId === input.reporterId) throw new Error("Нельзя пожаловаться на свое сообщение");
    return {
      targetUserId: message.senderId,
      conversationId: message.conversationId,
      messageId: message.id,
      orderId: input.orderId,
      evidence: await buildChatEvidence(message.conversationId, message.id),
    };
  }

  if (input.targetType === "CONVERSATION") {
    const conversation = await db.conversation.findUnique({
      where: { id: input.targetId },
      select: { id: true, orderId: true, participants: { select: { userId: true } } },
    });
    if (!conversation) throw new Error("Диалог не найден");
    const hasAccess = conversation.participants.some((p) => p.userId === input.reporterId);
    if (!hasAccess) throw new Error("Нет доступа к диалогу");
    const other = conversation.participants.find((p) => p.userId !== input.reporterId);
    return {
      targetUserId: other?.userId,
      conversationId: conversation.id,
      orderId: conversation.orderId,
      evidence: await buildChatEvidence(conversation.id),
    };
  }

  if (input.targetType === "USER") {
    const user = await db.user.findUnique({ where: { id: input.targetId }, select: { id: true } });
    if (!user) throw new Error("Пользователь не найден");
    return {
      targetUserId: user.id,
      conversationId: input.conversationId,
      messageId: input.messageId,
      orderId: input.orderId,
    };
  }

  return {
    targetUserId: input.targetUserId,
    conversationId: input.conversationId,
    messageId: input.messageId,
    orderId: input.orderId,
  };
}
