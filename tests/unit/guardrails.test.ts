import { describe, expect, it } from "vitest";
import { canSubmit, guardrails } from "@/domain/guardrails";
import { line } from "../fixtures";

const targets = { top: 25, heart: 45, base: 30 };
const ceiling = 6000;

describe("guardrails", () => {
  it("blocks an empty formula", () => {
    const result = guardrails([], 2000, ceiling, targets);
    expect(result.some((guardrail) => guardrail.code === "EMPTY")).toBe(true);
  });

  it("blocks a total that is not 1000", () => {
    const result = guardrails(
      [
        line("A", 250, { note: "TOP", maxPpt: 500 }),
        line("B", 400, { note: "HEART", maxPpt: 500 }),
        line("C", 300, { note: "BASE", maxPpt: 500 }),
      ],
      2000,
      ceiling,
      targets
    );
    expect(result.some((guardrail) => guardrail.code === "TOTAL")).toBe(true);
    expect(result.some((guardrail) => guardrail.severity === "blocking")).toBe(true);
  });

  it("blocks a material above the house maximum", () => {
    const result = guardrails(
      [
        line("A", 500, { note: "TOP", maxPpt: 100 }),
        line("B", 250, { note: "HEART", maxPpt: 500 }),
        line("C", 250, { note: "BASE", maxPpt: 500 }),
      ],
      2000,
      ceiling,
      targets
    );
    const cap = result.find((guardrail) => guardrail.code === "CAP");
    expect(cap?.severity).toBe("blocking");
    expect(cap?.message).toContain("100");
  });

  it("warns when the cost is over the brief ceiling", () => {
    const result = guardrails(
      [
        line("A", 500, { note: "TOP", maxPpt: 500, costCentsPerGram: 1000 }),
        line("B", 250, { note: "HEART", maxPpt: 500 }),
        line("C", 250, { note: "BASE", maxPpt: 500 }),
      ],
      2000,
      100,
      targets
    );
    expect(result.some((guardrail) => guardrail.code === "COST")).toBe(true);
  });

  it("warns about a missing note", () => {
    const result = guardrails(
      [
        line("A", 500, { note: "TOP", maxPpt: 500 }),
        line("B", 500, { note: "BASE", maxPpt: 500 }),
      ],
      2000,
      ceiling,
      targets
    );
    expect(result.some((guardrail) => guardrail.code === "EMPTY_HEART")).toBe(true);
  });

  it("passes a compliant formula with no blockers", () => {
    const result = guardrails(
      [
        line("A", 250, { note: "TOP", maxPpt: 500, costCentsPerGram: 10 }),
        line("B", 450, { note: "HEART", maxPpt: 500, costCentsPerGram: 10 }),
        line("C", 300, { note: "BASE", maxPpt: 500, costCentsPerGram: 10 }),
      ],
      2000,
      ceiling,
      targets
    );
    expect(result.filter((guardrail) => guardrail.severity === "blocking")).toEqual([]);
  });
});

describe("canSubmit", () => {
  it("accepts exactly 1000 parts and three materials", () => {
    expect(
      canSubmit([
        line("A", 333, { note: "TOP" }),
        line("B", 333, { note: "HEART" }),
        line("C", 334, { note: "BASE" }),
      ])
    ).toBe(true);
  });

  it("rejects 999 parts", () => {
    expect(canSubmit([line("A", 333), line("B", 333), line("C", 333)])).toBe(false);
  });

  it("rejects 1001 parts", () => {
    expect(canSubmit([line("A", 333), line("B", 333), line("C", 335)])).toBe(false);
  });

  it("rejects fewer than three materials", () => {
    expect(canSubmit([line("A", 500), line("B", 500)])).toBe(false);
  });

  it("accepts four materials", () => {
    expect(canSubmit([line("A", 250), line("B", 250), line("C", 250), line("D", 250)])).toBe(true);
  });
});
