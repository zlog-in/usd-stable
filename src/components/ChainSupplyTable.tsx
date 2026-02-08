"use client";

import { useState } from "react";
import { ChainSupply, Stablecoin } from "@/lib/types";
import { formatSupply, formatSupplyFull, truncateAddress } from "@/lib/format";
import ChainIcon from "./ChainIcon";

interface ChainSupplyTableProps {
  token: Stablecoin;
  chains: ChainSupply[];
}

export default function ChainSupplyTable({
  token,
  chains,
}: ChainSupplyTableProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"supply" | "name">("supply");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const maxSupply = Math.max(
    ...chains.map((c) => c.supply ?? 0),
    1
  );

  const sorted = [...chains].sort((a, b) => {
    if (sortBy === "supply") {
      const diff = (a.supply ?? 0) - (b.supply ?? 0);
      return sortDir === "desc" ? -diff : diff;
    }
    const diff = a.chainName.localeCompare(b.chainName);
    return sortDir === "desc" ? -diff : diff;
  });

  function handleSort(col: "supply" | "name") {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir(col === "supply" ? "desc" : "asc");
    }
  }

  async function copyAddress(addr: string) {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddress(addr);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  const accentColor = token === "USDT" ? "var(--accent-usdt)" : "var(--accent-usdc)";
  const sortArrow = (col: "supply" | "name") => {
    if (sortBy !== col) return "";
    return sortDir === "desc" ? " \u2193" : " \u2191";
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
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
              <th className="py-3 px-4 font-medium w-[200px] hidden md:table-cell">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((chain) => {
              const sharePercent =
                chain.supply !== null
                  ? ((chain.supply / maxSupply) * 100).toFixed(1)
                  : 0;
              const explorerLink = `${chain.explorerUrl}${chain.explorerAddressPath}${chain.contractAddress}`;

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
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${sharePercent}%`,
                          backgroundColor: accentColor,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
