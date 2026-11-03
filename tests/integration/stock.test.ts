import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createFormula, decideVersion, loadFormula, saveDraft, submitVersion } from "@/services/formulas";
import { createBatch, loadBatch, advanceBatch } from "@/services/batches";
import { addMaterial, recordIntake } from "@/services/materials";
import { changeRole } from "@/services/memberships";
import { BALANCED, createFixture, lines, resetDatabase, type Fixture } from "./helpers";

let fixture: Fixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createFixture();
});

async function approvedFormula() {
  const formulaId = await createFormula({
    houseId: fixture.houseId,
    userId: fixture.users.perfumer,
    briefId: fixture.briefId,
    name: "No. 02",
    concentrationBp: 2000,
  });
  const formula = await loadFormula(fixture.houseId, formulaId);
  const versionId = formula!.versions[0].id;
  await saveDraft({
    houseId: fixture.houseId,
    userId: fixture.users.perfumer,
    versionId,
    note: "Draft",
    concentrationBp: 2000,
    lines: lines(fixture, BALANCED),
  });
  await submitVersion({
    houseId: fixture.houseId,
    userId: fixture.users.perfumer,
    versionId,
    note: "Read.",
  });
  await decideVersion({
    houseId: fixture.houseId,
    userId: fixture.users.evaluator,
    versionId,
    decision: "APPROVED",
    note: "Approved.",
  });
  return { formulaId, versionId };
}

describe("batch production", () => {
  it("refuses a version that is not approved", async () => {
    const formulaId = await createFormula({
      houseId: fixture.houseId,
      userId: fixture.users.perfumer,
      briefId: fixture.briefId,
      name: "No. 03",
      concentrationBp: 2000,
    });
    const formula = await loadFormula(fixture.houseId, formulaId);
    await expect(
      createBatch({
        houseId: fixture.houseId,
        userId: fixture.users.lab,
        versionId: formula!.versions[0].id,
        bottleCount: 1,
        bottleMl: 50,
      })
    ).rejects.toThrow(/approved/i);
  });

  it("draws exact milligrams and writes one ledger entry per material", async () => {
    const { versionId } = await approvedFormula();
    const batch = await createBatch({
      houseId: fixture.houseId,
      userId: fixture.users.lab,
      versionId,
      bottleCount: 10,
      bottleMl: 100,
    });
    expect(batch.lotCode).toMatch(/^SV-\d{4}-[A-Z0-9]{4}$/);

    const materials = await prisma.material.findMany({ where: { houseId: fixture.houseId } });
    const byCode = Object.fromEntries(materials.map((material) => [material.code, material]));
    expect(byCode.A.stockMg).toBe(950_000);
    expect(byCode.B.stockMg).toBe(910_000);
    expect(byCode.C.stockMg).toBe(960_000);
    expect(byCode.D.stockMg).toBe(980_000);

    const entries = await prisma.stockEntry.findMany({ where: { batchId: batch.id } });
    expect(entries).toHaveLength(4);
    expect(entries.every((entry) => entry.reason === "BATCH" && entry.deltaMg < 0)).toBe(true);
    expect(entries.reduce((sum, entry) => sum + entry.deltaMg, 0)).toBe(-200_000);

    const loaded = await loadBatch(fixture.houseId, batch.id);
    expect(loaded?.stock).toHaveLength(4);
    expect(loaded?.status).toBe("MACERATING");
  });

  it("rolls back every material when one is one milligram short", async () => {
    const { versionId } = await approvedFormula();
    await prisma.material.update({
      where: { id: fixture.materials.C },
      data: { stockMg: 39_999 },
    });
    await expect(
      createBatch({
        houseId: fixture.houseId,
        userId: fixture.users.lab,
        versionId,
        bottleCount: 10,
        bottleMl: 100,
      })
    ).rejects.toThrow(/Gamma needs 40000 mg, 39999 mg/);

    const material = await prisma.material.findUniqueOrThrow({ where: { id: fixture.materials.C } });
    expect(material.stockMg).toBe(39_999);
    expect(await prisma.batch.count()).toBe(0);
    expect(await prisma.stockEntry.count({ where: { reason: "BATCH" } })).toBe(0);
  });

  it("does not oversell under five concurrent batches", async () => {
    const { versionId } = await approvedFormula();
    for (const [code, id] of Object.entries(fixture.materials)) {
      const required = { A: 50_000, B: 90_000, C: 40_000, D: 20_000 }[code]!;
      await prisma.material.update({ where: { id }, data: { stockMg: required } });
    }
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        createBatch({
          houseId: fixture.houseId,
          userId: fixture.users.lab,
          versionId,
          bottleCount: 10,
          bottleMl: 100,
        })
      )
    );
    const fulfilled = attempts.filter((attempt) => attempt.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);
    expect(await prisma.batch.count()).toBe(1);
    for (const id of Object.values(fixture.materials)) {
      const material = await prisma.material.findUniqueOrThrow({ where: { id } });
      expect(material.stockMg).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects a duplicate lot code at the database boundary", async () => {
    const { versionId } = await approvedFormula();
    const batch = await createBatch({
      houseId: fixture.houseId,
      userId: fixture.users.lab,
      versionId,
      bottleCount: 1,
      bottleMl: 50,
    });
    await expect(
      prisma.batch.create({
        data: {
          houseId: fixture.houseId,
          versionId,
          lotCode: batch.lotCode,
          bottleCount: 1,
          bottleMl: 30,
          maceratedUntil: new Date(),
          createdById: fixture.users.lab,
        },
      })
    ).rejects.toThrow(/unique/i);
  });

  it("advances a batch from macerating to ready to released", async () => {
    const { versionId } = await approvedFormula();
    const batch = await createBatch({
      houseId: fixture.houseId,
      userId: fixture.users.lab,
      versionId,
      bottleCount: 1,
      bottleMl: 30,
    });
    await advanceBatch({ houseId: fixture.houseId, userId: fixture.users.lab, batchId: batch.id });
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe("READY");
    await advanceBatch({ houseId: fixture.houseId, userId: fixture.users.lab, batchId: batch.id });
    expect((await prisma.batch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe("RELEASED");
    await expect(
      advanceBatch({ houseId: fixture.houseId, userId: fixture.users.lab, batchId: batch.id })
    ).rejects.toThrow(/already released/i);
  });

  it("refuses production for a perfumer", async () => {
    const { versionId } = await approvedFormula();
    await expect(
      createBatch({
        houseId: fixture.houseId,
        userId: fixture.users.perfumer,
        versionId,
        bottleCount: 1,
        bottleMl: 30,
      })
    ).rejects.toThrow(/role does not allow/i);
  });
});

describe("materials", () => {
  it("records intake and a signed ledger entry", async () => {
    const before = await prisma.material.findUniqueOrThrow({ where: { id: fixture.materials.A } });
    await recordIntake({
      houseId: fixture.houseId,
      userId: fixture.users.lab,
      materialId: fixture.materials.A,
      grams: 2.5,
    });
    const after = await prisma.material.findUniqueOrThrow({ where: { id: fixture.materials.A } });
    expect(after.stockMg).toBe(before.stockMg + 2500);
    const entry = await prisma.stockEntry.findFirstOrThrow({
      where: { materialId: fixture.materials.A, reason: "INTAKE", deltaMg: 2500 },
    });
    expect(entry.actorId).toBe(fixture.users.lab);
  });

  it("adds a material with opening stock", async () => {
    const id = await addMaterial({
      houseId: fixture.houseId,
      userId: fixture.users.lab,
      code: "NEW",
      name: "New material",
      family: "resin",
      note: "BASE",
      costCentsPerGram: 100,
      persistenceHours: 10,
      stockMg: 5000,
      maxPpt: 50,
      reorderMg: 1000,
      description: "A new resin.",
    });
    expect(await prisma.material.count({ where: { id } })).toBe(1);
    expect(await prisma.stockEntry.count({ where: { materialId: id, deltaMg: 5000 } })).toBe(1);
  });

  it("rejects a duplicate material code", async () => {
    await expect(
      addMaterial({
        houseId: fixture.houseId,
        userId: fixture.users.lab,
        code: "A",
        name: "Copy",
        family: "resin",
        note: "BASE",
        costCentsPerGram: 1,
        persistenceHours: 1,
        stockMg: 1,
        maxPpt: 1,
        reorderMg: 0,
        description: "Copy.",
      })
    ).rejects.toThrow(/already in the cabinet/i);
  });

  it("refuses a perfumer adding materials", async () => {
    await expect(
      addMaterial({
        houseId: fixture.houseId,
        userId: fixture.users.perfumer,
        code: "ZZ",
        name: "Nope",
        family: "resin",
        note: "BASE",
        costCentsPerGram: 1,
        persistenceHours: 1,
        stockMg: 1,
        maxPpt: 1,
        reorderMg: 0,
        description: "Nope.",
      })
    ).rejects.toThrow(/role does not allow/i);
  });
});

describe("membership", () => {
  it("refuses to remove the last owner", async () => {
    await expect(
      changeRole({
        houseId: fixture.houseId,
        actorId: fixture.users.owner,
        membershipId: fixture.memberships.owner,
        role: "PERFUMER",
      })
    ).rejects.toThrow(/at least one owner/i);
  });

  it("changes another member's role and audits it", async () => {
    await changeRole({
      houseId: fixture.houseId,
      actorId: fixture.users.owner,
      membershipId: fixture.memberships.lab,
      role: "EVALUATOR",
    });
    const membership = await prisma.membership.findUniqueOrThrow({
      where: { id: fixture.memberships.lab },
    });
    expect(membership.role).toBe("EVALUATOR");
    expect(
      await prisma.auditEvent.count({
        where: { action: "membership.role_changed", entityId: fixture.memberships.lab },
      })
    ).toBe(1);
  });

  it("refuses a non-owner changing roles", async () => {
    await expect(
      changeRole({
        houseId: fixture.houseId,
        actorId: fixture.users.perfumer,
        membershipId: fixture.memberships.lab,
        role: "EVALUATOR",
      })
    ).rejects.toThrow(/role does not allow/i);
  });
});
