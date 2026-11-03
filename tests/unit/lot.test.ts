import { describe, expect, it } from "vitest";
import { isLotCode, LOT_ALPHABET, lotCode } from "@/domain/lot";

describe("lotCode", () => {
  it("formats a readable lot code", () => {
    expect(lotCode(new Date("2026-11-03T10:00:00Z"), () => 0)).toBe("SV-2611-2222");
  });

  it("uses the house timezone for the month boundary", () => {
    const beforeMidnightUtc = new Date("2026-10-31T19:00:00Z");
    expect(lotCode(beforeMidnightUtc, () => 0, "Asia/Kolkata")).toMatch(/^SV-2611-/);
    expect(lotCode(beforeMidnightUtc, () => 0, "UTC")).toMatch(/^SV-2610-/);
  });

  it("never emits ambiguous characters", () => {
    const code = lotCode(new Date("2026-01-15T00:00:00Z"), (max) => max - 1);
    expect(code).toBe("SV-2601-ZZZZ");
    for (const char of code.slice(8)) {
      expect(LOT_ALPHABET).toContain(char);
    }
  });

  it("validates its own output", () => {
    const code = lotCode(new Date("2026-06-01T00:00:00Z"), () => 3);
    expect(isLotCode(code)).toBe(true);
    expect(isLotCode("SV-26-ABCD")).toBe(false);
    expect(isLotCode("XX-2606-ABCD")).toBe(false);
    expect(isLotCode("SV-2606-ABCI")).toBe(false);
  });
});
