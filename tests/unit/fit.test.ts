import { describe, expect, it } from "vitest";
import { briefFit } from "@/domain/fit";
import { line } from "../fixtures";

const targets = { top: 25, heart: 45, base: 30 };

describe("briefFit", () => {
  it("returns 100 for an exact match", () => {
    const result = briefFit(
      [
        line("A", 250, { note: "TOP" }),
        line("B", 450, { note: "HEART" }),
        line("C", 300, { note: "BASE" }),
      ],
      targets
    );
    expect(result).toBe(100);
  });

  it("loses fit when the formula is short", () => {
    const result = briefFit(
      [
        line("A", 250, { note: "TOP" }),
        line("B", 450, { note: "HEART" }),
      ],
      targets
    );
    expect(result).toBe(85);
  });

  it("penalises a note in the wrong place", () => {
    const result = briefFit(
      [
        line("A", 450, { note: "TOP" }),
        line("B", 250, { note: "HEART" }),
        line("C", 300, { note: "BASE" }),
      ],
      targets
    );
    expect(result).toBe(80);
  });

  it("clamps at zero", () => {
    const result = briefFit([line("A", 1000, { note: "BASE" })], {
      top: 100,
      heart: 0,
      base: 0,
    });
    expect(result).toBe(0);
  });

  it("returns a one-decimal score", () => {
    const result = briefFit(
      [
        line("A", 200, { note: "TOP" }),
        line("B", 400, { note: "HEART" }),
        line("C", 300, { note: "BASE" }),
      ],
      targets
    );
    expect(result).toBe(95);
  });
});
