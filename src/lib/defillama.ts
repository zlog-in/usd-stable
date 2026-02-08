import { HistoryPoint } from "./types";

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

// DefiLlama stablecoin IDs
export const DEFILLAMA_IDS = {
  USDT: 1, // Tether
  USDC: 2, // USD Coin
} as const;
