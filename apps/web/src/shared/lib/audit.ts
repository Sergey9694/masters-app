import { headers } from "next/headers";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "BAN"
  | "LOGIN"
  | "ADMIN_LOGIN"
  | "DELETE_USER"
  | "UPDATE_USER_ROLE"
  | "VERIFY_PROVIDER"
  | "REJECT_PROVIDER"
  | "BLOCK_USER"
  | "UNBLOCK_USER"
  | "CREATE_REPORT"
  | "RESOLVE_REPORT";

interface LogParams {
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Записывает действие в журнал аудита
 */
export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  metadata,
}: LogParams) {
  try {
    let ipAddress: string | null = null;
    try {
      const headerList = await headers();
      ipAddress = headerList.get("x-forwarded-for")?.split(",")[0] || null;
    } catch {
      // headers() might fail outside of request context
    }

    await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata || {},
        ipAddress,
      },
    });
  } catch (error) {
    console.error("[logAudit] FAILED:", error);
  }
}
