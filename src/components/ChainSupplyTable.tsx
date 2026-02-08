"use client";

import { useState, useMemo } from "react";
import { ChainSupply, Stablecoin } from "@/lib/types";
import { formatSupply, formatSupplyFull, truncateAddress, formatPercent } from "@/lib/format";
import { getStablecoinColor } from "@/lib/config";
import ChainIcon from "./ChainIcon";

interface ChainChange {
  change24h: number | null;
  change7d: number | null;
}

interface ChainSupplyTableProps {
  token: Stablecoin;
  chains: ChainSupply[];
  changes?: Record<string, ChainChange>;
}

function isEvmChain(chainId: string): boolean {
  // Check if the chain is not one of the known non-EVM types
  const nonEvmPrefixes = [
    "tron-", "solana-", "ton-", "near-", "stellar-", "algorand-",
    "aptos-", "hedera-", "noble-", "polkadot-", "starknet-",
    "sui-", "xrpl-", "liquid-", "tezos-",
  ];
  return !nonEvmPrefixes.some((p) => chainId.startsWith(p));
}

export default function ChainSupplyTable({
  token,
  chains,
  changes,
}: ChainSupplyTableProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"supply" | "name" | "change24h" | "change7d">("supply");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "evm" | "non-evm">("all");

  const totalSupply = chains.reduce((s, c) => s + (c.supply ?? 0), 0);

  const filtered = useMemo(() => {
    let result = chains;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.chainName.toLowerCase().includes(q) ||
          c.contractAddress.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filter === "evm") {
      result = result.filter((c) => isEvmChain(c.chainId));
    } else if (filter === "non-evm") {
      result = result.filter((c) => !isEvmChain(c.chainId));
    }

    return result;
  }, [chains, search, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortBy === "supply") {
        diff = (a.supply ?? 0) - (b.supply ?? 0);
      } else if (sortBy === "name") {
        diff = a.chainName.localeCompare(b.chainName);
      } else if (sortBy === "change24h" && changes) {
        const ac = changes[a.chainName]?.change24h ?? -999;
        const bc = changes[b.chainName]?.change24h ?? -999;
        diff = ac - bc;
      } else if (sortBy === "change7d" && changes) {
        const ac = changes[a.chainName]?.change7d ?? -999;
        const bc = changes[b.chainName]?.change7d ?? -999;
        diff = ac - bc;
      }
      return sortDir === "desc" ? -diff : diff;
    });
  }, [filtered, sortBy, sortDir, changes]);

  function handleSort(col: typeof sortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir(col === "name" ? "asc" : "desc");
    }
  }

  async function copyAddress(addr: string) {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddress(addr);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // fallback
    }
  }

  function exportCSV() {
    const header = "Chain,Contract Address,Supply,Share %,24h Change,7d Change\n";
    const rows = sorted.map((c) => {
      const share = totalSupply > 0 && c.supply ? ((c.supply / totalSupply) * 100).toFixed(2) : "0";
      const ch24 = changes?.[c.chainName]?.change24h;
      const ch7d = changes?.[c.chainName]?.change7d;
      return `"${c.chainName}","${c.contractAddress}",${c.supply ?? ""},${share},${ch24 ?? ""},${ch7d ?? ""}`;
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${token}-supply.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const data = sorted.map((c) => ({
      chain: c.chainName,
      contractAddress: c.contractAddress,
      supply: c.supply,
      share: totalSupply > 0 && c.supply ? (c.supply / totalSupply) * 100 : 0,
      change24h: changes?.[c.chainName]?.change24h ?? null,
      change7d: changes?.[c.chainName]?.change7d ?? null,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${token}-supply.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const accentColor = getStablecoinColor(token);
  const sortArrow = (col: typeof sortBy) => {
    if (sortBy !== col) return "";
    return sortDir === "desc" ? " \u2193" : " \u2191";
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-card-border">
        <input
          type="text"
          placeholder="Search chains..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background border border-card-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/30 transition-colors flex-1 min-w-0"
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-background rounded-lg p-0.5">
            {(["all", "evm", "non-evm"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-card-border text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "evm" ? "EVM" : "Non-EVM"}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={exportCSV}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-muted hover:text-foreground border border-card-border hover:border-white/20 transition-colors"
              title="Export CSV"
            >
              CSV
            </button>
            <button
              onClick={exportJSON}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-muted hover:text-foreground border border-card-border hover:border-white/20 transition-colors"
              title="Export JSON"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-muted text-left">
              <th
                className="py-3 px-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("name")}
              >
                Chain{sortArrow("name")}
              </th>
              <th className="py-3 px-4 font-medium">Contract</th>
              <th
                className="py-3 px-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("supply")}
              >
                Supply{sortArrow("supply")}
              </th>
              {changes && (
                <>
                  <th
                    className="py-3 px-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("change24h")}
                  >
                    24h{sortArrow("change24h")}
                  </th>
                  <th
                    className="py-3 px-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors hidden md:table-cell"
                    onClick={() => handleSort("change7d")}
                  >
                    7d{sortArrow("change7d")}
                  </th>
                </>
              )}
              <th className="py-3 px-4 font-medium w-[160px] hidden lg:table-cell">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((chain) => {
              const sharePercent =
                chain.supply !== null && totalSupply > 0
                  ? (chain.supply / totalSupply) * 100
                  : 0;
              const explorerLink = `${chain.explorerUrl}${chain.explorerAddressPath}${chain.contractAddress}`;
              const ch = changes?.[chain.chainName];

              return (
                <tr
                  key={chain.chainId}
                  className="border-b border-card-border/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <ChainIcon name={chain.chainName} color={chain.color} />
                      <span className="font-medium">{chain.chainName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyAddress(chain.contractAddress)}
                        className="text-muted hover:text-foreground transition-colors font-mono text-xs"
                        title="Copy address"
                      >
                        {copiedAddress === chain.contractAddress
                          ? "Copied!"
                          : truncateAddress(chain.contractAddress)}
                      </button>
                      <a
                        href={explorerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-foreground transition-colors"
                        title="View on explorer"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {chain.supply !== null ? (
                      <div>
                        <div className="font-medium">
                          {formatSupply(chain.supply)}
                        </div>
                        <div className="text-xs text-muted">
                          {formatSupplyFull(chain.supply)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-400 text-xs">
                        {chain.error || "Error"}
                      </span>
                    )}
                  </td>
                  {changes && (
                    <>
                      <td className="py-3 px-4 text-right hidden sm:table-cell">
                        {ch?.change24h != null ? (
                          <span
                            className={`text-xs font-medium ${
                              ch.change24h > 0
                                ? "text-green-400"
                                : ch.change24h < 0
                                ? "text-red-400"
                                : "text-muted"
                            }`}
                          >
                            {formatPercent(ch.change24h)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        {ch?.change7d != null ? (
                          <span
                            className={`text-xs font-medium ${
                              ch.change7d > 0
                                ? "text-green-400"
                                : ch.change7d < 0
                                ? "text-red-400"
                                : "text-muted"
                            }`}
                          >
                            {formatPercent(ch.change7d)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-white/5 rounded-full h-2 flex-1">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(sharePercent, 100)}%`,
                            backgroundColor: accentColor,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted w-10 text-right">
                        {sharePercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-muted border-t border-card-border">
        Showing {sorted.length} of {chains.length} chains
      </div>
    </div>
  );
}
