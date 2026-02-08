"use client";

import { useMemo, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { ChainSupply, Stablecoin } from "@/lib/types";
import { formatSupply, formatSupplyFull } from "@/lib/format";

interface SupplyPieChartProps {
  token: Stablecoin;
  chains: ChainSupply[];
}

const OTHERS_COLOR = "#4a4a5a";
const MERGE_THRESHOLD = 0.02; // merge chains below 2%

interface PieSlice {
  name: string;
  value: number;
  color: string;
  percent: number;
  chains?: string[];
}

function buildSlices(chains: ChainSupply[]): PieSlice[] {
  const withSupply = chains.filter((c) => c.supply !== null && c.supply > 0);
  const total = withSupply.reduce((s, c) => s + (c.supply ?? 0), 0);
  if (total === 0) return [];

  const sorted = [...withSupply].sort(
    (a, b) => (b.supply ?? 0) - (a.supply ?? 0)
  );

  const slices: PieSlice[] = [];
  const others: { name: string; value: number }[] = [];

  for (const c of sorted) {
    const value = c.supply ?? 0;
    const percent = value / total;
    if (percent >= MERGE_THRESHOLD) {
      slices.push({
        name: c.chainName,
        value,
        color: c.color === "#000000" || c.color === "#191C20" ? "#555" : c.color,
        percent,
      });
    } else {
      others.push({ name: c.chainName, value });
    }
  }

  if (others.length > 0) {
    const othersValue = others.reduce((s, o) => s + o.value, 0);
    slices.push({
      name: `Others (${others.length})`,
      value: othersValue,
      color: OTHERS_COLOR,
      percent: othersValue / total,
      chains: others.map((o) => o.name),
    });
  }

  return slices;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderActiveShape(props: any) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#e5e7eb" fontSize={15} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#e5e7eb" fontSize={20} fontWeight={700}>
        {formatSupply(payload.value)}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#6b7280" fontSize={12}>
        {(payload.percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 11}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PieSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#111118] border border-card-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-foreground">{data.name}</div>
      <div className="text-muted mt-0.5">{formatSupplyFull(data.value)}</div>
      <div className="text-muted">{(data.percent * 100).toFixed(2)}%</div>
      {data.chains && (
        <div className="text-muted mt-1 border-t border-card-border pt-1">
          {data.chains.join(", ")}
        </div>
      )}
    </div>
  );
}

const LABEL_THRESHOLD = 0.04;

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderLabel(props: any) {
  const {
    cx,
    cy,
    midAngle,
    outerRadius,
    name,
    percent,
    index,
    activeIndex,
  } = props;
  if (percent < LABEL_THRESHOLD || index === activeIndex) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fill="#9ca3af"
      fontSize={11}
    >
      {name} {(percent * 100).toFixed(1)}%
    </text>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function SupplyPieChart({
  token,
  chains,
}: SupplyPieChartProps) {
  const slices = useMemo(() => buildSlices(chains), [chains]);
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  if (slices.length === 0) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-6">
        <div className="text-muted text-center py-12">No supply data</div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted mb-4">
        {token} Supply Distribution
      </h3>
      <ResponsiveContainer width="100%" height={380}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={130}
            dataKey="value"
            {...{ activeIndex }}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            label={(props) => renderLabel({ ...props, activeIndex })}
            labelLine={false}
            strokeWidth={1}
            stroke="#0a0a0f"
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
        {slices.map((s, i) => (
          <button
            key={i}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
            onMouseEnter={() => setActiveIndex(i)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
