import { Prisma } from "@/generated/client/client";
import type { TransactionClient } from "@/lib/db";

export interface AuditInput {
  houseId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  detail?: Record<string, unknown>;
}

export async function recordAudit(tx: TransactionClient, input: AuditInput): Promise<void> {
  await tx.auditEvent.create({
    data: {
      houseId: input.houseId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      detail: input.detail ? (input.detail as Prisma.InputJsonValue) : undefined,
    },
  });
}
