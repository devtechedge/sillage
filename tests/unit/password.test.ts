import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("verifies the original password", async () => {
    const stored = await hashPassword("SillageDemo!2026");
    await expect(verifyPassword("SillageDemo!2026", stored)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const stored = await hashPassword("SillageDemo!2026");
    await expect(verifyPassword("sillageDemo!2026", stored)).resolves.toBe(false);
  });

  it("rejects a malformed hash", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("anything", "scrypt$1$2$3$4")).resolves.toBe(false);
  });

  it("uses a fresh salt each time", async () => {
    const first = await hashPassword("same password");
    const second = await hashPassword("same password");
    expect(first).not.toBe(second);
    await expect(verifyPassword("same password", first)).resolves.toBe(true);
    await expect(verifyPassword("same password", second)).resolves.toBe(true);
  });
});
