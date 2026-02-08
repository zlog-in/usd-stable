"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stablecoin,
  ChainSupply,
  HistoryPoint,
  TimeRange,
  SupplyResponse,
  HistoryResponse,
} from "@/lib/types";
import Header from "./Header";
import SupplySummaryCard from "./SupplySummaryCard";
import SupplyPieChart from "./SupplyPieChart";
import ChainSupplyTable from "./ChainSupplyTable";
import SupplyChart from "./SupplyChart";
import { SkeletonCard, SkeletonTable, SkeletonChart } from "./Skeleton";

export default function Dashboard() {
  const [activeToken, setActiveToken] = useState<Stablecoin>("USDT");
  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const [supplyData, setSupplyData] = useState<ChainSupply[]>([]);
  const [historyData, setHistoryData] = useState<{
    usdt: HistoryPoint[];
    usdc: HistoryPoint[];
  }>({ usdt: [], usdc: [] });
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loadingSupply, setLoadingSupply] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchSupply = useCallback(async () => {
    try {
      const res = await fetch("/api/supply");
      const json: SupplyResponse = await res.json();
      setSupplyData(json.data);
      setLastUpdated(json.timestamp);
    } catch (err) {
      console.error("Failed to fetch supply:", err);
    } finally {
      setLoadingSupply(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const json: HistoryResponse = await res.json();
      setHistoryData(json);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSupply();
    fetchHistory();

    // Refresh supply every 60s
    const interval = setInterval(fetchSupply, 60_000);
    return () => clearInterval(interval);
  }, [fetchSupply, fetchHistory]);

  const chainsByToken = supplyData.filter((c) => c.token === activeToken);
  const activeHistory =
    activeToken === "USDT" ? historyData.usdt : historyData.usdc;

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <Header
        activeToken={activeToken}
        onTokenChange={setActiveToken}
        lastUpdated={lastUpdated}
      />

      <div className="space-y-6">
        {/* Summary Card */}
        {loadingSupply ? (
          <SkeletonCard />
        ) : (
          <SupplySummaryCard token={activeToken} chains={chainsByToken} />
        )}

        {/* Pie Chart */}
        {loadingSupply ? (
          <SkeletonChart />
        ) : (
          <SupplyPieChart token={activeToken} chains={chainsByToken} />
        )}

        {/* History Chart */}
        {loadingHistory ? (
          <SkeletonChart />
        ) : (
          <SupplyChart
            data={activeHistory}
            token={activeToken}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        )}

        {/* Table */}
        {loadingSupply ? (
          <SkeletonTable />
        ) : (
          <ChainSupplyTable token={activeToken} chains={chainsByToken} />
        )}
      </div>

      <footer className="mt-12 text-center text-xs text-muted pb-8">
        <p>
          Data sourced from on-chain RPC nodes and{" "}
          <a
            href="https://defillama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline"
          >
            DefiLlama
          </a>
        </p>
        <p className="mt-1">
          Tracking native token supply only. L2 bridged tokens excluded to avoid
          double-counting.
        </p>
      </footer>
    </div>
  );
}
