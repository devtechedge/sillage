import { describe, expect, it } from "vitest";
import { diffLines } from "@/domain/diff";
import { line } from "../fixtures";

describe("diffLines", () => {
  it("marks added, removed, changed and same", () => {
    const from = [line("A", 100), line("B", 200), line("C", 300)];
    const to = [line("A", 120), line("C", 300), line("D", 80)];
    const result = diffLines(from, to);
    expect(result.find((entry) => entry.code === "A")?.status).toBe("changed");
    expect(result.find((entry) => entry.code === "A")?.delta).toBe(20);
    expect(result.find((entry) => entry.code === "B")?.status).toBe("removed");
    expect(result.find((entry) => entry.code === "B")?.delta).toBe(-200);
    expect(result.find((entry) => entry.code === "C")?.status).toBe("same");
    expect(result.find((entry) => entry.code === "D")?.status).toBe("added");
  });

  it("sorts by material code", () => {
    const result = diffLines([line("C", 10)], [line("A", 10), line("B", 10)]);
    expect(result.map((entry) => entry.code)).toEqual(["A", "B", "C"]);
  });

  it("handles two empty versions", () => {
    expect(diffLines([], [])).toEqual([]);
  });

  it("treats a moved part as a delta on both sides", () => {
    const result = diffLines([line("A", 100, { id: "a" })], [line("A", 140, { id: "a" })]);
    expect(result[0].fromPpt).toBe(100);
    expect(result[0].toPpt).toBe(140);
    expect(result[0].delta).toBe(40);
  });
});
