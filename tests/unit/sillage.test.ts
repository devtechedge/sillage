import { describe, expect, it } from "vitest";
import { sillageIndex } from "@/domain/sillage";
import { line } from "../fixtures";

describe("sillageIndex", () => {
  it("returns zero for an empty formula", () => {
    expect(sillageIndex([])).toBe(0);
  });

  it("rises with base materials", () => {
    const top = sillageIndex([line("A", 1000, { note: "TOP", family: "citrus" })]);
    const base = sillageIndex([line("B", 1000, { note: "BASE", family: "wood" })]);
    expect(base).toBeGreaterThan(top);
  });

  it("rises with musk", () => {
    const wood = sillageIndex([line("A", 1000, { note: "BASE", family: "wood" })]);
    const musk = sillageIndex([line("A", 1000, { note: "BASE", family: "musk" })]);
    expect(musk).toBeGreaterThan(wood);
  });

  it("stays inside 0 to 100", () => {
    const result = sillageIndex([
      line("A", 500, { note: "BASE", family: "musk" }),
      line("B", 500, { note: "BASE", family: "wood" }),
    ]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it("is stable for the same composition", () => {
    const lines = [
      line("A", 250, { note: "TOP", family: "citrus" }),
      line("B", 450, { note: "HEART", family: "powdery" }),
      line("C", 300, { note: "BASE", family: "musk" }),
    ];
    expect(sillageIndex(lines)).toBe(sillageIndex(lines));
  });
});
