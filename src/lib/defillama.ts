import { HistoryPoint, PegData } from "./types";

const DEFILLAMA_BASE = "https://stablecoins.llama.fi";

interface DefiLlamaChainBalance {
  date: number;
  totalCirculating: {
    peggedUSD: number;
  };
  totalCirculatingUSD: {
    peggedUSD: number;
  };
}

export async function fetchStablecoinHistory(
  stablecoinId: number
): Promise<HistoryPoint[]> {
  const url = `${DEFILLAMA_BASE}/stablecoincharts/all?stablecoin=${stablecoinId}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`DefiLlama API error: ${res.status}`);
  }

  const data: DefiLlamaChainBalance[] = await res.json();

  // Sample weekly points (every 7th entry)
  const weeklyPoints: HistoryPoint[] = [];
  for (let i = 0; i < data.length; i += 7) {
    const point = data[i];
    const date = new Date(point.date * 1000);
    weeklyPoints.push({
      date: date.toISOString().split("T")[0],
      timestamp: point.date,
      totalSupply: point.totalCirculating.peggedUSD,
    });
  }

  // Always include the latest point
  const last = data[data.length - 1];
  if (last) {
    const lastDate = new Date(last.date * 1000).toISOString().split("T")[0];
    const existingLast = weeklyPoints[weeklyPoints.length - 1];
    if (!existingLast || existingLast.date !== lastDate) {
      weeklyPoints.push({
        date: lastDate,
        timestamp: last.date,
        totalSupply: last.totalCirculating.peggedUSD,
      });
    }
  }

  return weeklyPoints;
}

// Hardcoded DefiLlama stablecoin IDs (from /stablecoins endpoint)
export const DEFILLAMA_IDS: Record<string, number> = {
  USDT: 1,
  USDC: 2,
  DAI: 5,
  FDUSD: 79,
  PYUSD: 116,
  GHO: 73,
  USDe: 131,
};

// Cache resolved IDs from the stablecoins list API
let resolvedIds: Record<string, number> | null = null;

export async function resolveDefiLlamaId(symbol: string): Promise<number | null> {
  // Try hardcoded first
  if (DEFILLAMA_IDS[symbol]) return DEFILLAMA_IDS[symbol];

  // Fetch and cache the full list
  if (!resolvedIds) {
    try {
      const res = await fetch(`${DEFILLAMA_BASE}/stablecoins?includePrices=true`, {
        signal: AbortSignal.timeout(10_000),
      });
      const json = await res.json();
      resolvedIds = {};
      for (const asset of json.peggedAssets ?? []) {
        resolvedIds[asset.symbol] = parseInt(asset.id);
      }
    } catch {
      resolvedIds = {};
    }
  }

  return resolvedIds[symbol] ?? DEFILLAMA_IDS[symbol] ?? null;
}

// Fetch peg + supply overview for all stablecoins from DefiLlama
interface DefiLlamaPeggedAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  circulating: { peggedUSD: number };
  circulatingPrevDay: { peggedUSD: number };
  circulatingPrevWeek: { peggedUSD: number };
  circulatingPrevMonth: { peggedUSD: number };
}

function calcChange(current: number, prev: number): number | null {
  if (!prev || prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

export interface StablecoinOverview {
  symbol: string;
  price: number;
  totalSupply: number;
  change1d: number | null;
  change7d: number | null;
  change1m: number | null;
}

export async function fetchStablecoinOverviews(
  symbols: string[]
): Promise<StablecoinOverview[]> {
  const res = await fetch(`${DEFILLAMA_BASE}/stablecoins?includePrices=true`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`DefiLlama error: ${res.status}`);
  const json = await res.json();

  const symbolSet = new Set(symbols.map((s) => s.toUpperCase()));
  const seen = new Set<string>();
  const results: StablecoinOverview[] = [];

  for (const asset of (json.peggedAssets ?? []) as DefiLlamaPeggedAsset[]) {
    const sym = asset.symbol.toUpperCase();
    if (symbolSet.has(sym) && !seen.has(sym)) {
      seen.add(sym);
      const current = asset.circulating?.peggedUSD ?? 0;
      const prevDay = asset.circulatingPrevDay?.peggedUSD ?? 0;
      const prevWeek = asset.circulatingPrevWeek?.peggedUSD ?? 0;
      const prevMonth = asset.circulatingPrevMonth?.peggedUSD ?? 0;

      results.push({
        symbol: asset.symbol,
        price: asset.price ?? 1,
        totalSupply: current,
        change1d: calcChange(current, prevDay),
        change7d: calcChange(current, prevWeek),
        change1m: calcChange(current, prevMonth),
      });
    }
  }

  return results;
}

// Fetch peg data for stablecoins
export async function fetchPegData(symbols: string[]): Promise<PegData[]> {
  const overviews = await fetchStablecoinOverviews(symbols);
  return overviews.map((o) => ({
    symbol: o.symbol,
    price: o.price,
    change24h: o.change1d ?? 0,
  }));
}

// Fetch chain-level breakdown for a stablecoin
export interface ChainBreakdown {
  chain: string;
  supply: number;
  change24h: number | null;
  change7d: number | null;
}

export async function fetchChainBreakdown(
  stablecoinId: number
): Promise<ChainBreakdown[]> {
  const url = `${DEFILLAMA_BASE}/stablecoin/${stablecoinId}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`DefiLlama error: ${res.status}`);
  const json = await res.json();

  const results: ChainBreakdown[] = [];
  const currentBalances = json.currentChainBalances ?? {};
  const chainBalances = json.chainBalances ?? {};

  for (const [chain, balance] of Object.entries(currentBalances)) {
    const balObj = balance as { peggedUSD?: number };
    const current = balObj?.peggedUSD ?? 0;
    if (current <= 0) continue;

    // Calculate 24h and 7d changes from historical data
    let change24h: number | null = null;
    let change7d: number | null = null;
    const tokens = (chainBalances[chain] as { tokens?: Array<{ date: number; circulating: { peggedUSD: number } }> })?.tokens;

    if (tokens && tokens.length > 0) {
      const latest = tokens[tokens.length - 1];
      const now = latest.date;
      const dayAgo = now - 86400;
      const weekAgo = now - 86400 * 7;

      // Find closest point to 24h ago
      const dayPoint = tokens.reduce((prev, curr) =>
        Math.abs(curr.date - dayAgo) < Math.abs(prev.date - dayAgo) ? curr : prev
      );
      if (Math.abs(dayPoint.date - dayAgo) < 86400 * 2) {
        const prev = dayPoint.circulating.peggedUSD;
        if (prev > 0) change24h = ((current - prev) / prev) * 100;
      }

      // Find closest point to 7d ago
      const weekPoint = tokens.reduce((prev, curr) =>
        Math.abs(curr.date - weekAgo) < Math.abs(prev.date - weekAgo) ? curr : prev
      );
      if (Math.abs(weekPoint.date - weekAgo) < 86400 * 2) {
        const prev = weekPoint.circulating.peggedUSD;
        if (prev > 0) change7d = ((current - prev) / prev) * 100;
      }
    }

    results.push({ chain, supply: current, change24h, change7d });
  }

  return results.sort((a, b) => b.supply - a.supply);
}
