import { describe, it, expect } from "vitest";
import {
  initLedger,
  verifyEligibility,
  isEligible,
  EligibilityError,
} from "../src/ledger-model";

describe("age gate ledger model", () => {
  it("initializes with a public threshold and zero verified wallets", () => {
    const state = initLedger(18);
    expect(state.threshold).toBe(18);
    expect(state.verifiedCount).toBe(0);
  });

  it("marks a wallet eligible and increments the public counter when age meets threshold", () => {
    const state = initLedger(18);
    const next = verifyEligibility(state, "wallet_a", 21);
    expect(isEligible(next, "wallet_a")).toBe(true);
    expect(next.verifiedCount).toBe(1);
  });

  it("rejects a wallet whose age is below the threshold, revealing nothing but pass/fail", () => {
    const state = initLedger(18);
    expect(() => verifyEligibility(state, "wallet_b", 15)).toThrow(
      EligibilityError
    );
  });

  it("does not double-count a wallet that verifies twice", () => {
    let state = initLedger(18);
    state = verifyEligibility(state, "wallet_c", 30);
    state = verifyEligibility(state, "wallet_c", 30);
    expect(state.verifiedCount).toBe(1);
  });

  it("keeps unrelated wallets marked ineligible until they verify", () => {
    const state = initLedger(18);
    expect(isEligible(state, "wallet_never_verified")).toBe(false);
  });

  it("never stores an age value anywhere in public state", () => {
    const state = initLedger(18);
    const next = verifyEligibility(state, "wallet_d", 42);
    const serialized = JSON.stringify(
      Array.from(next.eligible.entries())
    );
    expect(serialized).not.toContain("42");
  });
});
