"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { HistoryPoint, TimeRange } from "@/lib/types";
import { STABLECOINS } from "@/lib/config";
import { formatSupply, formatChartDate } from "@/lib/format";

interface ComparisonViewProps {
  historyData: Record<string, HistoryPoint[]>;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

interface MergedPoint {
  date: string;
  [key: string]: number | string;
}

export default function ComparisonView({
  historyData,
  timeRange,
  onTimeRangeChange,
}: ComparisonViewProps) {
  const mergedData = useMemo(() => {
    const dateMap = new Map<string, MergedPoint>();

    for (const sc of STABLECOINS) {
      const key = sc.symbol.toLowerCase();
      const data = historyData[key] ?? [];

      const now = Date.now() / 1000;
      const days =
        timeRange === "30d"
          ? 30
          : timeRange === "90d"
          ? 90
          : timeRange === "1y"
          ? 365
          : Infinity;
      const cutoff = days === Infinity ? 0 : now - days * 86400;

      for (const point of data) {
        if (point.timestamp < cutoff) continue;
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        dateMap.get(point.date)![sc.symbol] = point.totalSupply;
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [historyData, timeRange]);

  // Only show stablecoins that have data
  const activeCoins = STABLECOINS.filter((sc) => {
    const key = sc.symbol.toLowerCase();
    return (historyData[key]?.length ?? 0) > 0;
  });

  if (mergedData.length === 0) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-6">
        <div className="text-muted text-center py-12">
          No comparison data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-sm font-medium text-muted">
          Stablecoin Supply Comparison
        </h3>
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => onTimeRangeChange(r.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                timeRange === r.value
                  ? "bg-card-border text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={mergedData}>
          <defs>
            {activeCoins.map((sc) => (
              <linearGradient
                key={sc.symbol}
                id={`gradient-cmp-${sc.symbol}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={sc.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={sc.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e1e2e"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v: number) => formatSupply(v)}
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111118",
              border: "1px solid #1e1e2e",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#6b7280" }}
            formatter={(value?: number | string, name?: string) =>
              value != null ? [formatSupply(Number(value)), name] : null
            }
            labelFormatter={(label) => formatChartDate(String(label))}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
          />
          {activeCoins.map((sc) => (
            <Area
              key={sc.symbol}
              type="monotone"
              dataKey={sc.symbol}
              name={sc.symbol}
              stroke={sc.color}
              strokeWidth={2}
              fill={`url(#gradient-cmp-${sc.symbol})`}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
