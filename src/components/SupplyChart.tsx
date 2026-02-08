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
} from "recharts";
import { HistoryPoint, Stablecoin, TimeRange } from "@/lib/types";
import { formatSupply, formatChartDate } from "@/lib/format";

interface SupplyChartProps {
  data: HistoryPoint[];
  token: Stablecoin;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

function getFilteredData(data: HistoryPoint[], range: TimeRange) {
  if (range === "all") return data;
  const now = Date.now() / 1000;
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const cutoff = now - days * 86400;
  return data.filter((d) => d.timestamp >= cutoff);
}

export default function SupplyChart({
  data,
  token,
  timeRange,
  onTimeRangeChange,
}: SupplyChartProps) {
  const filtered = useMemo(
    () => getFilteredData(data, timeRange),
    [data, timeRange]
  );

  const color = token === "USDT" ? "#26A17B" : "#2775CA";

  if (filtered.length === 0) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-6">
        <div className="text-muted text-center py-12">
          No historical data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-sm font-medium text-muted">
          {token} Total Supply Over Time
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

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={filtered}>
          <defs>
            <linearGradient id={`gradient-${token}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
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
            formatter={(value?: number | string) =>
              value != null ? [formatSupply(Number(value)), "Supply"] : null
            }
            labelFormatter={(label) => formatChartDate(String(label))}
          />
          <Area
            type="monotone"
            dataKey="totalSupply"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${token})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
