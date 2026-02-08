import { NextResponse } from "next/server";
import { ALL_CHAINS } from "@/lib/config";
import { fetchSupply } from "@/lib/rpc";
import { ChainSupply, SupplyResponse } from "@/lib/types";

export const revalidate = 60;

export async function GET() {
  const results = await Promise.allSettled(
    ALL_CHAINS.map(async (chain) => {
      const supply = await fetchSupply(chain);
      return {
        chainId: chain.id,
        chainName: chain.name,
        token: chain.token,
        supply,
        color: chain.color,
        contractAddress: chain.contractAddress,
        explorerUrl: chain.explorerUrl,
        explorerAddressPath: chain.explorerAddressPath,
      } satisfies ChainSupply;
    })
  );

  const data: ChainSupply[] = results.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    const chain = ALL_CHAINS[i];
    return {
      chainId: chain.id,
      chainName: chain.name,
      token: chain.token,
      supply: null,
      error: result.reason?.message || "Failed to fetch",
      color: chain.color,
      contractAddress: chain.contractAddress,
      explorerUrl: chain.explorerUrl,
      explorerAddressPath: chain.explorerAddressPath,
    };
  });

  const response: SupplyResponse = {
    data,
    timestamp: Date.now(),
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
