import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  createFormula,
  decideVersion,
  loadFormula,
  reviseFormula,
  saveDraft,
  submitVersion,
} from "@/services/formulas";
import { createTrial } from "@/services/trials";
import { DomainError } from "@/lib/auth";
import { BALANCED, createFixture, lines, resetDatabase, type Fixture } from "./helpers";

let fixture: Fixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createFixture();
});

async function draftFormula() {
  const formulaId = await createFormula({
    houseId: fixture.houseId,
    userId: fixture.users.perfumer,
    briefId: fixture.briefId,
    name: "No. 01",
    concentrationBp: 2000,
  });
  const formula = await loadFormula(fixture.houseId, formulaId);
  const versionId = formula!.versions[0].id;
  return { formulaId, versionId };
}

async function submittedFormula() {
  const draft = await draftFormula();
  await saveDraft({
    houseId: fixture.houseId,
    userId: fixture.users.perfumer,
    versionId: draft.versionId,
    note: "Draft",
    concentrationBp: 2000,
    lines: lines(fixture, BALANCED),
  });
  await submitVersion({
    houseId: fixture.houseId,
    userId: fixture.users.perfumer,
    versionId: draft.versionId,
    note: "Please read.",
  });
  return draft;
}

async function approvedFormula() {
  const submitted = await submittedFormula();
  await decideVersion({
    houseId: fixture.houseId,
    userId: fixture.users.evaluator,
    versionId: submitted.versionId,
    decision: "APPROVED",
    note: "Approved.",
  });
  return submitted;
}

describe("tenant scope", () => {
  it("hides a formula from another house", async () => {
    const { formulaId } = await draftFormula();
    expect(await loadFormula(fixture.rivalHouseId, formulaId)).toBeNull();
  });

  it("refuses a save from another house", async () => {
    const { versionId } = await draftFormula();
    await expect(
      saveDraft({
        houseId: fixture.rivalHouseId,
        userId: fixture.users.outsider,
        versionId,
        note: "",
        concentrationBp: 2000,
        lines: lines(fixture, BALANCED),
      })
    ).rejects.toThrow(/role does not allow|not in this house/);
  });

  it("refuses a trial from another house", async () => {
    const { versionId } = await submittedFormula();
    await expect(
      createTrial({
        houseId: fixture.rivalHouseId,
        userId: fixture.users.outsider,
        versionId,
        score: 5,
        tags: [],
        note: "Nice.",
      })
    ).rejects.toThrow(DomainError);
  });
});

describe("roles", () => {
  it("forbids an evaluator from creating a formula", async () => {
    await expect(
      createFormula({
        houseId: fixture.houseId,
        userId: fixture.users.evaluator,
        briefId: fixture.briefId,
        name: "Wrong hand",
        concentrationBp: 2000,
      })
    ).rejects.toThrow(/role does not allow/i);
  });

  it("forbids the lab from saving a draft", async () => {
    const { versionId } = await draftFormula();
    await expect(
      saveDraft({
        houseId: fixture.houseId,
        userId: fixture.users.lab,
        versionId,
        note: "",
        concentrationBp: 2000,
        lines: lines(fixture, BALANCED),
      })
    ).rejects.toThrow(/role does not allow/i);
  });

  it("forbids the lab from deciding a version", async () => {
    const { versionId } = await submittedFormula();
    await expect(
      decideVersion({
        houseId: fixture.houseId,
        userId: fixture.users.lab,
        versionId,
        decision: "APPROVED",
        note: "",
      })
    ).rejects.toThrow(/role does not allow/i);
  });

  it("allows the owner to decide", async () => {
    const { versionId } = await submittedFormula();
    await expect(
      decideVersion({
        houseId: fixture.houseId,
        userId: fixture.users.owner,
        versionId,
        decision: "APPROVED",
        note: "Owner approval.",
      })
    ).resolves.toBeUndefined();
  });
});

describe("submission boundaries", () => {
  it("rejects 999 parts", async () => {
    const { versionId } = await draftFormula();
    await saveDraft({
      houseId: fixture.houseId,
      userId: fixture.users.perfumer,
      versionId,
      note: "",
      concentrationBp: 2000,
      lines: lines(fixture, [
        ["A", 250],
        ["B", 450],
        ["C", 299],
      ]),
    });
    await expect(
      submitVersion({
        houseId: fixture.houseId,
        userId: fixture.users.perfumer,
        versionId,
        note: "",
      })
    ).rejects.toThrow(/999 of 1000/);
  });

  it("accepts exactly 1000 parts", async () => {
    const { versionId } = await submittedFormula();
    const version = await prisma.formulaVersion.findUniqueOrThrow({ where: { id: versionId } });
    expect(version.status).toBe("IN_REVIEW");
    expect(version.totalPpt).toBe(1000);
  });

  it("refuses to save 1001 parts", async () => {
    const { versionId } = await draftFormula();
    await expect(
      saveDraft({
        houseId: fixture.houseId,
        userId: fixture.users.perfumer,
        versionId,
        note: "",
        concentrationBp: 2000,
        lines: lines(fixture, [
          ["A", 250],
          ["B", 450],
          ["C", 301],
        ]),
      })
    ).rejects.toThrow(/cannot exceed 1000/);
  });

  it("rejects a material above its house cap", async () => {
    const { versionId } = await draftFormula();
    await prisma.material.update({
      where: { id: fixture.materials.A },
      data: { maxPpt: 200 },
    });
    await saveDraft({
      houseId: fixture.houseId,
      userId: fixture.users.perfumer,
      versionId,
      note: "",
      concentrationBp: 2000,
      lines: lines(fixture, [
        ["A", 300],
        ["B", 450],
        ["C", 150],
        ["D", 100],
      ]),
    });
    await expect(
      submitVersion({
        houseId: fixture.houseId,
        userId: fixture.users.perfumer,
        versionId,
        note: "",
      })
    ).rejects.toThrow(/house maximum/i);
  });
});

describe("version lifecycle", () => {
  it("locks an approved version", async () => {
    const { versionId } = await approvedFormula();
    await expect(
      saveDraft({
        houseId: fixture.houseId,
        userId: fixture.users.perfumer,
        versionId,
        note: "",
        concentrationBp: 2000,
        lines: lines(fixture, BALANCED),
      })
    ).rejects.toThrow(/draft can be edited/i);
  });

  it("refuses approval after a house maximum tightens", async () => {
    const { versionId } = await submittedFormula();
    await prisma.material.update({
      where: { id: fixture.materials.A },
      data: { maxPpt: 100 },
    });
    await expect(
      decideVersion({
        houseId: fixture.houseId,
        userId: fixture.users.evaluator,
        versionId,
        decision: "APPROVED",
        note: "Looks fine.",
      })
    ).rejects.toThrow(/house maximum/i);
  });

  it("requires a note to return a version", async () => {
    const { versionId } = await submittedFormula();
    await expect(
      decideVersion({
        houseId: fixture.houseId,
        userId: fixture.users.evaluator,
        versionId,
        decision: "CHANGES",
        note: "",
      })
    ).rejects.toThrow(/needs a note/i);
  });

  it("creates the next version on revision and copies the lines", async () => {
    const { formulaId } = await approvedFormula();
    const nextId = await reviseFormula({
      houseId: fixture.houseId,
      userId: fixture.users.perfumer,
      formulaId,
    });
    const next = await prisma.formulaVersion.findUniqueOrThrow({
      where: { id: nextId },
      include: { lines: true },
    });
    expect(next.version).toBe(2);
    expect(next.status).toBe("DRAFT");
    expect(next.lines).toHaveLength(4);
    expect(next.version).toBe(2);
  });

  it("refuses a second open draft", async () => {
    const { formulaId } = await approvedFormula();
    await reviseFormula({ houseId: fixture.houseId, userId: fixture.users.perfumer, formulaId });
    await expect(
      reviseFormula({ houseId: fixture.houseId, userId: fixture.users.perfumer, formulaId })
    ).rejects.toThrow(/draft is already open/i);
  });
});

describe("trials", () => {
  it("records a trial on a submitted version", async () => {
    const { versionId } = await submittedFormula();
    await createTrial({
      houseId: fixture.houseId,
      userId: fixture.users.evaluator,
      versionId,
      score: 4,
      tags: ["powder", "quiet"],
      note: "Close, a little quiet.",
    });
    const count = await prisma.trial.count({ where: { versionId } });
    expect(count).toBe(1);
  });

  it("rejects a score outside the scale", async () => {
    const { versionId } = await submittedFormula();
    await expect(
      createTrial({
        houseId: fixture.houseId,
        userId: fixture.users.evaluator,
        versionId,
        score: 0,
        tags: [],
        note: "No.",
      })
    ).rejects.toThrow(/1 to 5/);
  });

  it("refuses a trial on a draft", async () => {
    const { versionId } = await draftFormula();
    await expect(
      createTrial({
        houseId: fixture.houseId,
        userId: fixture.users.evaluator,
        versionId,
        score: 4,
        tags: [],
        note: "Too early.",
      })
    ).rejects.toThrow(/submitted version/);
  });
});

describe("audit", () => {
  it("records creation, submission and approval", async () => {
    await approvedFormula();
    const events = await prisma.auditEvent.findMany({
      where: { houseId: fixture.houseId },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((event) => event.action)).toEqual(
      expect.arrayContaining(["formula.created", "formula.draft_saved", "formula.submitted", "formula.approved"])
    );
  });
});
