export const DEMO_PASSWORD = "SillageDemo!2026";

export const DEMO_ACCOUNTS = [
  {
    email: "owner@sillage.demo",
    name: "Camille Roux",
    role: "OWNER",
    label: "Owner",
    blurb: "The house, the people, the final word.",
  },
  {
    email: "maya@sillage.demo",
    name: "Maya Sethi",
    role: "PERFUMER",
    label: "Perfumer",
    blurb: "Composes formulas and submits versions.",
  },
  {
    email: "jules@sillage.demo",
    name: "Jules Marchand",
    role: "EVALUATOR",
    label: "Evaluator",
    blurb: "Scores trials, approves or returns.",
  },
  {
    email: "noa@sillage.demo",
    name: "Noa Iyer",
    role: "LAB",
    label: "Lab",
    blurb: "Materials, intake and production.",
  },
] as const;

export const OUTSIDER_EMAIL = "rival@sillage.demo";

export function isDemoEmail(email: string): boolean {
  return DEMO_ACCOUNTS.some((account) => account.email === email.toLowerCase());
}
