import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/client/client";
import { batchDraws } from "@/domain/batch";
import { lotCode } from "@/domain/lot";
import { DomainError } from "@/lib/auth";
import { prisma, TX_OPTIONS, type TransactionClient } from "@/lib/db";
import { recordAudit } from "./audit";
import { requireRole } from "./memberships";

async function nextLotCode(tx: TransactionClient, houseId: string, now: Date): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = lotCode(now, randomInt);
    const existing = await tx.batch.findUnique({
      where: { houseId_lotCode: { houseId, lotCode: code } },
    });
    if (!existing) return code;
  }
  throw new DomainError("Could not allocate a lot code. Try again.");
}

export async function createBatch(input: {
  houseId: string;
  userId: string;
  versionId: string;
  bottleCount: number;
  bottleMl: number;
}): Promise<{ id: string; lotCode: string }> {
  return withSerializableRetry(async () =>
    prisma.$transaction(async (tx) => {
      await requireRole(tx, input.houseId, input.userId, ["OWNER", "LAB"]);
      const version = await tx.formulaVersion.findFirst({
        where: {
          id: input.versionId,
          formula: { houseId: input.houseId },
        },
        include: {
          formula: true,
          lines: { include: { material: true } },
        },
      });
      if (!version) throw new DomainError("That version is not in this house.");
      if (version.status !== "APPROVED") {
        throw new DomainError("Only an approved version can become a batch.");
      }
      if (version.lines.length === 0) throw new DomainError("This version has no materials.");

      const draws = batchDraws(
        version.lines,
        input.bottleCount,
        input.bottleMl,
        version.formula.concentrationBp
      );
      const shortages = draws.filter((draw) => draw.requiredMg > draw.stockMg);
      if (shortages.length > 0) {
        const detail = shortages
          .map(
            (draw) =>
              `${draw.name} needs ${draw.requiredMg} mg, ${draw.stockMg} mg in stock`
          )
          .join("; ");
        throw new DomainError(`Production stopped. ${detail}.`);
      }

      const now = new Date();
      const code = await nextLotCode(tx, input.houseId, now);
      const maceratedUntil = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
      const batch = await tx.batch.create({
        data: {
          houseId: input.houseId,
          versionId: version.id,
          lotCode: code,
          bottleCount: input.bottleCount,
          bottleMl: input.bottleMl,
          status: "MACERATING",
          maceratedUntil,
          createdById: input.userId,
        },
      });

      for (const draw of draws) {
        await tx.material.update({
          where: { id: draw.materialId },
          data: { stockMg: { decrement: draw.requiredMg } },
        });
      }
      await tx.stockEntry.createMany({
        data: draws.map((draw) => ({
          houseId: input.houseId,
          materialId: draw.materialId,
          deltaMg: -draw.requiredMg,
          reason: "BATCH",
          batchId: batch.id,
          actorId: input.userId,
        })),
      });
      await recordAudit(tx, {
        houseId: input.houseId,
        actorId: input.userId,
        action: "batch.produced",
        entityType: "batch",
        entityId: batch.id,
        detail: {
          lotCode: code,
          bottleCount: input.bottleCount,
          bottleMl: input.bottleMl,
          draws: draws.map((draw) => ({
            code: draw.code,
            requiredMg: draw.requiredMg,
          })),
        },
      });
      return { id: batch.id, lotCode: code };
    }, { ...TX_OPTIONS, isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  );
}

export async function advanceBatch(input: {
  houseId: string;
  userId: string;
  batchId: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "LAB"]);
    const batch = await tx.batch.findFirst({
      where: { id: input.batchId, houseId: input.houseId },
    });
    if (!batch) throw new DomainError("That batch is not in this house.");
    const next =
      batch.status === "MACERATING" ? "READY" : batch.status === "READY" ? "RELEASED" : null;
    if (!next) throw new DomainError("This batch is already released.");
    await tx.batch.update({ where: { id: batch.id }, data: { status: next } });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "batch.advanced",
      entityType: "batch",
      entityId: batch.id,
      detail: { from: batch.status, to: next },
    });
  });
}

export async function loadBatch(houseId: string, batchId: string) {
  return prisma.batch.findFirst({
    where: { id: batchId, houseId },
    include: {
      createdBy: { select: { name: true } },
      version: {
        include: {
          formula: { include: { brief: true } },
          lines: { include: { material: true }, orderBy: { material: { code: "asc" } } },
        },
      },
      stock: {
        include: { material: { select: { name: true, code: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function listBatches(houseId: string) {
  return prisma.batch.findMany({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: {
      version: { include: { formula: { select: { name: true } } } },
    },
  });
}

async function withSerializableRetry<T>(work: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
