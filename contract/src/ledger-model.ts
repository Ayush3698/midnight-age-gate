/**
 * Pure TypeScript mirror of the age-gate.compact state machine.
 *
 * WHY THIS EXISTS: circuit tests that go through real proof generation
 * need the Midnight compact compiler + proof server, which aren't
 * available in every environment (including this build sandbox). This
 * mirror lets us unit-test the *logic* of the contract quickly and
 * deterministically. It intentionally matches the circuit's behavior
 * field-for-field so a mismatch here is a signal to check the .compact
 * file. It is NOT a substitute for integration-testing against the
 * compiled contract before you submit — see contract/test/README.md.
 */

export interface LedgerState {
  threshold: number;
  verifiedCount: number;
  eligible: Map<string, boolean>;
}

export function initLedger(minimumAge: number): LedgerState {
  return { threshold: minimumAge, verifiedCount: 0, eligible: new Map() };
}

export class EligibilityError extends Error {}

/**
 * Mirrors `verifyEligibility()`. Throws if the private age fails the
 * public threshold check, exactly like the circuit's `assert` would
 * cause proof generation to fail.
 */
export function verifyEligibility(
  state: LedgerState,
  caller: string,
  age: number
): LedgerState {
  if (age < state.threshold) {
    throw new EligibilityError("does not meet the minimum age requirement");
  }
  const next: LedgerState = {
    threshold: state.threshold,
    verifiedCount: state.verifiedCount,
    eligible: new Map(state.eligible),
  };
  if (!next.eligible.get(caller)) {
    next.eligible.set(caller, true);
    next.verifiedCount += 1;
  }
  return next;
}

export function isEligible(state: LedgerState, wallet: string): boolean {
  return state.eligible.get(wallet) ?? false;
}
