import { describe, expect, it } from "vitest";
import { tenacityHours } from "@/domain/tenacity";
import { line } from "../fixtures";

describe("tenacityHours", () => {
  it("returns zero for an empty formula", () => {
    expect(tenacityHours([], 2000)).toBe(0);
  });

  it("weights persistence by parts", () => {
    const result = tenacityHours(
      [
        line("A", 500, { persistenceHours: 10 }),
        line("B", 500, { persistenceHours: 20 }),
      ],
      2000
    );
    expect(result).toBe(15);
  });

  it("lifts the estimate with concentration", () => {
    const atTwelve = tenacityHours([line("A", 1000, { persistenceHours: 10 })], 1200);
    const atTwentyFive = tenacityHours([line("A", 1000, { persistenceHours: 10 })], 2500);
    expect(atTwelve).toBe(9.2);
    expect(atTwentyFive).toBe(10.5);
  });

  it("caps the estimate at 48 hours", () => {
    const result = tenacityHours([line("A", 1000, { persistenceHours: 72 })], 2500);
    expect(result).toBe(48);
  });

  it("rounds to one decimal", () => {
    const result = tenacityHours(
      [
        line("A", 333, { persistenceHours: 7 }),
        line("B", 667, { persistenceHours: 11 }),
      ],
      2000
    );
    expect(result).toBe(9.7);
  });

  it("ignores zero parts", () => {
    const result = tenacityHours(
      [line("A", 0, { persistenceHours: 40 }), line("B", 1000, { persistenceHours: 5 })],
      2000
    );
    expect(result).toBe(5);
  });
});
