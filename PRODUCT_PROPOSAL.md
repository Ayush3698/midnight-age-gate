# Product Proposal — Age / Eligibility Gate

**Idea list category:** Age / Eligibility Gate
**Cycle:** Half Moon (Level 3) — production-hardening cycle

## Problem

Almost every age- or threshold-gated flow on the web today (alcohol
sales, adult content, credit eligibility, age-restricted governance
votes) works by making the user hand over more information than the
check actually requires — a full ID, a birthdate, sometimes a scanned
document — to prove a single yes/no fact: "are you over X?"

## Proposal

A minimal Midnight contract, **Age Gate**, that lets a wallet prove
`age >= threshold` via a zero-knowledge circuit. The chain only ever
records: the public threshold, a running count of wallets that have
passed, and a per-wallet boolean. The birthdate and computed age exist
only on the user's device, inside the proof-generation step.

## Why this fits Midnight's model

This is close to the canonical "selective disclosure" example:
exactly one bit of information (pass/fail) is disclosed publicly, and
the private witness (age) that produced it is provably correct without
being revealed. It generalizes directly to any threshold check —
credit score minimums, KYC-lite gating, reputation thresholds — without
changing the shape of the circuit.

## Scope for this cycle

In scope:
- `initialize(threshold)` and `verifyEligibility()` circuits
- Public ledger: threshold, verified count, per-wallet eligibility map
- Frontend: wallet connect, local-only DOB entry, proof submission,
  live public-state display
- Unit tests for the private witness logic and the contract's state
  machine
- CI pipeline compiling/type-checking and running tests on every push

Out of scope for this cycle (candidates for a future cycle):
- Revoking eligibility (e.g. if a threshold changes)
- Multiple simultaneous threshold "tiers" (e.g. 13+/18+/21+) in one
  contract
- On-chain expiry of a verification (re-prove after N days)

## Success criteria

- A wallet with `age >= threshold` can submit a proof and see its
  status flip to eligible.
- A wallet with `age < threshold` cannot produce a passing proof.
- An observer reading the public ledger can state the threshold and
  count, and look up any wallet's pass/fail — and nothing else.
