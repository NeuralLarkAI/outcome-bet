import { Connection } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { PROGRAM_ID, RPC_URL } from "./config";

// IMPORTANT: adjust this import if your IDL is in a different path
// You said you have: src/lib/solana/idl/yesno.json
import idl from "./idl/yesno.json";

type WalletAdapterLike = {
  publicKey: import("@solana/web3.js").PublicKey | null;
  signTransaction?: (tx: any) => Promise<any>;
  signAllTransactions?: (txs: any[]) => Promise<any[]>;
};

export function getConnection() {
  return new Connection(RPC_URL, "confirmed");
}

export function getProvider(connection: Connection, wallet: WalletAdapterLike) {
  if (!wallet?.publicKey) throw new Error("Wallet not connected");
  // Anchor expects the wallet adapter shape. Phantom via wallet-adapter works.
  return new anchor.AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export function getYesNoProgram(connection: Connection, wallet: WalletAdapterLike) {
  const provider = getProvider(connection, wallet);

  // DO NOT setProvider globally if you don’t want side-effects,
  // but it’s fine in most SPA apps. We’ll keep it local anyway.
  const program = new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);

  // Helpful debug
  // eslint-disable-next-line no-console
  console.log(
    "[YESNO IDL LOADED] address=",
    (idl as any)?.address || PROGRAM_ID.toBase58(),
    "instructions=",
    (idl as any)?.instructions?.map((i: any) => i.name)
  );

  return { program, provider };
}
