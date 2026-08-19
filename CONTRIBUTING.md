# Contributing / development notes

## Local setup

```bash
npm install
npm --prefix frontend install
npm test
npm --prefix frontend run dev
```

## Commit style

This repo uses conventional-commit-style prefixes (`feat:`, `fix:`,
`test:`, `docs:`, `ci:`, `chore:`) to keep history scannable — helpful
both for reviewers and for the challenge's "meaningful commits"
requirement.

## Before opening a PR

- `npm test` passes locally
- `npx tsc -b` (in `frontend/`) and `npx tsc -p contract/tsconfig.json --noEmit` (root) are clean
- If you touched `age-gate.compact`, re-run it through the Compact
  compiler and update `contract/test/README.md` if behavior changed
