/**
 * Thin wallet/contract connector for the Age Gate dApp.
 *
 * A real Midnight wallet (e.g. Lace) injects itself at
 * `window.midnight.mnLace` and exposes `enable()`, `state()`, etc. per
 * the DApp Connector API. That wiring is straightforward but requires
 * a live browser + extension to test, so it's written here behind a
 * small interface with a mock fallback — swap `mockConnector` for a
 * real implementation once you have the wallet extension installed
 * and your contract deployed (see README "Deploying" section).
 */

import { initLedger, verifyEligibility, isEligible, type LedgerState } from "../../../contract/src/ledger-model";
import { computeAge } from "../../../contract/src/witnesses";

export interface WalletConnection {
  address: string;
}

export interface AgeGateConnector {
  connectWallet(): Promise<WalletConnection>;
  getPublicState(): Promise<LedgerState>;
  submitEligibilityProof(dateOfBirth: string): Promise<{ txHash: string; state: LedgerState }>;
  checkEligible(address: string): Promise<boolean>;
}

declare global {
  interface Window {
    midnight?: Record<string, unknown>;
  }
}

export function isWalletAvailable(): boolean {
  return typeof window !== "undefined" && !!window.midnight;
}

/**
 * Mock connector: simulates the exact state transitions the real
 * contract performs (via the ledger-model mirror) so the UI, and this
 * demo, are fully interactive without a live testnet connection.
 *
 * TODO before mainnet/testnet submission: replace with calls into
 * `@midnight-ntwrk/midnight-js-contracts` against your deployed
 * contract address, using `createAgeGateWitnesses` from
 * `contract/src/witnesses.ts` as the witness provider.
 */
export function createMockConnector(threshold = 18): AgeGateConnector {
  let state = initLedger(threshold);
  let connected: WalletConnection | null = null;

  return {
    async connectWallet() {
      // Simulated address — a real integration reads this from the
      // wallet's `state()` call after `enable()`.
      connected = { address: `wallet_${Math.random().toString(16).slice(2, 10)}` };
      return connected;
    },
    async getPublicState() {
      return state;
    },
    async submitEligibilityProof(dateOfBirth: string) {
      if (!connected) throw new Error("connect wallet first");
      const age = computeAge(dateOfBirth);
      state = verifyEligibility(state, connected.address, age);
      return {
        txHash: `0x${Math.random().toString(16).slice(2, 10)}…mock`,
        state,
      };
    },
    async checkEligible(address: string) {
      return isEligible(state, address);
    },
  };
}
