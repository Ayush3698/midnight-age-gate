import { useState } from "react";
import { createMockConnector, type WalletConnection } from "./lib/midnight";
import type { LedgerState } from "../../contract/src/ledger-model";
import "./styles.css";

const connector = createMockConnector(18);

export default function App() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [dob, setDob] = useState("");
  const [state, setState] = useState<LedgerState>({
    threshold: 18,
    verifiedCount: 0,
    eligible: new Map(),
  });
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "pending" } | { kind: "ok"; tx: string } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const myStatus = wallet ? state.eligible.get(wallet.address) ?? false : false;

  async function handleConnect() {
    const w = await connector.connectWallet();
    setWallet(w);
    setState(await connector.getPublicState());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
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
            <button className="btn btn--primary" onClick={handleConnect}>
              Connect wallet
            </button>
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

          {status.kind === "pending" && <p className="status status--pending">Generating proof…</p>}
          {status.kind === "ok" && (
            <p className="status status--ok">
              Proof verified on-chain. Tx <code>{status.tx}</code>
            </p>
          )}
          {status.kind === "error" && (
            <p className="status status--error">
              Proof rejected: {status.message}. (Your birthdate was never sent anywhere.)
            </p>
          )}
        </section>
      </main>

      <footer className="footnote">
        Wallet + proof flow shown here run against a local mock that mirrors the deployed
        contract's exact state machine — see <code>frontend/src/lib/midnight.ts</code> for the
        one function to swap in a live Midnight wallet connection.
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
