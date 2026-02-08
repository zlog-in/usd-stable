import { NextResponse } from "next/server";
import { fetchStablecoinHistory, DEFILLAMA_IDS } from "@/lib/defillama";
import { HistoryResponse } from "@/lib/types";

export const revalidate = 3600;

export async function GET() {
  const [usdt, usdc] = await Promise.allSettled([
    fetchStablecoinHistory(DEFILLAMA_IDS.USDT),
    fetchStablecoinHistory(DEFILLAMA_IDS.USDC),
  ]);

  const response: HistoryResponse = {
    usdt: usdt.status === "fulfilled" ? usdt.value : [],
    usdc: usdc.status === "fulfilled" ? usdc.value : [],
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
