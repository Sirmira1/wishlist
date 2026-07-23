"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  Treemap,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
  "#a855f7",
  "#eab308",
  "#f97316",
  "#64748b",
];

type Datum = { name: string; value: number; color?: string };

// CSS variables don't resolve inside SVG presentation attributes, so axis text
// uses `currentColor` and each chart wrapper sets that colour via a real CSS class.
const AXIS_WRAP = "text-muted-foreground";
const TICK = { fontSize: 11, fill: "currentColor" as const };
const GRID = "currentColor";

function TooltipBox({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  // Prefer the datum's own `name` (bar/pie/treemap) and fall back to the axis
  // label (time-series). This avoids Recharts ever showing a bare row index.
  const title = payload[0]?.payload?.name ?? label;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-lg">
      {title != null && title !== "" && <p className="mb-1 font-medium text-foreground">{title}</p>}
      {payload.map((p: any, i: number) => {
        const rawValue = p.payload?.originalValue ?? p.value;
        return (
          <p key={i} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium text-foreground">{formatter ? formatter(rawValue) : rawValue}</span>
          </p>
        );
      })}
    </div>
  );
}

export function ChartCard({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function DonutChart({
  data,
  height = 260,
  valueFormatter,
  centerFormatter,
  innerRadius = 60,
}: {
  data: Datum[];
  height?: number;
  valueFormatter?: (v: number) => string;
  /** Short form for the centre label — falls back to valueFormatter. */
  centerFormatter?: (v: number) => string;
  innerRadius?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const centerText = String(
    (centerFormatter ?? valueFormatter)?.(total) ?? total
  );
  // Scale the centre label down so long totals still fit inside the hole.
  const centerSize =
    centerText.length <= 8 ? 18 : centerText.length <= 11 ? 15 : centerText.length <= 14 ? 13 : 11;
  return (
    <ResponsiveContainer width="100%" height={height} className={AXIS_WRAP}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 34}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<TooltipBox formatter={valueFormatter} />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
        />
        {total > 0 && (
          <text
            x="50%"
            y="42%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={centerSize}
            fontWeight={700}
            className="fill-foreground"
          >
            {centerText}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarChartComp({
  data,
  height = 260,
  color = "#8b5cf6",
  valueFormatter,
  horizontal = false,
  scale = "linear",
}: {
  data: Datum[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
  horizontal?: boolean;
  scale?: "linear" | "log";
}) {
  const chartData = data.map((d) => ({
    ...d,
    originalValue: d.value,
    value: scale === "log" && d.value > 0 ? Math.log10(d.value + 1) : d.value,
  }));

  const formatAxisValue = (v: number) => {
    if (scale === "log") {
      const originalValue = Math.pow(10, v) - 1;
      return valueFormatter ? valueFormatter(originalValue) : String(Math.round(originalValue));
    }
    return valueFormatter ? valueFormatter(v) : String(v);
  };

  return (
    <ResponsiveContainer width="100%" height={height} className={AXIS_WRAP}>
      <BarChart
        data={chartData}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ left: horizontal ? 12 : 0, right: 12, top: 8, bottom: horizontal ? 4 : 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.15} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} tickFormatter={formatAxisValue} />
            <YAxis type="category" dataKey="name" width={110} tick={TICK} tickLine={false} axisLine={false} />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              tick={TICK}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={56}
            />
            <YAxis tick={TICK} tickLine={false} axisLine={false} width={44} tickFormatter={formatAxisValue} />
          </>
        )}
        <Tooltip cursor={{ fill: "currentColor", opacity: 0.06 }} content={<TooltipBox formatter={valueFormatter} />} />
        <Bar dataKey="value" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={48}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.color || color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AreaChartComp({
  data,
  keys,
  height = 260,
  valueFormatter,
}: {
  data: Record<string, number | string>[];
  keys: { key: string; label: string; color: string }[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height} className={AXIS_WRAP}>
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 6 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={k.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={k.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.15} vertical={false} />
        <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<TooltipBox formatter={valueFormatter} />} />
        <Legend verticalAlign="top" height={28} iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
        {keys.map((k) => (
          <Area
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.label}
            stroke={k.color}
            strokeWidth={2}
            fill={`url(#grad-${k.key})`}
            dot={{ r: 3, fill: k.color, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineChartComp({
  data,
  keys,
  height = 260,
}: {
  data: Record<string, number | string>[];
  keys: { key: string; label: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height} className={AXIS_WRAP}>
      <LineChart data={data} margin={{ left: 0, right: 12, top: 6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.15} vertical={false} />
        <XAxis dataKey="month" tick={TICK} tickLine={false} axisLine={false} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<TooltipBox />} />
        {keys.map((k) => (
          <Line key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={k.color} strokeWidth={2} dot={{ r: 3, fill: k.color, strokeWidth: 0 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TreemapChart({
  data,
  height = 280,
  valueFormatter,
  scale = "linear",
}: {
  data: Datum[];
  height?: number;
  valueFormatter?: (v: number) => string;
  scale?: "linear" | "log";
}) {
  const treeData = data.map((d, i) => ({
    ...d,
    originalValue: d.value,
    value: scale === "log" && d.value > 0 ? Math.log10(d.value + 1) : d.value,
    fill: d.color || PALETTE[i % PALETTE.length],
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap data={treeData} dataKey="value" stroke="hsl(var(--background))" content={<TreemapCell />}>
        <Tooltip content={<TooltipBox formatter={valueFormatter} />} />
      </Treemap>
    </ResponsiveContainer>
  );
}

function TreemapCell(props: any) {
  const { x, y, width, height, name, fill } = props;
  if (width < 4 || height < 4) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} fillOpacity={0.9} />
      {width > 54 && height > 24 && (
        <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight={600}>
          {name}
        </text>
      )}
    </g>
  );
}
