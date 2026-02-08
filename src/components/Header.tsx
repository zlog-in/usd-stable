"use client";

import { Stablecoin } from "@/lib/types";

interface HeaderProps {
  activeToken: Stablecoin;
  onTokenChange: (token: Stablecoin) => void;
  lastUpdated: number | null;
}

export default function Header({
  activeToken,
  onTokenChange,
  lastUpdated,
}: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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

      <div className="flex gap-1 bg-card-bg border border-card-border rounded-lg p-1">
        <button
          onClick={() => onTokenChange("USDT")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeToken === "USDT"
              ? "bg-accent-usdt text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          USDT
        </button>
        <button
          onClick={() => onTokenChange("USDC")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeToken === "USDC"
              ? "bg-accent-usdc text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          USDC
        </button>
      </div>
    </header>
  );
}
