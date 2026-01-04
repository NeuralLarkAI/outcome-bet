import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { MarketCard } from "../components/MarketCard";
import { createMarket, enterSide, fetchMarket } from "../lib/solana/yesnoClient";
import { SOLANA_RPC } from "../lib/solana/config";

import "@solana/wallet-adapter-react-ui/styles.css";

type AssetKey = "BTC" | "ETH" | "SHIB" | "DOGE";
type AssetName = "Bitcoin" | "Ethereum" | "Shiba Inu" | "Dogecoin";

const LS_KEY = "YESNO_MARKETS_DEVNET_MAP_V2";

const TABS: { key: AssetKey; label: string; assetName: AssetName; strikeText: string }[] = [
  { key: "BTC", label: "BTC/USD", assetName: "Bitcoin", strikeText: "$75,000" },
  { key: "ETH", label: "ETH/USD", assetName: "Ethereum", strikeText: "$4,000" },
  { key: "SHIB", label: "SHIB/USD", assetName: "Shiba Inu", strikeText: "$0.00001" },
  { key: "DOGE", label: "DOGE/USD", assetName: "Dogecoin", strikeText: "$0.30" },
];

type MarketMap = Partial<Record<AssetKey, string>>;

function loadMarketMap(): MarketMap {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMarketMap(map: MarketMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

// Next Friday @ 12:00 UTC
function nextFridayNoonUTC(): number {
  const now = new Date();
  // build a UTC date
  const utcNow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));

  // 0=Sun ... 5=Fri
  const day = utcNow.getUTCDay();
  const daysUntilFri = (5 - day + 7) % 7 || 7; // if today is Fri, use next week
  const target = new Date(utcNow);
  target.setUTCDate(target.getUTCDate() + daysUntilFri);
  target.setUTCHours(12, 0, 0, 0);

  return Math.floor(target.getTime() / 1000);
}

function formatUTCForQuestion(d: Date) {
  // "Friday at 12:00 UTC"
  const weekday = d.toLocaleString("en-US", { weekday: "long", timeZone: "UTC" });
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${weekday} at ${hh}:${mm} UTC`;
}

function statusToResolved(market: any) {
  const s = market.status;
  if (!s || typeof s !== "object") return { resolved: false, outcome: null as any };

  const key = Object.keys(s)[0];
  if (key === "open") return { resolved: false, outcome: null };
  if (key === "settledYes") return { resolved: true, outcome: "YES" };
  if (key === "settledNo") return { resolved: true, outcome: "NO" };
  return { resolved: false, outcome: null };
}

export default function IndexPage() {
  const wallet = useWallet();

  const connection = useMemo(() => new Connection(SOLANA_RPC, "confirmed"), []);

  const [active, setActive] = useState<AssetKey>("BTC");
  const [marketMap, setMarketMap] = useState<MarketMap>(() => loadMarketMap());
  const [marketAccounts, setMarketAccounts] = useState<Partial<Record<AssetKey, any>>>({});
  const [loading, setLoading] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [solBalance, setSolBalance] = useState<number>(0);

  const hasAllMarkets =
    !!marketMap.BTC && !!marketMap.ETH && !!marketMap.SHIB && !!marketMap.DOGE;

  // Fetch SOL balance
  const refreshBalance = async () => {
    if (!wallet.publicKey) {
      setSolBalance(0);
      return;
    }
    const lamports = await connection.getBalance(wallet.publicKey, "confirmed");
    setSolBalance(lamports / 1e9);
  };

  // Load market accounts from chain
  const refreshMarkets = async () => {
    if (!wallet.connected) return;

    const updates: Partial<Record<AssetKey, any>> = {};
    for (const tab of TABS) {
      const addr = marketMap[tab.key];
      if (!addr) continue;
      const acct = await fetchMarket(wallet, new PublicKey(addr));
      updates[tab.key] = acct;
    }
    setMarketAccounts(updates);
  };

  useEffect(() => {
    if (!wallet.connected) {
      setMarketAccounts({});
      setSolBalance(0);
      return;
    }
    (async () => {
      try {
        await refreshBalance();
        await refreshMarkets();
      } catch (e: any) {
        console.error(e);
        setStatusLine(e?.message || "Failed to load wallet/markets");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.connected]);

  // If marketMap changes while connected, reload accounts
  useEffect(() => {
    if (!wallet.connected) return;
    (async () => {
      try {
        await refreshMarkets();
      } catch (e: any) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.connected, JSON.stringify(marketMap)]);

  const createFourMarkets = async () => {
    if (!wallet.connected) return;

    setLoading(true);
    setStatusLine("");

    try {
      const settleTs = nextFridayNoonUTC();

      const nextMap: MarketMap = {};

      for (const tab of TABS) {
        setStatusLine(`Creating ${tab.label} market...`);
        const id = await createMarket(wallet, tab.assetName, settleTs, 100);
        nextMap[tab.key] = id;
      }

      saveMarketMap(nextMap);
      setMarketMap(nextMap);
      setStatusLine("Markets created ✅");

      // Refresh on-chain state + balance
      await refreshMarkets();
      await refreshBalance();
    } catch (e: any) {
      console.error(e);
      setStatusLine(e?.message || "Failed to create markets");
    } finally {
      setLoading(false);
    }
  };

  const resetMarkets = () => {
    localStorage.removeItem(LS_KEY);
    setMarketMap({});
    setMarketAccounts({});
    setStatusLine("Reset ✅");
  };

  const handleTakeSide = async (side: "YES" | "NO", amountSol: number) => {
    if (!wallet.connected) return;

    const addr = marketMap[active];
    if (!addr) {
      setStatusLine("No market address found. Create markets first.");
      return;
    }

    setLoading(true);
    setStatusLine("");

    try {
      setStatusLine(`Submitting ${side} for ${amountSol} SOL...`);
      const sig = await enterSide(wallet, new PublicKey(addr), side, amountSol);
      setStatusLine(`Submitted ✅ ${sig}`);

      await refreshMarkets();
      await refreshBalance();
    } catch (e: any) {
      console.error(e);
      setStatusLine(e?.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  // Build the card for the active market
  const activeTab = TABS.find((t) => t.key === active)!;
  const activeMarketAddr = marketMap[active];
  const activeAccount = marketAccounts[active];

  const card = useMemo(() => {
    if (!activeAccount) return null;

    const yesPoolSol = Number(activeAccount.yesPoolLamports) / 1e9;
    const noPoolSol = Number(activeAccount.noPoolLamports) / 1e9;
    const total = Math.max(yesPoolSol + noPoolSol, 0.000000001);

    const yesPct = (yesPoolSol / total) * 100;
    const noPct = (noPoolSol / total) * 100;

    const payoutPerSolYes = yesPoolSol > 0 ? total / yesPoolSol : 0;
    const payoutPerSolNo = noPoolSol > 0 ? total / noPoolSol : 0;

    const settleDate = new Date(Number(activeAccount.settleTs) * 1000);
    const settleText = formatUTCForQuestion(settleDate);

    const { resolved, outcome } = statusToResolved(activeAccount);

    // This matches your “other one” style question
    const question = `Will ${activeTab.key} be above ${activeTab.strikeText} on ${settleText}?`;

    const marketForCard: any = {
      question,
      targetAsset: activeTab.key,
      settlementDate: settleDate,
      yesPool: yesPoolSol,
      noPool: noPoolSol,
      resolved,
      outcome,
    };

    const walletForCard: any = {
      connected: wallet.connected,
      balance: solBalance, // ✅ real balance so amount validation works
    };

    return {
      marketForCard,
      walletForCard,
      yesPct,
      noPct,
      payoutPerSolYes,
      payoutPerSolNo,
      total,
    };
  }, [activeAccount, activeTab.key, activeTab.strikeText, wallet.connected, solBalance]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Markets</h2>
          <p className="text-sm text-muted-foreground">
            Yes/No outcome markets on Solana devnet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WalletMultiButton />
          {wallet.connected && (
            <div className="text-xs text-muted-foreground">
              Balance: <span className="text-foreground font-semibold">{solBalance.toFixed(4)} SOL</span>
            </div>
          )}
          {wallet.connected && !hasAllMarkets && (
            <button
              onClick={createFourMarkets}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              Create 4 Markets
            </button>
          )}
          {wallet.connected && (
            <button
              onClick={resetMarkets}
              className="px-4 py-2 rounded-xl bg-secondary text-foreground font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {statusLine && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm">
          {statusLine}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        {TABS.map((t) => {
          const has = !!marketMap[t.key];
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={[
                "px-4 py-2 rounded-full text-sm font-semibold border transition",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 text-foreground border-border hover:bg-secondary",
                !has ? "opacity-70" : "",
              ].join(" ")}
              title={!has ? "Market not created yet" : ""}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <div className="mt-6">
        {!wallet.connected && (
          <div className="rounded-xl border border-border bg-secondary/30 px-4 py-6 text-sm">
            Connect your wallet to load markets.
          </div>
        )}

        {wallet.connected && !activeMarketAddr && (
          <div className="rounded-xl border border-border bg-secondary/30 px-4 py-6 text-sm">
            Market not created yet for <b>{activeTab.label}</b>. Click <b>Create 4 Markets</b>.
          </div>
        )}

        {wallet.connected && activeMarketAddr && !activeAccount && (
          <div className="rounded-xl border border-border bg-secondary/30 px-4 py-6 text-sm">
            Loading market...
          </div>
        )}

        {wallet.connected && card && (
          <MarketCard
            market={card.marketForCard}
            wallet={card.walletForCard}
            yesPercentage={card.yesPct}
            noPercentage={card.noPct}
            payoutPerSol={{ yes: card.payoutPerSolYes, no: card.payoutPerSolNo }}
            onTakeSide={(side: any, amount: number) => handleTakeSide(side, amount)}
            onConnectWallet={() => {}}
            calculatePayout={(side: any, amount: number) => {
              const yesPoolSol = card.marketForCard.yesPool;
              const noPoolSol = card.marketForCard.noPool;
              const total = Math.max(yesPoolSol + noPoolSol, 0.000000001);
              const pool = side === "YES" ? yesPoolSol : noPoolSol;
              if (pool <= 0) return 0;
              return amount * (total / pool);
            }}
          />
        )}
      </div>
    </div>
  );
}
