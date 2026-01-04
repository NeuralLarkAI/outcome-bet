import { PublicKey, SystemProgram, Keypair, Connection } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PDA_SEEDS } from "./config";
import { getYesNoProgram } from "./program";

type WalletAdapterLike = {
  publicKey: PublicKey | null;
  signTransaction?: (tx: any) => Promise<any>;
  signAllTransactions?: (txs: any[]) => Promise<any[]>;
};

export type MarketInput = {
  // Keep these flexible so your Index.tsx can pass what it already has
  question: string;
  targetAsset: string; // "BTC", "ETH", "SHIB", "DOGE"
  settlementUnix: number; // unix timestamp (seconds)
};

export type MarketAccount = {
  publicKey: PublicKey;
  // add more fields if you want later
};

function requireWallet(wallet: WalletAdapterLike) {
  if (!wallet?.publicKey) throw new Error("Wallet not connected");
  return wallet.publicKey;
}

function pda(seed: string, marketPk: PublicKey, programId: PublicKey) {
  // PDA = findProgramAddress([seed, marketPubkey])
  return PublicKey.findProgramAddressSync(
    [Buffer.from(seed), marketPk.toBuffer()],
    programId
  )[0];
}

function pickMethod(program: any, names: string[]) {
  for (const n of names) {
    if (program?.methods?.[n]) return n;
  }
  throw new Error(
    `Program method not found. Tried: ${names.join(", ")}. Available: ${
      program?.idl?.instructions?.map((i: any) => i.name).join(", ") || "unknown"
    }`
  );
}

function toAnchorBn(n: number) {
  // anchor.BN exists
  return new anchor.BN(n);
}

/**
 * Create a single market on-chain.
 * This generates 3 signer keypairs (market, yesMint, noMint) because your runtime
 * errors showed 3 missing signatures.
 */
export async function createMarket(
  connection: Connection,
  wallet: WalletAdapterLike,
  input: MarketInput
): Promise<MarketAccount> {
  const adminPk = requireWallet(wallet);
  const { program, provider } = getYesNoProgram(connection, wallet);

  // ✅ signer accounts (these are the 3 “missing signatures” you saw)
  const market = Keypair.generate();
  const yesMint = Keypair.generate();
  const noMint = Keypair.generate();

  // ✅ PDAs
  const marketAuthority = pda(PDA_SEEDS.marketAuthority, market.publicKey, program.programId);
  const vault = pda(PDA_SEEDS.vault, market.publicKey, program.programId);

  // Pick correct method name
  const initName = pickMethod(program, ["initialize_market", "initializeMarket"]);

  // Build args:
  // We support both common layouts:
  // 1) (question, targetAsset, settlementUnix)
  // 2) (question, targetAsset, settlementUnix, feeBps)
  //
  // If your program takes a different signature, tell me the exact args from IDL and I’ll adjust.
  const args3 = [input.question, input.targetAsset, toAnchorBn(input.settlementUnix)];
  const args4 = [input.question, input.targetAsset, toAnchorBn(input.settlementUnix), 0]; // feeBps default 0

  // Try 3 args first, fallback to 4
  let ixBuilder: any;
  try {
    ixBuilder = (program.methods as any)[initName](...args3);
  } catch {
    ixBuilder = (program.methods as any)[initName](...args4);
  }

  // IMPORTANT: your IDL accounts list:
  // market, market_authority, yes_mint, no_mint, vault, admin, system_program, token_program
  const txSig = await ixBuilder
    .accounts({
      market: market.publicKey,
      marketAuthority,
      market_authority: marketAuthority, // handle either naming
      yesMint: yesMint.publicKey,
      yes_mint: yesMint.publicKey,
      noMint: noMint.publicKey,
      no_mint: noMint.publicKey,
      vault,
      admin: adminPk,
      systemProgram: SystemProgram.programId,
      system_program: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      token_program: TOKEN_PROGRAM_ID,
    })
    .signers([market, yesMint, noMint]) // ✅ THIS fixes the missing signature set
    .rpc({ skipPreflight: false });

  // eslint-disable-next-line no-console
  console.log("[createMarket] tx=", txSig, "market=", market.publicKey.toBase58());

  return { publicKey: market.publicKey };
}

/**
 * Fetch a market account (best-effort).
 * If you haven’t implemented the account type in IDL properly yet, this won’t crash your UI.
 */
export async function fetchMarket(
  connection: Connection,
  wallet: WalletAdapterLike,
  marketPk: PublicKey
): Promise<any | null> {
  const { program } = getYesNoProgram(connection, wallet);

  // If your IDL has accounts.market, this works.
  // If not, return null instead of nuking the UI.
  try {
    if ((program.account as any)?.market) {
      return await (program.account as any).market.fetch(marketPk);
    }
    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[fetchMarket] failed:", e);
    return null;
  }
}

/**
 * Enter YES/NO side for a market.
 */
export async function enterSide(
  connection: Connection,
  wallet: WalletAdapterLike,
  params: {
    market: PublicKey;
    side: "YES" | "NO";
    amountSol: number; // how much SOL to stake
  }
): Promise<string> {
  const userPk = requireWallet(wallet);
  const { program } = getYesNoProgram(connection, wallet);

  const methodName =
    params.side === "YES"
      ? pickMethod(program, ["enter_yes", "enterYes"])
      : pickMethod(program, ["enter_no", "enterNo"]);

  // Common pattern: amount in lamports or BN SOL?
  // We'll assume lamports (most common). If your program expects SOL as BN, tell me.
  const lamports = Math.floor(params.amountSol * 1_000_000_000);

  // PDAs (same as init)
  const marketAuthority = pda(PDA_SEEDS.marketAuthority, params.market, program.programId);
  const vault = pda(PDA_SEEDS.vault, params.market, program.programId);

  // We also need yes/no mint keys stored on-chain in the market account usually.
  // If your program expects them passed directly, you *must* fetch market state first.
  const marketState = await fetchMarket(connection, wallet, params.market);

  if (!marketState?.yesMint && !marketState?.yes_mint) {
    throw new Error(
      "Market state missing yesMint/noMint. Your program must store mint pubkeys in the market account for enterSide to work."
    );
  }

  const yesMint = (marketState.yesMint || marketState.yes_mint) as PublicKey;
  const noMint = (marketState.noMint || marketState.no_mint) as PublicKey;

  // If your program mints position tokens to the user, you’ll need ATAs.
  // Many programs derive/create ATAs internally; if yours requires passing them, tell me and I’ll wire ATA creation.
  const amountArg = toAnchorBn(lamports);

  const txSig = await (program.methods as any)[methodName](amountArg)
    .accounts({
      market: params.market,
      marketAuthority,
      market_authority: marketAuthority,
      vault,
      user: userPk,
      yesMint,
      yes_mint: yesMint,
      noMint,
      no_mint: noMint,
      systemProgram: SystemProgram.programId,
      system_program: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      token_program: TOKEN_PROGRAM_ID,
    })
    .rpc({ skipPreflight: false });

  return txSig;
}

/**
 * Create the 4 default markets (BTC/ETH/SHIB/DOGE) in one click.
 * This is what you asked for.
 */
export async function createFourMarkets(
  connection: Connection,
  wallet: WalletAdapterLike
): Promise<MarketAccount[]> {
  // settlement: 24 hours from now by default
  const now = Math.floor(Date.now() / 1000);
  const settlement = now + 24 * 60 * 60;

  const markets: MarketInput[] = [
    { question: "Will Bitcoin be higher than it is now at settlement?", targetAsset: "BTC", settlementUnix: settlement },
    { question: "Will Ethereum be higher than it is now at settlement?", targetAsset: "ETH", settlementUnix: settlement },
    { question: "Will Shiba Inu be higher than it is now at settlement?", targetAsset: "SHIB", settlementUnix: settlement },
    { question: "Will Dogecoin be higher than it is now at settlement?", targetAsset: "DOGE", settlementUnix: settlement },
  ];

  const created: MarketAccount[] = [];
  for (const m of markets) {
    const out = await createMarket(connection, wallet, m);
    created.push(out);
  }
  return created;
}
