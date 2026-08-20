/**
 * Thin wallet/contract connector for the Age Gate dApp.
 *
 * Midnight wallets inject an Initial API under `window.midnight`, keyed
 * by a UUID (not a fixed name) — a DApp enumerates and picks one.
 * As of DApp Connector API v3+ (verified against the real
 * @midnight-ntwrk/dapp-connector-api package types), the initial API's
 * connection method is `connect(networkId): Promise<ConnectedAPI>`, and
 * the connected API exposes `getUnshieldedAddress()` etc. Some older
 * wallet builds still only implement the pre-v3 `enable()` + `state()`
 * shape, so this connector tries the modern API first and falls back.
 * (https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api,
 *  https://docs.midnight.network/api-reference/dapp-connector)
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

/** Modern (v3+) connected API — just the pieces this connector needs. */
interface ConnectedAPIv3 {
  getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
}

/** Older (pre-v3, e.g. early Lace builds) connected API shape. */
interface ConnectedAPILegacy {
  state(): Promise<{ address: string }>;
}

/** Union of initial-API shapes a wallet might inject. */
interface InjectedWalletAPI {
  rdns?: string;
  name?: string;
  connect?: (networkId: string) => Promise<ConnectedAPIv3>;
  enable?: () => Promise<ConnectedAPILegacy>;
}

declare global {
  interface Window {
    midnight?: Record<string, InjectedWalletAPI>;
  }
}

export function isWalletAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.midnight &&
    Object.keys(window.midnight).length > 0
  );
}

/** Finds an injected wallet without assuming a fixed key name. */
function findInjectedWallet(): InjectedWalletAPI | null {
  if (typeof window === "undefined" || !window.midnight) return null;
  const wallets = Object.values(window.midnight);
  return wallets[0] ?? null;
}

/**
 * Which network ID to hint when connecting. NetworkId is just a plain
 * string in the real API (no fixed enum) — 'preprod' matches what
 * wallets like 1AM show as "PRE" in their UI. Override via the
 * VITE_MIDNIGHT_NETWORK env var (see frontend/.env.example) if your
 * wallet is set to a different network (e.g. 'testnet', 'undeployed').
 */
const NETWORK_ID = import.meta.env.VITE_MIDNIGHT_NETWORK ?? "preprod";

/**
 * Real connector: opens the browser wallet extension via its injected
 * API and asks the user to approve the connection.
 *
 * NOTE: connecting a wallet this way works as soon as *any* Midnight
 * wallet extension is installed and unlocked — it does not require a
 * deployed contract. Actually *submitting a proof* against a real
 * contract does require one (see README "Deploying for real"). Until
 * then, `submitEligibilityProof` here still runs through the local
 * ledger-model mirror so the UI stays fully interactive — only wallet
 * connection itself is "real" at this stage.
 */
export function createLiveConnector(threshold = 18): AgeGateConnector {
  let state = initLedger(threshold);
  let connected: WalletConnection | null = null;

  return {
    async connectWallet() {
      const wallet = findInjectedWallet();
      if (!wallet) {
        throw new Error(
          "No Midnight wallet extension detected. Install one (e.g. 1AM or Lace Midnight Preview), unlock it, and reload this page."
        );
      }

      if (typeof wallet.connect === "function") {
        // Modern API (v3+, e.g. 1AM's DApp Connector v4).
        const api = await wallet.connect(NETWORK_ID); // <-- pops the extension's approval dialog
        const { unshieldedAddress } = await api.getUnshieldedAddress();
        connected = { address: unshieldedAddress };
        return connected;
      }

      if (typeof wallet.enable === "function") {
        // Legacy pre-v3 API.
        const api = await wallet.enable(); // <-- pops the extension's approval dialog
        const walletState = await api.state();
        connected = { address: walletState.address };
        return connected;
      }

      throw new Error(
        "Detected a wallet at window.midnight, but it implements neither connect() nor enable(). Check the wallet extension's version."
      );
    },
    async getPublicState() {
      return state;
    },
    async submitEligibilityProof(dateOfBirth: string) {
      if (!connected) throw new Error("connect wallet first");
      const age = computeAge(dateOfBirth);
      state = verifyEligibility(state, connected.address, age);
      return {
        txHash: `0x${Math.random().toString(16).slice(2, 10)}…local-mirror`,
        state,
      };
    },
    async checkEligible(address: string) {
      return isEligible(state, address);
    },
  };
}

/**
 * Mock connector: simulates the exact state transitions the real
 * contract performs (via the ledger-model mirror) so the UI, and this
 * demo, are fully interactive even with no wallet extension installed
 * at all — used as a fallback so the app is still demoable.
 *
 * TODO before mainnet/testnet submission: once a contract is deployed,
 * replace `submitEligibilityProof`'s local mirror call with real calls
 * into `@midnight-ntwrk/midnight-js-contracts` against your deployed
 * contract address, using `createAgeGateWitnesses` from
 * `contract/src/witnesses.ts` as the witness provider.
 */
export function createMockConnector(threshold = 18): AgeGateConnector {
  let state = initLedger(threshold);
  let connected: WalletConnection | null = null;

  return {
    async connectWallet() {
      // Simulated address — used only when no real wallet is installed.
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