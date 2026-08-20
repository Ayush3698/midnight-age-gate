/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIDNIGHT_NETWORK?: string;
  readonly VITE_AGE_GATE_CONTRACT_ADDRESS?: string;
  readonly VITE_MIDNIGHT_INDEXER_URL?: string;
  readonly VITE_MIDNIGHT_PROOF_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}