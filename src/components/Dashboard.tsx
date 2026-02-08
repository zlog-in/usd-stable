"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stablecoin,
  ChainSupply,
  HistoryPoint,
  TimeRange,
  SupplyResponse,
  HistoryResponse,
  PegData,
} from "@/lib/types";
import Header from "./Header";
import SupplySummaryCard from "./SupplySummaryCard";
import SupplyPieChart from "./SupplyPieChart";
import ChainSupplyTable from "./ChainSupplyTable";
import SupplyChart from "./SupplyChart";
import PegMonitor from "./PegMonitor";
import ComparisonView from "./ComparisonView";
import { SkeletonCard, SkeletonTable, SkeletonChart } from "./Skeleton";

interface ChainChange {
  change24h: number | null;
  change7d: number | null;
}

interface PegOverview extends PegData {
  change1d: number | null;
  change7d: number | null;
  change1m: number | null;
  totalSupply: number;
}

export default function Dashboard() {
  const [activeToken, setActiveToken] = useState<Stablecoin>("USDT");
  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const [comparisonTimeRange, setComparisonTimeRange] = useState<TimeRange>("1y");
  const [showComparison, setShowComparison] = useState(false);
  const [supplyData, setSupplyData] = useState<ChainSupply[]>([]);
  const [historyData, setHistoryData] = useState<Record<string, HistoryPoint[]>>({});
  const [pegData, setPegData] = useState<PegData[]>([]);
  const [overviewData, setOverviewData] = useState<PegOverview[]>([]);
  const [chainChanges, setChainChanges] = useState<Record<string, Record<string, ChainChange>>>({});
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

  const fetchPeg = useCallback(async () => {
    try {
      const res = await fetch("/api/peg");
      const json = await res.json();
      const data = json.data ?? [];
      setPegData(data.map((d: PegOverview) => ({
        symbol: d.symbol,
        price: d.price,
        change24h: d.change24h,
      })));
      setOverviewData(data);
    } catch (err) {
      console.error("Failed to fetch peg:", err);
    }
  }, []);

  const fetchDetail = useCallback(async (symbol: string) => {
    try {
      const res = await fetch(`/api/detail?symbol=${symbol}`);
      const json = await res.json();
      if (json.changes) {
        setChainChanges((prev) => ({ ...prev, [symbol]: json.changes }));
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchSupply();
    fetchHistory();
    fetchPeg();

    const interval = setInterval(fetchSupply, 60_000);
    return () => clearInterval(interval);
  }, [fetchSupply, fetchHistory, fetchPeg]);

  // Fetch detail data when active token changes
  useEffect(() => {
    fetchDetail(activeToken);
  }, [activeToken, fetchDetail]);

  const chainsByToken = supplyData.filter((c) => c.token === activeToken);
  const activeHistory = historyData[activeToken.toLowerCase()] ?? [];
  const activePeg = pegData.find(
    (p) => p.symbol.toUpperCase() === activeToken.toUpperCase()
  );
  const activeOverview = overviewData.find(
    (o) => o.symbol.toUpperCase() === activeToken.toUpperCase()
  );
  const activeChanges = chainChanges[activeToken];

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <Header
        activeToken={activeToken}
        onTokenChange={setActiveToken}
        lastUpdated={lastUpdated}
        showComparison={showComparison}
        onToggleComparison={() => setShowComparison((s) => !s)}
      />

      <div className="space-y-6">
        {/* Peg Monitor */}
        {pegData.length > 0 && <PegMonitor pegData={pegData} />}

        {showComparison ? (
          /* Comparison View */
          loadingHistory ? (
            <SkeletonChart />
          ) : (
            <ComparisonView
              historyData={historyData}
              timeRange={comparisonTimeRange}
              onTimeRangeChange={setComparisonTimeRange}
            />
          )
        ) : (
          <>
            {/* Summary Card */}
            {loadingSupply ? (
              <SkeletonCard />
            ) : (
              <SupplySummaryCard
                token={activeToken}
                chains={chainsByToken}
                pegData={activePeg}
                supplyChange={
                  activeOverview
                    ? {
                        change1d: activeOverview.change1d,
                        change7d: activeOverview.change7d,
                      }
                    : undefined
                }
              />
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
              <ChainSupplyTable
                token={activeToken}
                chains={chainsByToken}
                changes={activeChanges}
              />
            )}
          </>
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
