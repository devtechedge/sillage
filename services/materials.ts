import { DomainError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "./audit";
import { requireRole } from "./memberships";

export async function addMaterial(input: {
  houseId: string;
  userId: string;
  code: string;
  name: string;
  family: string;
  note: string;
  costCentsPerGram: number;
  persistenceHours: number;
  stockMg: number;
  maxPpt: number;
  reorderMg: number;
  description: string;
}): Promise<string> {
  return prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "LAB"]);
    const existing = await tx.material.findFirst({
      where: { houseId: input.houseId, code: input.code },
    });
    if (existing) throw new DomainError("That material code is already in the cabinet.");

    const material = await tx.material.create({
      data: {
        houseId: input.houseId,
        code: input.code.toUpperCase(),
        name: input.name.trim(),
        family: input.family.trim().toLowerCase(),
        note: input.note,
        costCentsPerGram: input.costCentsPerGram,
        persistenceHours: input.persistenceHours,
        stockMg: input.stockMg,
        maxPpt: input.maxPpt,
        reorderMg: input.reorderMg,
        description: input.description.trim(),
      },
    });
    if (input.stockMg > 0) {
      await tx.stockEntry.create({
        data: {
          houseId: input.houseId,
          materialId: material.id,
          deltaMg: input.stockMg,
          reason: "INTAKE",
          actorId: input.userId,
        },
      });
    }
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "material.added",
      entityType: "material",
      entityId: material.id,
      detail: { code: material.code, stockMg: input.stockMg },
    });
    return material.id;
  });
}

export async function recordIntake(input: {
  houseId: string;
  userId: string;
  materialId: string;
  grams: number;
}): Promise<void> {
  const deltaMg = Math.round(input.grams * 1000);
  if (deltaMg <= 0) throw new DomainError("Intake must be greater than zero.");

  await prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "LAB"]);
    const material = await tx.material.findFirst({
      where: { id: input.materialId, houseId: input.houseId },
    });
    if (!material) throw new DomainError("That material is not in this cabinet.");

    await tx.material.update({
      where: { id: material.id },
      data: { stockMg: { increment: deltaMg } },
    });
    await tx.stockEntry.create({
      data: {
        houseId: input.houseId,
        materialId: material.id,
        deltaMg,
        reason: "INTAKE",
        actorId: input.userId,
      },
    });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "material.intake",
      entityType: "material",
      entityId: material.id,
      detail: { grams: input.grams, deltaMg },
    });
  });
}

export async function listMaterials(houseId: string) {
  return prisma.material.findMany({
    where: { houseId, active: true },
    orderBy: [{ family: "asc" }, { name: "asc" }],
  });
}

export async function lowStock(houseId: string) {
  return prisma.$queryRaw<
    { id: string; name: string; stockMg: number; reorderMg: number }[]
  >`SELECT id, name, "stockMg", "reorderMg" FROM "material"
    WHERE "houseId" = ${houseId} AND active = true AND "stockMg" <= "reorderMg"
    ORDER BY "stockMg" ASC LIMIT 8`;
}
