import { describe, expect, it } from "vitest";
import {
  batchSchema,
  createFormulaSchema,
  decisionSchema,
  linesSchema,
  materialSchema,
  trialSchema,
} from "@/validation/schemas";

describe("createFormulaSchema", () => {
  it("accepts a valid formula", () => {
    expect(
      createFormulaSchema.safeParse({
        briefId: "brief_1",
        name: "No. 08",
        concentrationBp: "2000",
      }).success
    ).toBe(true);
  });

  it("rejects an unlisted concentration", () => {
    expect(
      createFormulaSchema.safeParse({ briefId: "b", name: "No. 08", concentrationBp: 1800 }).success
    ).toBe(false);
  });

  it("rejects a one-character name", () => {
    expect(
      createFormulaSchema.safeParse({ briefId: "b", name: "X", concentrationBp: 2000 }).success
    ).toBe(false);
  });
});

describe("linesSchema", () => {
  it("rejects zero parts", () => {
    expect(linesSchema.safeParse([{ materialId: "m", ppt: 0 }]).success).toBe(false);
  });

  it("rejects more than 1000 parts on one line", () => {
    expect(linesSchema.safeParse([{ materialId: "m", ppt: 1001 }]).success).toBe(false);
  });

  it("coerces a numeric string", () => {
    expect(linesSchema.parse([{ materialId: "m", ppt: "42" }])[0].ppt).toBe(42);
  });
});

describe("decisionSchema", () => {
  it("allows approval without a note", () => {
    expect(
      decisionSchema.safeParse({ versionId: "v", decision: "APPROVED", note: "" }).success
    ).toBe(true);
  });

  it("requires a note when returning", () => {
    expect(
      decisionSchema.safeParse({ versionId: "v", decision: "CHANGES", note: "" }).success
    ).toBe(false);
  });

  it("accepts a return with a note", () => {
    expect(
      decisionSchema.safeParse({ versionId: "v", decision: "CHANGES", note: "Too sweet" }).success
    ).toBe(true);
  });
});

describe("trialSchema", () => {
  it("rejects a score outside 1 to 5", () => {
    expect(
      trialSchema.safeParse({ versionId: "v", score: 6, tags: [], note: "ok" }).success
    ).toBe(false);
  });

  it("rejects more than six tags", () => {
    expect(
      trialSchema.safeParse({
        versionId: "v",
        score: 4,
        tags: ["a", "b", "c", "d", "e", "f", "g"],
        note: "ok",
      }).success
    ).toBe(false);
  });
});

describe("batchSchema", () => {
  it("accepts a 30 ml bottle", () => {
    expect(batchSchema.safeParse({ versionId: "v", bottleCount: 12, bottleMl: 30 }).success).toBe(
      true
    );
  });

  it("rejects a 40 ml bottle", () => {
    expect(batchSchema.safeParse({ versionId: "v", bottleCount: 12, bottleMl: 40 }).success).toBe(
      false
    );
  });

  it("rejects zero bottles", () => {
    expect(batchSchema.safeParse({ versionId: "v", bottleCount: 0, bottleMl: 50 }).success).toBe(
      false
    );
  });
});

describe("materialSchema", () => {
  it("normalises a code to uppercase", () => {
    const result = materialSchema.parse({
      code: "berg",
      name: "Bergamot",
      family: "citrus",
      note: "TOP",
      costCentsPerGram: 9,
      persistenceHours: 2,
      stockMg: 1000,
      maxPpt: 100,
      reorderMg: 100,
      description: "Cold peel.",
    });
    expect(result.code).toBe("BERG");
  });

  it("rejects an invalid note", () => {
    expect(
      materialSchema.safeParse({
        code: "BERG",
        name: "Bergamot",
        family: "citrus",
        note: "MIDDLE",
        costCentsPerGram: 9,
        persistenceHours: 2,
        stockMg: 1000,
        maxPpt: 100,
        reorderMg: 100,
        description: "Cold peel.",
      }).success
    ).toBe(false);
  });
});
