"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHouse } from "@/lib/auth";
import { failure, field } from "@/lib/actions";
import type { ActionState } from "@/lib/action-state";
import {
  batchSchema,
  createFormulaSchema,
  decisionSchema,
  intakeSchema,
  linesSchema,
  materialSchema,
  roleSchema,
  saveDraftSchema,
  submitVersionSchema,
  trialSchema,
} from "@/validation/schemas";
import {
  createFormula,
  decideVersion,
  reviseFormula,
  saveDraft,
  submitVersion,
} from "@/services/formulas";
import { createTrial } from "@/services/trials";
import { advanceBatch, createBatch } from "@/services/batches";
import { addMaterial, recordIntake } from "@/services/materials";
import { changeRole } from "@/services/memberships";

export async function createFormulaAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let formulaId = "";
  try {
    const context = await requireHouse();
    const input = createFormulaSchema.parse({
      briefId: field(formData, "briefId"),
      name: field(formData, "name"),
      concentrationBp: field(formData, "concentrationBp"),
    });
    formulaId = await createFormula({ ...input, houseId: context.houseId, userId: context.userId });
  } catch (error) {
    return failure(error);
  }
  redirect(`/formulas/${formulaId}`);
}

export async function saveDraftAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    let lines: unknown;
    try {
      lines = JSON.parse(field(formData, "lines") || "[]");
    } catch {
      return { error: "The formula could not be read. Reload the page." };
    }
    const input = saveDraftSchema.parse({
      versionId: field(formData, "versionId"),
      note: field(formData, "note"),
      concentrationBp: field(formData, "concentrationBp"),
      lines: linesSchema.parse(lines),
    });
    await saveDraft({ ...input, houseId: context.houseId, userId: context.userId });
    revalidatePath(`/formulas/${field(formData, "formulaId")}`);
    revalidatePath("/desk");
    return { ok: true, message: "Draft saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function submitVersionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    const input = submitVersionSchema.parse({
      versionId: field(formData, "versionId"),
      note: field(formData, "note"),
    });
    await submitVersion({ ...input, houseId: context.houseId, userId: context.userId });
    revalidatePath(`/formulas/${field(formData, "formulaId")}`);
    revalidatePath("/desk");
    return { ok: true, message: "Version submitted for review." };
  } catch (error) {
    return failure(error);
  }
}

export async function reviseFormulaAction(formData: FormData): Promise<void> {
  const context = await requireHouse();
  const formulaId = field(formData, "formulaId");
  const versionId = await reviseFormula({
    houseId: context.houseId,
    userId: context.userId,
    formulaId,
  });
  revalidatePath(`/formulas/${formulaId}`);
  redirect(`/formulas/${formulaId}?version=${versionId}`);
}

export async function decisionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    const input = decisionSchema.parse({
      versionId: field(formData, "versionId"),
      decision: field(formData, "decision"),
      note: field(formData, "note"),
    });
    await decideVersion({ ...input, houseId: context.houseId, userId: context.userId });
    revalidatePath(`/formulas/${field(formData, "formulaId")}`);
    revalidatePath("/desk");
    return { ok: true, message: input.decision === "APPROVED" ? "Version approved." : "Version returned." };
  } catch (error) {
    return failure(error);
  }
}

export async function trialAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    const input = trialSchema.parse({
      versionId: field(formData, "versionId"),
      score: field(formData, "score"),
      tags: formData.getAll("tags").map(String),
      note: field(formData, "note"),
    });
    await createTrial({ ...input, houseId: context.houseId, userId: context.userId });
    revalidatePath(`/formulas/${field(formData, "formulaId")}`);
    revalidatePath("/trials");
    revalidatePath("/desk");
    return { ok: true, message: "Trial recorded." };
  } catch (error) {
    return failure(error);
  }
}

export async function batchAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    const input = batchSchema.parse({
      versionId: field(formData, "versionId"),
      bottleCount: field(formData, "bottleCount"),
      bottleMl: field(formData, "bottleMl"),
    });
    const batch = await createBatch({ ...input, houseId: context.houseId, userId: context.userId });
    revalidatePath("/batches");
    revalidatePath("/desk");
    revalidatePath("/materials");
    return { ok: true, message: `Lot ${batch.lotCode} is in the dark room.`, link: `/batches/${batch.id}` };
  } catch (error) {
    return failure(error);
  }
}

export async function advanceBatchAction(formData: FormData): Promise<void> {
  const context = await requireHouse();
  const batchId = field(formData, "batchId");
  await advanceBatch({ houseId: context.houseId, userId: context.userId, batchId });
  revalidatePath(`/batches/${batchId}`);
  revalidatePath("/batches");
}

export async function addMaterialAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    const input = materialSchema.parse({
      code: field(formData, "code"),
      name: field(formData, "name"),
      family: field(formData, "family"),
      note: field(formData, "note"),
      costCentsPerGram: field(formData, "costCentsPerGram"),
      persistenceHours: field(formData, "persistenceHours"),
      stockMg: Math.round(Number(field(formData, "stockGrams") || 0) * 1000),
      maxPpt: field(formData, "maxPpt"),
      reorderMg: Math.round(Number(field(formData, "reorderGrams") || 0) * 1000),
      description: field(formData, "description"),
    });
    await addMaterial({ ...input, houseId: context.houseId, userId: context.userId });
    revalidatePath("/materials");
    return { ok: true, message: "Material added to the cabinet." };
  } catch (error) {
    return failure(error);
  }
}

export async function intakeAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    const input = intakeSchema.parse({
      materialId: field(formData, "materialId"),
      grams: field(formData, "grams"),
    });
    await recordIntake({ ...input, houseId: context.houseId, userId: context.userId });
    revalidatePath("/materials");
    revalidatePath("/desk");
    return { ok: true, message: "Intake recorded." };
  } catch (error) {
    return failure(error);
  }
}

export async function changeRoleAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireHouse();
    const input = roleSchema.parse({
      membershipId: field(formData, "membershipId"),
      role: field(formData, "role"),
    });
    await changeRole({ ...input, houseId: context.houseId, actorId: context.userId });
    revalidatePath("/team");
    return { ok: true, message: "Role updated." };
  } catch (error) {
    return failure(error);
  }
}
