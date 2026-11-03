import { DomainError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "./audit";
import { requireRole } from "./memberships";

export async function createTrial(input: {
  houseId: string;
  userId: string;
  versionId: string;
  score: number;
  tags: string[];
  note: string;
}): Promise<void> {
  if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
    throw new DomainError("A trial score must be a whole number from 1 to 5.");
  }
  if (input.note.trim().length < 3) {
    throw new DomainError("A trial needs a short note.");
  }
  if (input.tags.length > 6) {
    throw new DomainError("Use no more than six tags.");
  }

  await prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "EVALUATOR"]);
    const version = await tx.formulaVersion.findFirst({
      where: { id: input.versionId, formula: { houseId: input.houseId } },
      include: { formula: true },
    });
    if (!version) throw new DomainError("That version is not in this house.");
    if (!["IN_REVIEW", "APPROVED", "CHANGES"].includes(version.status)) {
      throw new DomainError("A trial can only be recorded on a submitted version.");
    }

    const trial = await tx.trial.create({
      data: {
        houseId: input.houseId,
        versionId: version.id,
        evaluatorId: input.userId,
        score: input.score,
        tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
        note: input.note.trim(),
      },
    });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "trial.recorded",
      entityType: "trial",
      entityId: trial.id,
      detail: { score: trial.score, version: version.version },
    });
  });
}

export async function loadTrial(houseId: string, trialId: string) {
  return prisma.trial.findFirst({
    where: { id: trialId, houseId },
    include: {
      evaluator: { select: { name: true } },
      version: {
        include: {
          formula: { select: { id: true, name: true, concentrationBp: true, briefId: true } },
          lines: { include: { material: true } },
        },
      },
    },
  });
}

export async function listTrials(houseId: string) {
  return prisma.trial.findMany({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: {
      evaluator: { select: { name: true } },
      version: {
        include: {
          formula: { select: { id: true, name: true, concentrationBp: true } },
        },
      },
    },
  });
}
