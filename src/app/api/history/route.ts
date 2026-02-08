import { NextResponse } from "next/server";
import { fetchStablecoinHistory, resolveDefiLlamaId } from "@/lib/defillama";
import { STABLECOINS } from "@/lib/config";
import { HistoryResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const entries = await Promise.allSettled(
    STABLECOINS.map(async (sc) => {
      const id = await resolveDefiLlamaId(sc.symbol);
      if (!id) return { symbol: sc.symbol, data: [] };
      const data = await fetchStablecoinHistory(id);
      return { symbol: sc.symbol, data };
    })
  );

  const response: HistoryResponse = {};
  for (const entry of entries) {
    if (entry.status === "fulfilled") {
      response[entry.value.symbol.toLowerCase()] = entry.value.data;
    }
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
