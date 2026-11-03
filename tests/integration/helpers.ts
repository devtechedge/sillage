import { prisma } from "@/lib/db";

export const TABLES = [
  "audit_event",
  "stock_entry",
  "batch",
  "trial",
  "formula_line",
  "formula_version",
  "formula",
  "brief",
  "material",
  "session",
  "membership",
  "user",
  "house",
];

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`
  );
}

export interface Fixture {
  houseId: string;
  rivalHouseId: string;
  users: {
    owner: string;
    perfumer: string;
    evaluator: string;
    lab: string;
    outsider: string;
  };
  memberships: {
    owner: string;
    perfumer: string;
    evaluator: string;
    lab: string;
    outsider: string;
  };
  materials: Record<string, string>;
  briefId: string;
}

export async function createFixture(): Promise<Fixture> {
  const house = await prisma.house.create({
    data: { name: "Test House", slug: `test-${Date.now()}`, currency: "USD", timezone: "Asia/Kolkata" },
  });
  const rival = await prisma.house.create({
    data: { name: "Rival House", slug: `rival-${Date.now()}`, currency: "USD", timezone: "Asia/Kolkata" },
  });

  const users: Fixture["users"] = {
    owner: "",
    perfumer: "",
    evaluator: "",
    lab: "",
    outsider: "",
  };
  const memberships: Fixture["memberships"] = {
    owner: "",
    perfumer: "",
    evaluator: "",
    lab: "",
    outsider: "",
  };

  const roles = [
    ["owner", "OWNER", house.id],
    ["perfumer", "PERFUMER", house.id],
    ["evaluator", "EVALUATOR", house.id],
    ["lab", "LAB", house.id],
    ["outsider", "EVALUATOR", rival.id],
  ] as const;

  for (const [key, role, houseId] of roles) {
    const user = await prisma.user.create({
      data: {
        email: `${key}-${Date.now()}-${Math.random()}@test.local`,
        name: key,
        passwordHash: "unused",
      },
    });
    const membership = await prisma.membership.create({
      data: { houseId, userId: user.id, role },
    });
    users[key] = user.id;
    memberships[key] = membership.id;
  }

  const materials: Record<string, string> = {};
  const specs = [
    ["A", "Alpha", "citrus", "TOP", 10, 2, 1000, 1_000_000],
    ["B", "Beta", "floral", "HEART", 20, 8, 1000, 1_000_000],
    ["C", "Gamma", "wood", "BASE", 30, 20, 1000, 1_000_000],
    ["D", "Delta", "musk", "BASE", 40, 24, 1000, 1_000_000],
  ] as const;
  for (const [code, name, family, note, cost, persistence, maxPpt, stock] of specs) {
    const material = await prisma.material.create({
      data: {
        houseId: house.id,
        code,
        name,
        family,
        note,
        costCentsPerGram: cost,
        persistenceHours: persistence,
        stockMg: stock,
        maxPpt,
        reorderMg: 5000,
        description: `${name} test material.`,
      },
    });
    materials[code] = material.id;
  }

  const brief = await prisma.brief.create({
    data: {
      houseId: house.id,
      title: "Test brief",
      client: "Test client",
      body: "A clean test brief with a powdery heart.",
      targetFamilies: ["powdery"],
      targetTop: 25,
      targetHeart: 45,
      targetBase: 30,
      costCeilingCents: 10_000,
      status: "OPEN",
      createdById: users.owner,
    },
  });

  return { houseId: house.id, rivalHouseId: rival.id, users, memberships, materials, briefId: brief.id };
}

export function lines(fixture: Fixture, parts: [string, number][]) {
  return parts.map(([code, ppt]) => ({ materialId: fixture.materials[code], ppt }));
}

export const BALANCED: [string, number][] = [
  ["A", 250],
  ["B", 450],
  ["C", 200],
  ["D", 100],
];
