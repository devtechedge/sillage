import type { Role } from "@/domain/types";
import { AuthorizationError, DomainError } from "@/lib/auth";
import type { TransactionClient } from "@/lib/db";
import { prisma } from "@/lib/db";
import { recordAudit } from "./audit";

export async function actorRole(
  tx: TransactionClient,
  houseId: string,
  userId: string
): Promise<Role> {
  const membership = await tx.membership.findUnique({
    where: { houseId_userId: { houseId, userId } },
  });
  if (!membership) throw new AuthorizationError("You are not a member of this house.");
  return membership.role as Role;
}

export async function requireRole(
  tx: TransactionClient,
  houseId: string,
  userId: string,
  allowed: Role[]
): Promise<Role> {
  const role = await actorRole(tx, houseId, userId);
  if (!allowed.includes(role)) {
    throw new AuthorizationError("Your role does not allow this action.");
  }
  return role;
}

export async function changeRole(input: {
  houseId: string;
  actorId: string;
  membershipId: string;
  role: Role;
}): Promise<void> {
  const result = await prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.actorId, ["OWNER"]);
    const target = await tx.membership.findFirst({
      where: { id: input.membershipId, houseId: input.houseId },
    });
    if (!target) throw new DomainError("That member is not in this house.");
    if (target.role === input.role) return { changed: false };
    if (target.role === "OWNER" && input.role !== "OWNER") {
      const owners = await tx.membership.count({
        where: { houseId: input.houseId, role: "OWNER" },
      });
      if (owners <= 1) throw new DomainError("The house needs at least one owner.");
    }
    await tx.membership.update({ where: { id: target.id }, data: { role: input.role } });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.actorId,
      action: "membership.role_changed",
      entityType: "membership",
      entityId: target.id,
      detail: { from: target.role, to: input.role },
    });
    return { changed: true };
  });
  if (!result.changed) throw new DomainError("That member already holds this role.");
}
