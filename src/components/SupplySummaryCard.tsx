"use client";

import { Stablecoin, ChainSupply, PegData } from "@/lib/types";
import { formatSupply, formatSupplyFull, formatPercent } from "@/lib/format";
import { getStablecoinColor } from "@/lib/config";

interface SupplySummaryCardProps {
  token: Stablecoin;
  chains: ChainSupply[];
  pegData?: PegData;
  supplyChange?: { change1d: number | null; change7d: number | null };
}

export default function SupplySummaryCard({
  token,
  chains,
  pegData,
  supplyChange,
}: SupplySummaryCardProps) {
  const totalSupply = chains.reduce((sum, c) => sum + (c.supply ?? 0), 0);
  const chainsReporting = chains.filter((c) => c.supply !== null).length;
  const color = getStablecoinColor(token);

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted mb-1">
            Total {token} Supply ({chainsReporting}/{chains.length} chains)
          </div>
          <div className="text-3xl font-bold" style={{ color }}>
            {formatSupply(totalSupply)}
          </div>
          <div className="text-sm text-muted mt-1">
            {formatSupplyFull(totalSupply)}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {pegData && (
            <div className="text-right">
              <div className="text-xs text-muted mb-0.5">Peg</div>
              <div
                className={`text-lg font-bold ${
                  Math.abs(pegData.price - 1) > 0.005
                    ? Math.abs(pegData.price - 1) > 0.02
                      ? "text-red-400"
                      : "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                ${pegData.price.toFixed(4)}
              </div>
            </div>
          )}
          {supplyChange?.change1d != null && (
            <div className="text-right">
              <div className="text-xs text-muted mb-0.5">24h</div>
              <div
                className={`text-lg font-bold ${
                  supplyChange.change1d > 0
                    ? "text-green-400"
                    : supplyChange.change1d < 0
                    ? "text-red-400"
                    : "text-muted"
                }`}
              >
                {formatPercent(supplyChange.change1d)}
              </div>
            </div>
          )}
          {supplyChange?.change7d != null && (
            <div className="text-right">
              <div className="text-xs text-muted mb-0.5">7d</div>
              <div
                className={`text-lg font-bold ${
                  supplyChange.change7d > 0
                    ? "text-green-400"
                    : supplyChange.change7d < 0
                    ? "text-red-400"
                    : "text-muted"
                }`}
              >
                {formatPercent(supplyChange.change7d)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
