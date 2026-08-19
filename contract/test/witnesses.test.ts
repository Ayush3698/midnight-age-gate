import { describe, it, expect } from "vitest";
import { computeAge, createAgeGateWitnesses } from "../src/witnesses";

describe("computeAge", () => {
  it("computes a straightforward whole-year age", () => {
    const now = new Date("2026-08-19T00:00:00Z");
    expect(computeAge("2000-01-01", now)).toBe(26);
  });

  it("does not count a birthday that hasn't happened yet this year", () => {
    const now = new Date("2026-08-19T00:00:00Z");
    // Birthday is Dec 1 — hasn't occurred yet in 2026.
    expect(computeAge("2001-12-01", now)).toBe(24);
  });

  it("counts a birthday that already happened this year", () => {
    const now = new Date("2026-08-19T00:00:00Z");
    // Birthday is Jan 1 — already occurred in 2026.
    expect(computeAge("2001-01-01", now)).toBe(25);
  });

  it("throws on an unparseable date of birth", () => {
    expect(() => computeAge("not-a-date")).toThrow();
  });
});

describe("createAgeGateWitnesses", () => {
  it("exposes a userAge witness returning a bigint", () => {
    const witnesses = createAgeGateWitnesses({ dateOfBirth: "1990-06-15" });
    const age = witnesses.userAge();
    expect(typeof age).toBe("bigint");
    expect(age).toBeGreaterThan(30n);
  });

  it("never includes the raw date of birth in the witness output", () => {
    const witnesses = createAgeGateWitnesses({ dateOfBirth: "1990-06-15" });
    const result = witnesses.userAge();
    // The witness function's return value is the ONLY thing that ever
    // crosses into circuit execution — assert it's just a number, with
    // no way to recover the birthdate from it.
    expect(String(result)).not.toContain("1990");
  });
});
