import type { ReportReason, ReportStatus, ReportTargetType } from "@prisma/client";
import { db } from "@/shared/lib/db";
import { logAudit } from "@/shared/lib/audit";
import { resolveReportContext, type CreateReportInput } from "@/services/trust-evidence";

export interface BlockState {
  blockedByMe: boolean;
  blockedMe: boolean;
  isBlocked: boolean;
}

interface ResolveReportInput {
  status: Exclude<ReportStatus, "PENDING">;
  adminNotes?: string;
  actionTaken?: string;
}

export const trustService = {
  async blockUser(
    blockerId: string,
    blockedId: string,
    options: { conversationId?: string; reason?: string } = {}
  ) {
    if (blockerId === blockedId) throw new Error("Нельзя заблокировать самого себя");

    const block = await db.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {
        conversationId: options.conversationId,
        reason: options.reason,
      },
      create: {
        blockerId,
        blockedId,
        conversationId: options.conversationId,
        reason: options.reason,
      },
    });

    await logAudit({
      userId: blockerId,
      action: "BLOCK_USER",
      entity: "UserBlock",
      entityId: block.id,
      metadata: { blockedId, conversationId: options.conversationId ?? null },
    });

    return block;
  },

  async unblockUser(blockerId: string, blockedId: string) {
    const deleted = await db.userBlock.deleteMany({ where: { blockerId, blockedId } });
    await logAudit({
      userId: blockerId,
      action: "UNBLOCK_USER",
      entity: "UserBlock",
      entityId: blockedId,
      metadata: { blockedId, deleted: deleted.count },
    });
    return deleted.count > 0;
  },

  async getBlockState(userId: string, targetUserId: string): Promise<BlockState> {
    const blocks = await db.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId },
        ],
      },
      select: { blockerId: true },
    });
    const blockedByMe = blocks.some((block) => block.blockerId === userId);
    const blockedMe = blocks.some((block) => block.blockerId === targetUserId);
    return { blockedByMe, blockedMe, isBlocked: blockedByMe || blockedMe };
  },

  async getBlockStatesForTargets(userId: string, targetUserIds: string[]) {
    const uniqueIds = [...new Set(targetUserIds)];
    const blocks = await db.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId, blockedId: { in: uniqueIds } },
          { blockerId: { in: uniqueIds }, blockedId: userId },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });

    return new Map(uniqueIds.map((targetId) => {
      const blockedByMe = blocks.some((block) => block.blockerId === userId && block.blockedId === targetId);
      const blockedMe = blocks.some((block) => block.blockerId === targetId && block.blockedId === userId);
      return [targetId, { blockedByMe, blockedMe, isBlocked: blockedByMe || blockedMe }];
    }));
  },

  async assertCanStartConversation(userId: string, targetUserId: string) {
    const state = await this.getBlockState(userId, targetUserId);
    if (state.blockedByMe) throw new Error("Вы заблокировали этого пользователя");
    if (state.blockedMe) throw new Error("Пользователь ограничил переписку с вами");
  },

  async assertCanMessage(conversationId: string, senderId: string) {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participants: {
          select: { userId: true, user: { select: { chatBlockedAt: true } } },
        },
      },
    });
    const sender = conversation?.participants.find((p) => p.userId === senderId);
    if (!conversation || !sender) throw new Error("Нет доступа к диалогу");
    if (sender.user.chatBlockedAt) throw new Error("Ваши сообщения заблокированы администратором");

    const other = conversation.participants.find((p) => p.userId !== senderId);
    if (!other) throw new Error("В диалоге нет второго участника");

    const state = await this.getBlockState(senderId, other.userId);
    if (state.blockedByMe) throw new Error("Вы заблокировали этого пользователя. Разблокируйте его, чтобы продолжить переписку.");
    if (state.blockedMe) throw new Error("Пользователь ограничил переписку с вами.");
  },

  async createReport(input: CreateReportInput) {
    const context = await resolveReportContext(input);
    const report = await db.report.create({
      data: {
        reporterId: input.reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        targetUserId: context.targetUserId,
        conversationId: context.conversationId,
        messageId: context.messageId,
        orderId: context.orderId,
        reason: input.reason,
        description: input.description,
        evidence: context.evidence,
      },
    });

    await logAudit({
      userId: input.reporterId,
      action: "CREATE_REPORT",
      entity: "Report",
      entityId: report.id,
      metadata: { targetType: input.targetType, targetId: input.targetId },
    });

    return report;
  },

  async resolveReport(reportId: string, adminId: string, decision: ResolveReportInput) {
    const report = await db.report.update({
      where: { id: reportId },
      data: {
        status: decision.status,
        adminNotes: decision.adminNotes,
        actionTaken: decision.actionTaken,
        resolvedAt: new Date(),
        resolvedById: adminId,
      },
    });
    await logAudit({
      userId: adminId,
      action: "RESOLVE_REPORT",
      entity: "Report",
      entityId: report.id,
      metadata: { status: decision.status },
    });
    return report;
  },

  async listReports(filters: { status?: ReportStatus; reason?: ReportReason; targetType?: ReportTargetType }, page = 1, pageSize = 20) {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.reason ? { reason: filters.reason } : {}),
      ...(filters.targetType ? { targetType: filters.targetType } : {}),
    };
    const [data, total] = await db.$transaction([
      db.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          targetUser: { select: { id: true, firstName: true, lastName: true, email: true, chatBlockedAt: true } },
          resolvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.report.count({ where }),
    ]);
    return { data, total };
  },

};
