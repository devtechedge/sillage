import { z } from "zod";
import { CONCENTRATIONS, NOTES, ROLES } from "@/domain/types";

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8).max(200);

export const lineInputSchema = z.object({
  materialId: z.string().min(1),
  ppt: z.coerce.number().int().min(1).max(1000),
});

export const linesSchema = z.array(lineInputSchema).max(60);

export const createFormulaSchema = z.object({
  briefId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  concentrationBp: z.coerce
    .number()
    .int()
    .refine((value) => (CONCENTRATIONS as readonly number[]).includes(value), {
      message: "Concentration must be 12, 20 or 25 percent.",
    }),
});

export const saveDraftSchema = z.object({
  versionId: z.string().min(1),
  note: z.string().trim().max(400).default(""),
  concentrationBp: z.coerce
    .number()
    .int()
    .refine((value) => (CONCENTRATIONS as readonly number[]).includes(value), {
      message: "Concentration must be 12, 20 or 25 percent.",
    }),
  lines: linesSchema,
});

export const submitVersionSchema = z.object({
  versionId: z.string().min(1),
  note: z.string().trim().max(400).default(""),
});

export const decisionSchema = z
  .object({
    versionId: z.string().min(1),
    decision: z.enum(["APPROVED", "CHANGES"]),
    note: z.string().trim().max(600).default(""),
  })
  .refine((value) => value.decision === "APPROVED" || value.note.length >= 3, {
    message: "Returning a version needs a note for the perfumer.",
    path: ["note"],
  });

export const trialSchema = z.object({
  versionId: z.string().min(1),
  score: z.coerce.number().int().min(1).max(5),
  tags: z.array(z.string().trim().min(1).max(24)).max(6).default([]),
  note: z.string().trim().min(3).max(800),
});

export const batchSchema = z.object({
  versionId: z.string().min(1),
  bottleCount: z.coerce.number().int().min(1).max(500),
  bottleMl: z.coerce
    .number()
    .int()
    .refine((value) => [30, 50, 100].includes(value), {
      message: "Bottle size must be 30, 50 or 100 ml.",
    }),
});

export const materialSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,6}$/, "Use two to six letters."),
  name: z.string().trim().min(2).max(80),
  family: z.string().trim().min(2).max(24),
  note: z.enum(NOTES),
  costCentsPerGram: z.coerce.number().int().min(0).max(1000000),
  persistenceHours: z.coerce.number().int().min(1).max(72),
  stockMg: z.coerce.number().int().min(0).max(100000000),
  maxPpt: z.coerce.number().int().min(1).max(1000),
  reorderMg: z.coerce.number().int().min(0).max(100000000),
  description: z.string().trim().min(4).max(240),
});

export const intakeSchema = z.object({
  materialId: z.string().min(1),
  grams: z.coerce.number().positive().max(100000),
});

export const roleSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum(ROLES),
});

export type CreateFormulaInput = z.infer<typeof createFormulaSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type TrialInput = z.infer<typeof trialSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
