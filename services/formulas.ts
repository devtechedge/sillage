import { Prisma } from "@/generated/client/client";
import { AuthorizationError, DomainError } from "@/lib/auth";
import { prisma, TX_OPTIONS } from "@/lib/db";
import { recordAudit } from "./audit";
import { requireRole } from "./memberships";

export interface FormulaWriteInput {
  houseId: string;
  userId: string;
  versionId: string;
}

export async function createFormula(input: {
  houseId: string;
  userId: string;
  briefId: string;
  name: string;
  concentrationBp: number;
}): Promise<string> {
  return prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "PERFUMER"]);
    const brief = await tx.brief.findFirst({
      where: { id: input.briefId, houseId: input.houseId },
    });
    if (!brief) throw new DomainError("That brief is not in this house.");

    const formula = await tx.formula.create({
      data: {
        houseId: input.houseId,
        briefId: input.briefId,
        name: input.name.trim(),
        concentrationBp: input.concentrationBp,
        status: "DRAFT",
        createdById: input.userId,
      },
    });
    const version = await tx.formulaVersion.create({
      data: {
        formulaId: formula.id,
        version: 1,
        status: "DRAFT",
        createdById: input.userId,
        note: "First draft.",
      },
    });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "formula.created",
      entityType: "formula",
      entityId: formula.id,
      detail: { name: formula.name, versionId: version.id },
    });
    return formula.id;
  });
}

export async function saveDraft(input: FormulaWriteInput & {
  note: string;
  concentrationBp: number;
  lines: { materialId: string; ppt: number }[];
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "PERFUMER"]);
    const version = await tx.formulaVersion.findFirst({
      where: { id: input.versionId, formula: { houseId: input.houseId } },
      include: { formula: true },
    });
    if (!version) throw new DomainError("That version is not in this house.");
    if (version.status !== "DRAFT") throw new DomainError("Only a draft can be edited.");

    const unique = new Set(input.lines.map((line) => line.materialId));
    if (unique.size !== input.lines.length) {
      throw new DomainError("A material can appear only once in a formula.");
    }

    const materials = await tx.material.findMany({
      where: { houseId: input.houseId, id: { in: [...unique] } },
    });
    if (materials.length !== unique.size) {
      throw new DomainError("One of the materials is not in this house.");
    }

    const totalPpt = input.lines.reduce((sum, line) => sum + line.ppt, 0);
    if (totalPpt > 1000) throw new DomainError("A formula cannot exceed 1000 parts.");

    await tx.formulaLine.deleteMany({ where: { versionId: version.id } });
    if (input.lines.length > 0) {
      await tx.formulaLine.createMany({
        data: input.lines.map((line) => ({ versionId: version.id, ...line })),
      });
    }
    await tx.formulaVersion.update({
      where: { id: version.id },
      data: { totalPpt, note: input.note },
    });
    await tx.formula.update({
      where: { id: version.formulaId },
      data: { concentrationBp: input.concentrationBp, updatedAt: new Date() },
    });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "formula.draft_saved",
      entityType: "formula_version",
      entityId: version.id,
      detail: { totalPpt, lines: input.lines.length },
    });
  });
}

export async function submitVersion(input: FormulaWriteInput & { note: string }): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "PERFUMER"]);
    const version = await tx.formulaVersion.findFirst({
      where: { id: input.versionId, formula: { houseId: input.houseId } },
      include: {
        formula: true,
        lines: { include: { material: true } },
      },
    });
    if (!version) throw new DomainError("That version is not in this house.");
    if (version.status !== "DRAFT") throw new DomainError("Only a draft can be submitted.");
    if (version.lines.length < 3) {
      throw new DomainError("A formula needs at least three materials before submission.");
    }
    const total = version.lines.reduce((sum, line) => sum + line.ppt, 0);
    if (total !== 1000) {
      throw new DomainError(`The formula holds ${total} of 1000 parts.`);
    }
    for (const line of version.lines) {
      if (line.ppt > line.material.maxPpt) {
        throw new DomainError(
          `${line.material.name} is at ${line.ppt} parts, above the house maximum of ${line.material.maxPpt}.`
        );
      }
    }
    await tx.formulaVersion.update({
      where: { id: version.id },
      data: {
        status: "IN_REVIEW",
        submittedAt: new Date(),
        note: input.note || version.note,
      },
    });
    await tx.formula.update({
      where: { id: version.formulaId },
      data: { status: "IN_REVIEW" },
    });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "formula.submitted",
      entityType: "formula_version",
      entityId: version.id,
      detail: { version: version.version },
    });
  }, TX_OPTIONS);
}

export async function reviseFormula(input: {
  houseId: string;
  userId: string;
  formulaId: string;
}): Promise<string> {
  return prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "PERFUMER"]);
    const formula = await tx.formula.findFirst({
      where: { id: input.formulaId, houseId: input.houseId },
      include: { versions: { orderBy: { version: "desc" }, take: 1, include: { lines: true } } },
    });
    if (!formula) throw new DomainError("That formula is not in this house.");
    const open = await tx.formulaVersion.findFirst({
      where: { formulaId: formula.id, status: "DRAFT" },
    });
    if (open) throw new DomainError("A draft is already open for this formula.");
    if (!["APPROVED", "CHANGES"].includes(formula.status)) {
      throw new DomainError("Only an approved or returned formula can be revised.");
    }
    const latest = formula.versions[0];
    if (!latest) throw new DomainError("This formula has no version to revise.");

    const version = await tx.formulaVersion.create({
      data: {
        formulaId: formula.id,
        version: latest.version + 1,
        status: "DRAFT",
        createdById: input.userId,
        note: `Revision of version ${latest.version}.`,
      },
    });
    if (latest.lines.length > 0) {
      await tx.formulaLine.createMany({
        data: latest.lines.map((line) => ({
          versionId: version.id,
          materialId: line.materialId,
          ppt: line.ppt,
        })),
      });
    }
    await tx.formulaVersion.update({
      where: { id: version.id },
      data: { totalPpt: latest.totalPpt },
    });
    await tx.formula.update({
      where: { id: formula.id },
      data: { status: "DRAFT" },
    });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: "formula.revised",
      entityType: "formula_version",
      entityId: version.id,
      detail: { from: latest.version, to: version.version },
    });
    return version.id;
  }, TX_OPTIONS);
}

export async function decideVersion(input: {
  houseId: string;
  userId: string;
  versionId: string;
  decision: "APPROVED" | "CHANGES";
  note: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await requireRole(tx, input.houseId, input.userId, ["OWNER", "EVALUATOR"]);
    if (input.decision === "CHANGES" && input.note.trim().length < 3) {
      throw new DomainError("Returning a version needs a note for the perfumer.");
    }
    const version = await tx.formulaVersion.findFirst({
      where: { id: input.versionId, formula: { houseId: input.houseId } },
      include: { formula: true, lines: { include: { material: true } } },
    });
    if (!version) throw new DomainError("That version is not in this house.");
    if (version.status !== "IN_REVIEW") {
      throw new DomainError("Only a version in review can be decided.");
    }
    if (input.decision === "APPROVED") {
      const total = version.lines.reduce((sum, line) => sum + line.ppt, 0);
      if (version.lines.length < 3 || total !== 1000) {
        throw new DomainError("An approved version must hold exactly 1000 parts in at least three materials.");
      }
      for (const line of version.lines) {
        if (line.ppt > line.material.maxPpt) {
          throw new DomainError(
            `${line.material.name} is above its house maximum. Return the version before approving it.`
          );
        }
      }
    }
    await tx.formulaVersion.update({
      where: { id: version.id },
      data: {
        status: input.decision,
        reviewerId: input.userId,
        decidedAt: new Date(),
        decisionNote: input.note.trim() || null,
      },
    });
    await tx.formula.update({
      where: { id: version.formulaId },
      data: { status: input.decision },
    });
    await recordAudit(tx, {
      houseId: input.houseId,
      actorId: input.userId,
      action: input.decision === "APPROVED" ? "formula.approved" : "formula.returned",
      entityType: "formula_version",
      entityId: version.id,
      detail: { version: version.version, note: input.note.trim() },
    });
  }, TX_OPTIONS);
}

export async function loadFormula(houseId: string, formulaId: string) {
  return prisma.formula.findFirst({
    where: { id: formulaId, houseId },
    include: {
      brief: true,
      createdBy: { select: { name: true } },
      versions: {
        orderBy: { version: "desc" },
        include: {
          createdBy: { select: { name: true } },
          reviewer: { select: { name: true } },
          lines: {
            include: { material: true },
            orderBy: { material: { code: "asc" } },
          },
          trials: {
            orderBy: { createdAt: "desc" },
            include: { evaluator: { select: { name: true } } },
          },
        },
      },
    },
  });
}

export function asAuthorizationMessage(error: unknown): string | null {
  if (error instanceof AuthorizationError) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "That record already exists.";
  }
  return null;
}
