import { db } from "./db";
import type { Prisma } from "@prisma/client";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "BAN"
  | "LOGIN";

interface LogParams {
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  metadata,
}: LogParams) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata,
      },
    });
  } catch (error) {
    console.error("[logAudit] FAILED:", error);
  }
}
