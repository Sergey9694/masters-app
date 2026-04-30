import { z } from "zod";

export const reportTargetTypeSchema = z.enum([
  "USER",
  "MESSAGE",
  "CONVERSATION",
  "ORDER",
  "LISTING",
  "REVIEW",
  "PROVIDER",
]);

export const reportReasonSchema = z.enum([
  "SPAM",
  "HARASSMENT",
  "FRAUD",
  "INAPPROPRIATE_CONTENT",
  "CONTACT_EXCHANGE",
  "SAFETY_THREAT",
  "OTHER",
]);

export const blockUserSchema = z.object({
  blockedId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  reason: z.string().trim().max(500).optional(),
});

export const reportTargetSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: z.string().trim().min(1).max(128),
  reason: reportReasonSchema,
  description: z.string().trim().max(1000).optional(),
  targetUserId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  orderId: z.string().trim().max(128).optional(),
});

export const resolveReportSchema = z.object({
  reportId: z.string().cuid(),
  status: z.enum(["REVIEWED", "ACTIONED", "DISMISSED"]),
  adminNotes: z.string().trim().max(2000).optional(),
  actionTaken: z.string().trim().max(1000).optional(),
});
