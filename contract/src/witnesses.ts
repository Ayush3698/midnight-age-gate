/**
 * Private state + witness implementation for the Age Gate contract.
 *
 * This is the off-chain half of the privacy model: the user's date of
 * birth lives ONLY here, in local/private state on their own device.
 * It is fed into the circuit as a witness at proof-generation time and
 * never serialized into a transaction, never sent to a node, and never
 * written to the public ledger.
 */

export interface AgeGatePrivateState {
  /** ISO-8601 date string, e.g. "2001-03-14". Kept fully local. */
  dateOfBirth: string;
}

export const initialPrivateState = (
  dateOfBirth: string
): AgeGatePrivateState => ({ dateOfBirth });

/**
 * Computes whole years of age as of "now". Pure function, unit-testable
 * without touching the chain or the ZK toolchain.
 */
export function computeAge(dateOfBirth: string, now: Date = new Date()): number {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    throw new Error(`Invalid date of birth: ${dateOfBirth}`);
  }
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

/**
 * Witness map handed to the Midnight contract runtime when generating a
 * proof. `userAge` here mirrors the `witness userAge(): Uint<8>` circuit
 * declaration in age-gate.compact.
 */
export const createAgeGateWitnesses = (privateState: AgeGatePrivateState) => ({
  userAge: (): bigint => {
    const age = computeAge(privateState.dateOfBirth);
    if (age < 0 || age > 255) {
      throw new Error("age out of supported Uint<8> range");
    }
    return BigInt(age);
  },
});
