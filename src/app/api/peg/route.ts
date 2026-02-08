import { NextResponse } from "next/server";
import { fetchStablecoinOverviews } from "@/lib/defillama";
import { STABLECOINS } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  try {
    const symbols = STABLECOINS.map((s) => s.symbol);
    const overviews = await fetchStablecoinOverviews(symbols);

    const response = {
      data: overviews.map((o) => ({
        symbol: o.symbol,
        price: o.price,
        change24h: o.change1d ?? 0,
        change1d: o.change1d,
        change7d: o.change7d,
        change1m: o.change1m,
        totalSupply: o.totalSupply,
      })),
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
