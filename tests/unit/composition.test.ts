import { describe, expect, it } from "vitest";
import { compose, partPercent } from "@/domain/composition";
import { line, material } from "../fixtures";

describe("compose", () => {
  it("returns an empty composition for no lines", () => {
    const result = compose([]);
    expect(result.totalPpt).toBe(0);
    expect(result.noteShare).toEqual({ TOP: 0, HEART: 0, BASE: 0 });
    expect(result.dominantFamily).toBeNull();
  });

  it("keeps shares against 1000 even when the draft is short", () => {
    const result = compose([
      line("BERG", 200, { note: "TOP", family: "citrus" }),
      line("CEDA", 300, { note: "BASE", family: "wood" }),
    ]);
    expect(result.totalPpt).toBe(500);
    expect(result.noteShare.TOP).toBe(20);
    expect(result.noteShare.BASE).toBe(30);
    expect(result.noteShare.HEART).toBe(0);
  });

  it("sums note and family parts", () => {
    const result = compose([
      line("BERG", 100, { note: "TOP", family: "citrus" }),
      line("NERO", 150, { note: "TOP", family: "floral" }),
      line("ORRI", 250, { note: "HEART", family: "powdery" }),
      line("CEDA", 500, { note: "BASE", family: "wood" }),
    ]);
    expect(result.totalPpt).toBe(1000);
    expect(result.notePpt).toEqual({ TOP: 250, HEART: 250, BASE: 500 });
    expect(result.familyShare.wood).toBe(50);
    expect(result.dominantFamily).toBe("wood");
  });

  it("breaks equal family ties alphabetically", () => {
    const result = compose([
      line("A", 500, { family: "wood" }),
      line("B", 500, { family: "citrus" }),
    ]);
    expect(result.dominantFamily).toBe("citrus");
  });

  it("ignores non-positive and non-integer parts", () => {
    const result = compose([
      line("A", 0),
      line("B", -20),
      line("C", 12.5),
      line("D", 100),
    ]);
    expect(result.totalPpt).toBe(100);
  });

  it("formats a part as a one-decimal percentage", () => {
    expect(partPercent(1)).toBe(0.1);
    expect(partPercent(125)).toBe(12.5);
    expect(partPercent(1000)).toBe(100);
  });

  it("counts only known notes", () => {
    const result = compose([line("A", 100, { note: "MIDDLE" })]);
    expect(result.totalPpt).toBe(100);
    expect(result.notePpt).toEqual({ TOP: 0, HEART: 0, BASE: 0 });
  });

  it("keeps a material with an empty family distinct", () => {
    const result = compose([line("A", 100, { family: "" })]);
    expect(result.familyShare[""]).toBe(10);
    expect(result.dominantFamily).toBe("");
  });

  it("rounds only at the display boundary", () => {
    const result = compose([
      materialLine("A", 333, "citrus", "TOP"),
      materialLine("B", 333, "wood", "BASE"),
      materialLine("C", 334, "musk", "BASE"),
    ]);
    expect(result.noteShare.TOP).toBe(33.3);
    expect(result.noteShare.BASE).toBe(66.7);
    expect(result.noteShare.TOP + result.noteShare.BASE).toBe(100);
  });
});

function materialLine(code: string, ppt: number, family: string, note: string) {
  return { ppt, material: material({ id: code, code, name: code, family, note }) };
}
