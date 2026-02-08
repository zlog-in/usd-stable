"use client";

import { Stablecoin } from "@/lib/types";
import { STABLECOINS } from "@/lib/config";

interface HeaderProps {
  activeToken: Stablecoin;
  onTokenChange: (token: Stablecoin) => void;
  lastUpdated: number | null;
  showComparison: boolean;
  onToggleComparison: () => void;
}

export default function Header({
  activeToken,
  onTokenChange,
  lastUpdated,
  showComparison,
  onToggleComparison,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Stablecoin Supply Tracker
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {lastUpdated ? (
              <span>
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            ) : (
              <span>Loading...</span>
            )}
          </div>
        </div>

        <button
          onClick={onToggleComparison}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            showComparison
              ? "bg-white/10 border-white/20 text-foreground"
              : "border-card-border text-muted hover:text-foreground hover:border-white/20"
          }`}
        >
          {showComparison ? "Single View" : "Compare All"}
        </button>
      </div>

      {!showComparison && (
        <div className="flex gap-1 bg-card-bg border border-card-border rounded-lg p-1 overflow-x-auto">
          {STABLECOINS.map((sc) => (
            <button
              key={sc.symbol}
              onClick={() => onTokenChange(sc.symbol)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeToken === sc.symbol
                  ? "text-white"
                  : "text-muted hover:text-foreground"
              }`}
              style={
                activeToken === sc.symbol
                  ? { backgroundColor: sc.color }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: sc.color,
                  display: activeToken === sc.symbol ? "none" : "block",
                }}
              />
              {sc.symbol}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
