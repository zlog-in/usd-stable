"use client";

import { Stablecoin, ChainSupply } from "@/lib/types";
import { formatSupply, formatSupplyFull } from "@/lib/format";

interface SupplySummaryCardProps {
  token: Stablecoin;
  chains: ChainSupply[];
}

export default function SupplySummaryCard({
  token,
  chains,
}: SupplySummaryCardProps) {
  const totalSupply = chains.reduce((sum, c) => sum + (c.supply ?? 0), 0);
  const chainsReporting = chains.filter((c) => c.supply !== null).length;
  const accentClass =
    token === "USDT" ? "text-accent-usdt" : "text-accent-usdc";

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <div className="text-sm text-muted mb-1">
        Total {token} Supply ({chainsReporting}/{chains.length} chains)
      </div>
      <div className={`text-3xl font-bold ${accentClass}`}>
        {formatSupply(totalSupply)}
      </div>
      <div className="text-sm text-muted mt-1">
        {formatSupplyFull(totalSupply)}
      </div>
    </div>
  );
}
