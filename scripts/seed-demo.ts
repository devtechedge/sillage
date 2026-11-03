import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client/client";
import { hashPassword } from "../lib/password";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, OUTSIDER_EMAIL } from "../lib/demo";
import { batchDraws } from "../domain/batch";

try {
  process.loadEnvFile();
} catch {
  // CI and Vercel provide the environment directly.
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to seed.");
const database = new URL(url).pathname.replace(/^\//, "");
const allowed =
  process.env.ALLOW_PROD_SEED === "1" ||
  database.includes("test") ||
  database.includes("e2e");
if (!allowed) {
  throw new Error(`Refusing to seed "${database}". Set ALLOW_PROD_SEED=1 for the demo database.`);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const MATERIALS = [
  { code: "BERG", name: "Bergamot", family: "citrus", note: "TOP", costCentsPerGram: 9, persistenceHours: 2, stockMg: 250000, maxPpt: 120, reorderMg: 20000, description: "Cold peel, clean and bright, gone almost before it arrives." },
  { code: "PINK", name: "Pink Pepper", family: "spice", note: "TOP", costCentsPerGram: 12, persistenceHours: 3, stockMg: 120000, maxPpt: 80, reorderMg: 15000, description: "A dry crack of pepper over rose, more texture than heat." },
  { code: "VIOL", name: "Violet Leaf", family: "green", note: "TOP", costCentsPerGram: 55, persistenceHours: 4, stockMg: 60000, maxPpt: 40, reorderMg: 8000, description: "Wet leaves and cold iron, the green edge of a stone courtyard." },
  { code: "NERO", name: "Neroli", family: "floral", note: "TOP", costCentsPerGram: 110, persistenceHours: 3, stockMg: 80000, maxPpt: 60, reorderMg: 8000, description: "Orange blossom held at arm's length, bitter and clean." },
  { code: "HEDI", name: "Hedione", family: "floral", note: "HEART", costCentsPerGram: 32, persistenceHours: 8, stockMg: 300000, maxPpt: 200, reorderMg: 30000, description: "Air and light through jasmine, the quiet body of a modern heart." },
  { code: "ISOE", name: "Iso E Super", family: "wood", note: "HEART", costCentsPerGram: 28, persistenceHours: 12, stockMg: 300000, maxPpt: 250, reorderMg: 30000, description: "Soft cedar shadow, used to give a formula a skin." },
  { code: "ORRI", name: "Orris Butter", family: "powdery", note: "HEART", costCentsPerGram: 1400, persistenceHours: 10, stockMg: 14000, maxPpt: 25, reorderMg: 2500, description: "Cool iris root, butter and chalk, the house's most guarded drawer." },
  { code: "IRIS", name: "Iris Absolute", family: "powdery", note: "HEART", costCentsPerGram: 1800, persistenceHours: 12, stockMg: 10000, maxPpt: 15, reorderMg: 3000, description: "Root and metal, a powder that smells like a locked room." },
  { code: "JASM", name: "Jasmine Grandiflorum", family: "floral", note: "HEART", costCentsPerGram: 620, persistenceHours: 8, stockMg: 90000, maxPpt: 45, reorderMg: 10000, description: "Warm, animal, a flower that has already been awake for hours." },
  { code: "ROSE", name: "Rose de Mai", family: "floral", note: "HEART", costCentsPerGram: 980, persistenceHours: 9, stockMg: 60000, maxPpt: 40, reorderMg: 8000, description: "Petal and pepper, fresh enough to keep the powder from settling." },
  { code: "HELIO", name: "Heliotrope Absolute", family: "powdery", note: "HEART", costCentsPerGram: 420, persistenceHours: 9, stockMg: 50000, maxPpt: 80, reorderMg: 8000, description: "Almond, vanilla and clean linen, the soft centre of a powder accord." },
  { code: "FIG", name: "Fig Leaf Absolute", family: "green", note: "HEART", costCentsPerGram: 260, persistenceHours: 6, stockMg: 30000, maxPpt: 60, reorderMg: 6000, description: "Milky sap and shade, the green heart of a summer afternoon." },
  { code: "CEDA", name: "Cedar Virginia", family: "wood", note: "BASE", costCentsPerGram: 18, persistenceHours: 14, stockMg: 400000, maxPpt: 180, reorderMg: 40000, description: "Pencil shavings and dry resin, a floor for the powder to stand on." },
  { code: "VETI", name: "Vetiver Haiti", family: "wood", note: "BASE", costCentsPerGram: 65, persistenceHours: 18, stockMg: 220000, maxPpt: 100, reorderMg: 20000, description: "Root, smoke and damp earth, worn close to the skin." },
  { code: "SAND", name: "Sandalwood", family: "wood", note: "BASE", costCentsPerGram: 740, persistenceHours: 20, stockMg: 35000, maxPpt: 60, reorderMg: 6000, description: "Creamy wood, a warm hand at the base of the composition." },
  { code: "AMBR", name: "Ambrette Seed", family: "musk", note: "BASE", costCentsPerGram: 380, persistenceHours: 24, stockMg: 80000, maxPpt: 50, reorderMg: 8000, description: "Vegetal musk, pear skin and warm paper." },
  { code: "TONK", name: "Tonka Bean", family: "gourmand", note: "BASE", costCentsPerGram: 120, persistenceHours: 16, stockMg: 180000, maxPpt: 90, reorderMg: 20000, description: "Almond, hay and a spoon of sweetness kept under the desk." },
  { code: "LABD", name: "Labdanum", family: "resin", note: "BASE", costCentsPerGram: 190, persistenceHours: 22, stockMg: 120000, maxPpt: 70, reorderMg: 15000, description: "Sticky resin, leather and sun on a wooden shelf." },
  { code: "OAKM", name: "Oakmoss", family: "moss", note: "BASE", costCentsPerGram: 240, persistenceHours: 20, stockMg: 40000, maxPpt: 30, reorderMg: 5000, description: "Forest floor after rain, bittersweet and slightly mineral." },
  { code: "MUSK", name: "Muscenone", family: "musk", note: "BASE", costCentsPerGram: 210, persistenceHours: 26, stockMg: 150000, maxPpt: 90, reorderMg: 20000, description: "A clean, rounded musk that holds the trail without announcing itself." },
] as const;

const IRIS_V1 = [
  ["VIOL", 120], ["NERO", 60], ["ORRI", 80], ["ROSE", 40], ["CEDA", 300], ["MUSK", 400],
] as const;

const IRIS_V2 = [
  ["BERG", 50], ["VIOL", 60], ["ORRI", 60], ["IRIS", 20], ["JASM", 70], ["CEDA", 300], ["AMBR", 60], ["MUSK", 380],
] as const;

const IRIS_V3 = [
  ["BERG", 100], ["PINK", 50], ["VIOL", 40], ["NERO", 60],
  ["HEDI", 200], ["ORRI", 25], ["IRIS", 15], ["JASM", 45], ["ROSE", 40], ["HELIO", 80], ["FIG", 45],
  ["CEDA", 120], ["VETI", 60], ["SAND", 40], ["AMBR", 30], ["TONK", 25], ["OAKM", 10], ["MUSK", 15],
] as const;

const FIG_V1 = [
  ["BERG", 120], ["PINK", 60], ["VIOL", 40], ["NERO", 60], ["HEDI", 180], ["FIG", 60],
  ["CEDA", 180], ["VETI", 100], ["AMBR", 50], ["MUSK", 80], ["TONK", 70],
] as const;

const AMBER_V1 = [
  ["LABD", 70], ["TONK", 90], ["CEDA", 180], ["MUSK", 90], ["AMBR", 50], ["SAND", 60],
  ["OAKM", 30], ["VETI", 100], ["ROSE", 40], ["JASM", 45], ["NERO", 60], ["BERG", 85], ["PINK", 20],
] as const;

function total(lines: readonly (readonly [string, number])[]): number {
  return lines.reduce((sum, [, ppt]) => sum + ppt, 0);
}

async function main() {
  console.log(`Seeding ${database}.`);

  await prisma.auditEvent.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.trial.deleteMany();
  await prisma.formulaLine.deleteMany();
  await prisma.formulaVersion.deleteMany();
  await prisma.formula.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.material.deleteMany();
  await prisma.session.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.house.deleteMany();

  const house = await prisma.house.create({
    data: { name: "Maison Verre", slug: "maison-verre", currency: "USD", timezone: "Asia/Kolkata" },
  });
  const rival = await prisma.house.create({
    data: { name: "Atelier Noir", slug: "atelier-noir", currency: "USD", timezone: "Asia/Kolkata" },
  });

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const people: Record<string, { id: string }> = {};
  for (const account of DEMO_ACCOUNTS) {
    const user = await prisma.user.create({
      data: { email: account.email, name: account.name, passwordHash },
    });
    await prisma.membership.create({
      data: { houseId: house.id, userId: user.id, role: account.role },
    });
    people[account.role] = user;
  }
  const outsider = await prisma.user.create({
    data: { email: OUTSIDER_EMAIL, name: "Rival Perfumer", passwordHash },
  });
  await prisma.membership.create({
    data: { houseId: rival.id, userId: outsider.id, role: "PERFUMER" },
  });

  const materials: Record<string, { id: string }> = {};
  for (const material of MATERIALS) {
    const row = await prisma.material.create({
      data: {
        houseId: house.id,
        code: material.code,
        name: material.name,
        family: material.family,
        note: material.note,
        costCentsPerGram: material.costCentsPerGram,
        persistenceHours: material.persistenceHours,
        stockMg: material.stockMg,
        maxPpt: material.maxPpt,
        reorderMg: material.reorderMg,
        description: material.description,
      },
    });
    materials[material.code] = row;
  }

  const irisBrief = await prisma.brief.create({
    data: {
      houseId: house.id,
      title: "Iris Cendre",
      client: "Hotel Verre, lobby",
      body: "A cool, powdery iris for a stone lobby. Wet chalk, cold violet leaf, a clean musk trail that stays close. Nothing sweet, nothing loud.",
      targetFamilies: ["powdery", "green", "musk"],
      targetTop: 25,
      targetHeart: 45,
      targetBase: 30,
      costCeilingCents: 6000,
      status: "IN_PROGRESS",
      createdById: people.OWNER.id,
    },
  });
  const figBrief = await prisma.brief.create({
    data: {
      houseId: house.id,
      title: "Fig Leaf Noon",
      client: "Galerie Basse",
      body: "Green shade at noon. Fig leaf, milky sap, sun on gravel. Bright but not sweet, with enough wood to hold the gallery air.",
      targetFamilies: ["green", "floral", "wood"],
      targetTop: 40,
      targetHeart: 35,
      targetBase: 25,
      costCeilingCents: 900,
      status: "OPEN",
      createdById: people.OWNER.id,
    },
  });
  const amberBrief = await prisma.brief.create({
    data: {
      houseId: house.id,
      title: "Amber Registry",
      client: "Private commission, Bombay",
      body: "Old paper, resin, a trace of tobacco. Warm, archive-dark, no vanilla sweetness. A scent for a room with too many books.",
      targetFamilies: ["resin", "wood", "gourmand"],
      targetTop: 15,
      targetHeart: 35,
      targetBase: 50,
      costCeilingCents: 2400,
      status: "OPEN",
      createdById: people.OWNER.id,
    },
  });

  async function createVersion(
    formulaId: string,
    version: number,
    lines: readonly (readonly [string, number])[],
    status: string,
    note: string,
    options: {
      submittedAt?: Date;
      decidedAt?: Date;
      reviewerId?: string;
      decisionNote?: string;
    } = {}
  ) {
    const row = await prisma.formulaVersion.create({
      data: {
        formulaId,
        version,
        status,
        totalPpt: total(lines),
        note,
        createdById: people.PERFUMER.id,
        submittedAt: options.submittedAt,
        reviewerId: options.reviewerId,
        decidedAt: options.decidedAt,
        decisionNote: options.decisionNote,
      },
    });
    await prisma.formulaLine.createMany({
      data: lines.map(([code, ppt]) => ({
        versionId: row.id,
        materialId: materials[code].id,
        ppt,
      })),
    });
    return row;
  }

  const iris = await prisma.formula.create({
    data: {
      houseId: house.id,
      briefId: irisBrief.id,
      name: "No. 07 Iris Cendre",
      concentrationBp: 2000,
      status: "APPROVED",
      createdById: people.PERFUMER.id,
    },
  });
  const irisV1 = await createVersion(iris.id, 1, IRIS_V1, "CHANGES", "First pass. Too much violet leaf, the iris is buried.", {
    submittedAt: new Date("2026-10-08T10:00:00Z"),
    decidedAt: new Date("2026-10-09T09:00:00Z"),
    reviewerId: people.EVALUATOR.id,
    decisionNote: "The violet takes the room. Pull it back and let the orris breathe.",
  });
  const irisV2 = await createVersion(iris.id, 2, IRIS_V2, "CHANGES", "Violet lowered, orris raised. Base is still thin.", {
    submittedAt: new Date("2026-10-12T11:00:00Z"),
    decidedAt: new Date("2026-10-13T08:30:00Z"),
    reviewerId: people.EVALUATOR.id,
    decisionNote: "Closer. Give the base more cedar and musk, and bring the powder forward.",
  });
  const irisV3 = await createVersion(iris.id, 3, IRIS_V3, "APPROVED", "The lobby formula. Chalk, orris, clean musk.", {
    submittedAt: new Date("2026-10-14T07:00:00Z"),
    decidedAt: new Date("2026-10-14T16:00:00Z"),
    reviewerId: people.EVALUATOR.id,
    decisionNote: "Approved. This is the room.",
  });

  await prisma.trial.createMany({
    data: [
      { houseId: house.id, versionId: irisV1.id, evaluatorId: people.EVALUATOR.id, score: 2, tags: ["wet", "violet"], note: "Violet leaf takes the room. Iris never arrives.", createdAt: new Date("2026-10-09T09:10:00Z") },
      { houseId: house.id, versionId: irisV2.id, evaluatorId: people.EVALUATOR.id, score: 3, tags: ["powder", "quiet"], note: "Closer. The orris is there but the base is thin.", createdAt: new Date("2026-10-13T08:40:00Z") },
      { houseId: house.id, versionId: irisV3.id, evaluatorId: people.EVALUATOR.id, score: 5, tags: ["cold", "exact", "stone"], note: "The lobby formula. Chalk, orris, a clean trail.", createdAt: new Date("2026-10-14T16:10:00Z") },
    ],
  });

  const fig = await prisma.formula.create({
    data: {
      houseId: house.id,
      briefId: figBrief.id,
      name: "Fig Leaf No. 2",
      concentrationBp: 1200,
      status: "IN_REVIEW",
      createdById: people.PERFUMER.id,
    },
  });
  const figV1 = await createVersion(fig.id, 1, FIG_V1, "IN_REVIEW", "Green, milky, a little too bright. Sent for a first read.", {
    submittedAt: new Date("2026-11-01T09:00:00Z"),
  });
  await prisma.trial.create({
    data: { houseId: house.id, versionId: figV1.id, evaluatorId: people.EVALUATOR.id, score: 4, tags: ["green", "soapy"], note: "Bright and green. A little soapy in the heart, but close.", createdAt: new Date("2026-11-01T10:20:00Z") },
  });

  const amber = await prisma.formula.create({
    data: {
      houseId: house.id,
      briefId: amberBrief.id,
      name: "Amber Registry study",
      concentrationBp: 2500,
      status: "DRAFT",
      createdById: people.PERFUMER.id,
    },
  });
  await createVersion(amber.id, 1, AMBER_V1, "DRAFT", "First study. The resin is there, the top is still too loud.", {});

  const concentrateGrams = (48 * 50 * 2000) / 10000;
  const draws = batchDraws(
    IRIS_V3.map(([code, ppt]) => ({
      ppt,
      material: {
        id: materials[code].id,
        code,
        name: MATERIALS.find((material) => material.code === code)!.name,
        stockMg: MATERIALS.find((material) => material.code === code)!.stockMg,
      },
    })),
    48,
    50,
    2000
  );
  const batch = await prisma.batch.create({
    data: {
      houseId: house.id,
      versionId: irisV3.id,
      lotCode: "SV-2610-7K2M",
      bottleCount: 48,
      bottleMl: 50,
      status: "MACERATING",
      maceratedUntil: new Date("2026-11-10T00:00:00Z"),
      createdById: people.LAB.id,
      createdAt: new Date("2026-10-20T09:30:00Z"),
    },
  });

  for (const material of MATERIALS) {
    await prisma.stockEntry.create({
      data: {
        houseId: house.id,
        materialId: materials[material.code].id,
        deltaMg: material.stockMg,
        reason: "INTAKE",
        actorId: people.LAB.id,
        createdAt: new Date("2026-10-01T08:00:00Z"),
      },
    });
  }
  for (const draw of draws) {
    await prisma.stockEntry.create({
      data: {
        houseId: house.id,
        materialId: draw.materialId,
        deltaMg: -draw.requiredMg,
        reason: "BATCH",
        batchId: batch.id,
        actorId: people.LAB.id,
        createdAt: new Date("2026-10-20T09:30:00Z"),
      },
    });
    await prisma.material.update({
      where: { id: draw.materialId },
      data: { stockMg: { decrement: draw.requiredMg } },
    });
  }

  const seedAudit = [
    ["formula.created", "formula", iris.id, people.PERFUMER.id, { name: iris.name }, "2026-10-07T09:00:00Z"],
    ["formula.submitted", "formula_version", irisV1.id, people.PERFUMER.id, { version: 1 }, "2026-10-08T10:00:00Z"],
    ["formula.returned", "formula_version", irisV1.id, people.EVALUATOR.id, { version: 1 }, "2026-10-09T09:00:00Z"],
    ["formula.submitted", "formula_version", irisV2.id, people.PERFUMER.id, { version: 2 }, "2026-10-12T11:00:00Z"],
    ["formula.returned", "formula_version", irisV2.id, people.EVALUATOR.id, { version: 2 }, "2026-10-13T08:30:00Z"],
    ["formula.submitted", "formula_version", irisV3.id, people.PERFUMER.id, { version: 3 }, "2026-10-14T07:00:00Z"],
    ["formula.approved", "formula_version", irisV3.id, people.EVALUATOR.id, { version: 3 }, "2026-10-14T16:00:00Z"],
    ["trial.recorded", "trial", irisV3.id, people.EVALUATOR.id, { score: 5 }, "2026-10-14T16:10:00Z"],
    ["batch.produced", "batch", batch.id, people.LAB.id, { lotCode: batch.lotCode, concentrateGrams }, "2026-10-20T09:30:00Z"],
  ] as const;

  for (const [action, entityType, entityId, actorId, detail, createdAt] of seedAudit) {
    await prisma.auditEvent.create({
      data: {
        houseId: house.id,
        actorId,
        action,
        entityType,
        entityId,
        detail,
        createdAt: new Date(createdAt),
      },
    });
  }

  const counts = {
    houses: await prisma.house.count(),
    materials: await prisma.material.count(),
    formulas: await prisma.formula.count(),
    versions: await prisma.formulaVersion.count(),
    trials: await prisma.trial.count(),
    batches: await prisma.batch.count(),
  };
  console.log("Seeded", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
