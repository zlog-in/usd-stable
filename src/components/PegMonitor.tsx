"use client";

import { PegData } from "@/lib/types";
import { STABLECOINS } from "@/lib/config";

interface PegMonitorProps {
  pegData: PegData[];
}

export default function PegMonitor({ pegData }: PegMonitorProps) {
  if (pegData.length === 0) return null;

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-muted mb-3">Peg Monitor</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {STABLECOINS.map((sc) => {
          const data = pegData.find(
            (p) => p.symbol.toUpperCase() === sc.symbol.toUpperCase()
          );
          if (!data) return null;

          const deviation = Math.abs(data.price - 1);
          const isDepegged = deviation > 0.005;
          const priceColor = isDepegged
            ? deviation > 0.02
              ? "text-red-400"
              : "text-yellow-400"
            : "text-green-400";

          return (
            <div
              key={sc.symbol}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: sc.color }}
                />
                <span className="text-xs font-medium">{sc.symbol}</span>
              </div>
              <span className={`text-lg font-bold ${priceColor}`}>
                ${data.price.toFixed(4)}
              </span>
              <span
                className={`text-[10px] ${
                  data.change24h > 0
                    ? "text-green-400"
                    : data.change24h < 0
                    ? "text-red-400"
                    : "text-muted"
                }`}
              >
                {data.change24h > 0 ? "+" : ""}
                {data.change24h.toFixed(2)}% supply 24h
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
