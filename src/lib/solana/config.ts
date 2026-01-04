import { PublicKey } from "@solana/web3.js";

// ✅ Your deployed program (the one that now has claim/enter/initialize/resolve in IDL logs)
export const PROGRAM_ID = new PublicKey("9WnqgSWY9UShGnspTmoTSgVJEHo7DNjWvpcSPbJHcKym");

// ✅ Devnet cluster
export const RPC_URL = "https://api.devnet.solana.com";

// ✅ PDA seeds (must match your on-chain program; this matches the “market/vault” pattern we’ve been using)
export const PDA_SEEDS = {
  marketAuthority: "market_authority",
  vault: "vault",
};
