import { db } from "./db";

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
  metadata?: any;
}

/**
 * Записывает системное действие в лог аудита.
 */
export async function logAudit({ 
  userId, 
  action, 
  entity, 
  entityId, 
  metadata 
}: LogParams) {
  try {
    // @ts-ignore
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error("[logAudit] FAILED:", error);
    // Не падаем, если логгирование не сработало (чтобы не блокировать основное действие)
  }
}
