# Contract tests

Two layers of tests live here:

1. **`witnesses.test.ts`** — tests the pure age-computation logic that
   feeds the circuit's `userAge()` witness. No blockchain or proof
   generation involved; fast and deterministic.
2. **`ledger-model.test.ts`** — tests `ledger-model.ts`, a plain
   TypeScript mirror of the state transitions declared in
   `age-gate.compact` (threshold check, verified-count increment,
   per-wallet eligibility map). This lets the CI pipeline validate the
   *logic* on every push without requiring the full Midnight proof
   server.

## Before you submit

Run the actual circuit through the Midnight toolchain and add an
integration test against the compiled contract:

```bash
npx compact compile contract/src/age-gate.compact contract/build
npx compact test    # or your project's integration test runner
```

If the compiler flags any syntax differences from what's in
`age-gate.compact` (Compact's syntax has moved between testnet
releases), fix those in the `.compact` file and re-run this test
suite to confirm the TS mirror still matches the corrected logic.
