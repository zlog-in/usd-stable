import { NextResponse } from "next/server";
import { fetchChainBreakdown, resolveDefiLlamaId } from "@/lib/defillama";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "symbol parameter required" }, { status: 400 });
  }

  try {
    const id = await resolveDefiLlamaId(symbol);
    if (!id) {
      return NextResponse.json({ error: `Unknown stablecoin: ${symbol}` }, { status: 404 });
    }

    const breakdown = await fetchChainBreakdown(id);

    const changes: Record<string, { change24h: number | null; change7d: number | null }> = {};
    for (const item of breakdown) {
      changes[item.chain] = {
        change24h: item.change24h,
        change7d: item.change7d,
      };
    }

    return NextResponse.json(
      { breakdown, changes },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
