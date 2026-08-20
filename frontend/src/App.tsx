import { useState } from "react";
import {
  createLiveConnector,
  createMockConnector,
  isWalletAvailable,
  type WalletConnection,
  type AgeGateConnector,
} from "./lib/midnight";
import type { LedgerState } from "../../contract/src/ledger-model";
import "./styles.css";

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "ok"; tx: string }
  | { kind: "error"; message: string };

export default function App() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [connector, setConnector] = useState<AgeGateConnector | null>(null);
  const [mode, setMode] = useState<"live" | "mock" | null>(null);
  const [dob, setDob] = useState("");
  const [state, setState] = useState<LedgerState>({
    threshold: 18,
    verifiedCount: 0,
    eligible: new Map(),
  });
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  const myStatus = wallet ? state.eligible.get(wallet.address) ?? false : false;

  async function handleConnect() {
    setStatus({ kind: "pending" });
    if (isWalletAvailable()) {
      try {
        const live = createLiveConnector(18);
        const w = await live.connectWallet(); // pops the extension's approval dialog
        setConnector(live);
        setWallet(w);
        setState(await live.getPublicState());
        setMode("live");
        setStatus({ kind: "idle" });
        return;
      } catch (err) {
        setStatus({ kind: "error", message: (err as Error).message });
        return;
      }
    }
    // No wallet extension detected — fall back to the in-browser demo mode.
    const mock = createMockConnector(18);
    const w = await mock.connectWallet();
    setConnector(mock);
    setWallet(w);
    setState(await mock.getPublicState());
    setMode("mock");
    setStatus({ kind: "idle" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet || !connector) return;
    setStatus({ kind: "pending" });
    try {
      const { txHash, state: next } = await connector.submitEligibilityProof(dob);
      setState(next);
      setStatus({ kind: "ok", tx: txHash });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <p className="eyebrow">Midnight Builder Challenge · Level 3 · Waning Gibbous</p>
        <h1>Age Gate</h1>
        <p className="lede">
          Prove you meet a minimum age, without the network ever learning your birthdate —
          or your exact age.
        </p>
      </header>

      <MoonDivider />

      <main className="panels">
        <section className="panel panel--lit" aria-label="Public ledger state">
          <h2>What the network can see</h2>
          <dl className="stat-list">
            <div className="stat">
              <dt>Minimum age required</dt>
              <dd>{state.threshold}</dd>
            </div>
            <div className="stat">
              <dt>Wallets verified so far</dt>
              <dd>{state.verifiedCount}</dd>
            </div>
            <div className="stat">
              <dt>Your wallet's status</dt>
              <dd>
                <span className={`badge ${myStatus ? "badge--pass" : "badge--pending"}`}>
                  {wallet ? (myStatus ? "Eligible" : "Not yet verified") : "No wallet connected"}
                </span>
              </dd>
            </div>
          </dl>
          <p className="fine-print">
            This is the entirety of what's public: a threshold, a count, and a yes/no per
            wallet. No birthdate, no age, ever appears here.
          </p>
        </section>

        <section className="panel panel--shadow" aria-label="Private local state">
          <h2>What stays on your device</h2>

          {!wallet ? (
            <>
              <button className="btn btn--primary" onClick={handleConnect}>
                Connect wallet
              </button>
              <p className="hint">
                {isWalletAvailable()
                  ? "A Midnight wallet extension was detected — this will open it and ask you to approve the connection."
                  : "No Midnight wallet extension detected in this browser. Install the Lace Midnight Preview extension and reload to connect for real — otherwise this runs in local demo mode."}
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="form">
              <label htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
              <p className="hint">
                This value is read locally to build a zero-knowledge proof, then discarded.
                It is never included in the transaction sent to Midnight.
              </p>
              <button className="btn btn--primary" type="submit" disabled={!dob}>
                Generate proof &amp; submit
              </button>
            </form>
          )}

          {wallet && mode && (
            <p className="status status--pending">
              {mode === "live"
                ? `Connected to your wallet extension · ${wallet.address}`
                : `Demo mode (no wallet extension found) · ${wallet.address}`}
            </p>
          )}

          {status.kind === "pending" && !wallet && <p className="status status--pending">Connecting…</p>}
          {status.kind === "ok" && (
            <p className="status status--ok">
              Proof verified on-chain. Tx <code>{status.tx}</code>
            </p>
          )}
          {status.kind === "error" && (
            <p className="status status--error">
              {status.message}
            </p>
          )}
        </section>
      </main>

      <footer className="footnote">
        {mode === "live"
          ? "Wallet connection is live via your installed extension. Proof submission still runs against a local state mirror until a contract is deployed — see README."
          : "Wallet + proof flow shown here run against a local mock that mirrors the deployed contract's exact state machine — see frontend/src/lib/midnight.ts."}
      </footer>
    </div>
  );
}

function MoonDivider() {
  return (
    <div className="moon-divider" role="presentation">
      <svg viewBox="0 0 120 120" width="72" height="72">
        <defs>
          <clipPath id="litHalf">
            <rect x="60" y="0" width="60" height="120" />
          </clipPath>
        </defs>
        <circle cx="60" cy="60" r="54" fill="#171B2C" stroke="#3A4166" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="54" fill="#F1EDE4" clipPath="url(#litHalf)" />
      </svg>
      <div className="moon-divider__labels">
        <span>disclosed</span>
        <span>withheld</span>
      </div>
    </div>
  );
}