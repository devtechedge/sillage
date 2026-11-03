import { describe, expect, it } from "vitest";
import { concentrateGramsFor, costPer100mlCents } from "@/domain/cost";
import { line } from "../fixtures";

describe("costPer100mlCents", () => {
  it("charges packaging even for an empty formula", () => {
    expect(costPer100mlCents([], 2000)).toBe(240);
  });

  it("computes a single material at 20 percent", () => {
    const result = costPer100mlCents([line("A", 500, { costCentsPerGram: 100 })], 2000);
    expect(result).toBe(1240);
  });

  it("uses concentration to scale the concentrate", () => {
    const atTwelve = costPer100mlCents([line("A", 1000, { costCentsPerGram: 100 })], 1200);
    const atTwentyFive = costPer100mlCents([line("A", 1000, { costCentsPerGram: 100 })], 2500);
    expect(atTwelve).toBe(1440);
    expect(atTwentyFive).toBe(2740);
  });

  it("rounds the material sum exactly once", () => {
    const result = costPer100mlCents(
      [
        line("A", 333, { costCentsPerGram: 11 }),
        line("B", 333, { costCentsPerGram: 13 }),
        line("C", 334, { costCentsPerGram: 17 }),
      ],
      2000
    );
    expect(result).toBe(513);
  });

  it("ignores zero and negative lines", () => {
    const result = costPer100mlCents(
      [line("A", 0, { costCentsPerGram: 999 }), line("B", 1000, { costCentsPerGram: 1 })],
      2000
    );
    expect(result).toBe(260);
  });

  it("calculates concentrate for a batch", () => {
    expect(concentrateGramsFor(48, 50, 2000)).toBe(480);
    expect(concentrateGramsFor(1, 30, 2500)).toBe(7.5);
  });
});
