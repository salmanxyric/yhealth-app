"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  ScatterChart,
  Scatter,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";

export interface ChartArtifact {
  type: "chart";
  chartType: "line" | "bar" | "area" | "pie" | "radar"
    | "scatter" | "correlation_scatter" | "time_series"
    | "comparison_bar" | "gauge";
  title: string;
  data: Record<string, unknown>[];
  xAxisKey: string;
  dataKeys: { key: string; label: string; color: string }[];
  yAxisLabel?: string;
  xAxisLabel?: string;
  stacked?: boolean;
  insight?: string;
  referenceLines?: Array<{ y?: number; x?: number; label: string; stroke: string; strokeDasharray?: string }>;
  annotations?: Array<{ label: string; color?: string }>;
  statistics?: { mean?: number; stdDev?: number; r?: number; slope?: number; intercept?: number; pValue?: number };
  gaugeMax?: number;
}

export interface ComparisonMetric {
  name: string;
  unit?: string;
  baseline: number;
  compare: number;
  change: { absolute: number; percentage: number; direction: "improved" | "declined" | "stable" };
  isPositiveChange: boolean;
}

export interface ComparisonArtifact {
  type: "comparison";
  title: string;
  items: {
    label: string;
    current: number;
    target?: number;
    unit?: string;
    trend?: "up" | "down" | "flat";
  }[];
  insight?: string;
  comparisonType?: "week_over_week" | "month_over_month" | "before_after" | "goal_vs_actual";
  periods?: {
    baseline: { label: string; range?: string };
    compare: { label: string; range?: string };
  };
  metrics?: ComparisonMetric[];
  summary?: { improved: string[]; declined: string[]; stable: string[]; headline: string };
}

export type Artifact = ChartArtifact | ComparisonArtifact;

const TREND_ICONS: Record<string, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const TREND_COLORS: Record<string, string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  flat: "text-slate-400",
};

interface ArtifactCardProps {
  artifact: Artifact;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  if (artifact.type === "chart") {
    return <ChartCard artifact={artifact} />;
  }
  return <ComparisonCard artifact={artifact} />;
}

function ChartCard({ artifact }: { artifact: ChartArtifact }) {
  const chart = useMemo(() => {
    const commonProps = {
      data: artifact.data,
    };

    const axisStyle = {
      fontSize: 10,
      fill: "#94a3b8",
    };

    switch (artifact.chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={artifact.xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} label={artifact.yAxisLabel ? { value: artifact.yAxisLabel, angle: -90, position: "insideLeft", style: { ...axisStyle, fill: "#64748b" } } : undefined} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            {artifact.dataKeys.map((dk) => (
              <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.label} stroke={dk.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={artifact.xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            {artifact.dataKeys.map((dk) => (
              <Bar key={dk.key} dataKey={dk.key} name={dk.label} fill={dk.color} stackId={artifact.stacked ? "stack" : undefined} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={artifact.xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            {artifact.dataKeys.map((dk) => (
              <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.label} stroke={dk.color} fill={dk.color} fillOpacity={0.15} stackId={artifact.stacked ? "stack" : undefined} />
            ))}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie data={artifact.data} dataKey={artifact.dataKeys[0]?.key || "value"} nameKey={artifact.xAxisKey} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {artifact.data.map((_, i) => (
                <Cell key={i} fill={artifact.dataKeys[i % artifact.dataKeys.length]?.color || "#64748b"} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        );

      case "radar":
        return (
          <RadarChart cx="50%" cy="50%" outerRadius={80} data={artifact.data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey={artifact.xAxisKey} tick={axisStyle} />
            {artifact.dataKeys.map((dk) => (
              <Radar key={dk.key} name={dk.label} dataKey={dk.key} stroke={dk.color} fill={dk.color} fillOpacity={0.15} />
            ))}
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
          </RadarChart>
        );

      case "scatter":
      case "correlation_scatter": {
        const xKey = artifact.dataKeys[0]?.key || "x";
        const yKey = artifact.dataKeys[1]?.key || "y";
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey={xKey}
              type="number"
              name={artifact.dataKeys[0]?.label || xKey}
              tick={axisStyle}
              label={artifact.xAxisLabel ? { value: artifact.xAxisLabel, position: "insideBottom", offset: -5, style: { ...axisStyle, fill: "#64748b" } } : undefined}
            />
            <YAxis
              dataKey={yKey}
              type="number"
              name={artifact.dataKeys[1]?.label || yKey}
              tick={axisStyle}
              label={artifact.yAxisLabel ? { value: artifact.yAxisLabel, angle: -90, position: "insideLeft", style: { ...axisStyle, fill: "#64748b" } } : undefined}
            />
            <ZAxis range={[40, 40]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            />
            <Scatter
              data={artifact.data}
              fill={artifact.dataKeys[0]?.color || "#06b6d4"}
              fillOpacity={0.7}
            />
            {artifact.referenceLines?.map((rl, i) => (
              <ReferenceLine
                key={`ref-${i}`}
                y={rl.y}
                x={rl.x}
                label={{ value: rl.label, position: "insideTopRight", style: { fontSize: 10, fill: rl.stroke } }}
                stroke={rl.stroke}
                strokeDasharray={rl.strokeDasharray || "4 4"}
              />
            ))}
            {artifact.statistics?.slope != null && artifact.statistics?.intercept != null && (() => {
              const xs = artifact.data.map(d => Number(d[xKey]) || 0);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const s = artifact.statistics!;
              const trendData = [
                { [xKey]: minX, [yKey]: s.slope! * minX + s.intercept! },
                { [xKey]: maxX, [yKey]: s.slope! * maxX + s.intercept! },
              ];
              return (
                <Scatter
                  data={trendData}
                  fill="none"
                  line={{ stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "6 3" }}
                  shape={() => <></>}
                  legendType="none"
                />
              );
            })()}
          </ScatterChart>
        );
      }

      case "time_series":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={artifact.xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} label={artifact.yAxisLabel ? { value: artifact.yAxisLabel, angle: -90, position: "insideLeft", style: { ...axisStyle, fill: "#64748b" } } : undefined} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            {artifact.dataKeys.map((dk) => (
              <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.label} stroke={dk.color} strokeWidth={2} dot={false} />
            ))}
            {artifact.referenceLines?.map((rl, i) => (
              <ReferenceLine
                key={`ref-${i}`}
                y={rl.y}
                label={{ value: rl.label, position: "insideTopRight", style: { fontSize: 10, fill: rl.stroke } }}
                stroke={rl.stroke}
                strokeDasharray={rl.strokeDasharray || "4 4"}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </LineChart>
        );

      case "comparison_bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={artifact.xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            {artifact.dataKeys.map((dk) => (
              <Bar key={dk.key} dataKey={dk.key} name={dk.label} fill={dk.color} radius={[4, 4, 0, 0]} />
            ))}
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </BarChart>
        );

      case "gauge": {
        const value = Number(artifact.data[0]?.[artifact.dataKeys[0]?.key || "value"] ?? 0);
        const max = artifact.gaugeMax || 100;
        const pct = Math.min(value / max, 1);
        const gaugeColor = artifact.dataKeys[0]?.color || "#10b981";
        const gaugeData = [
          { name: "value", value: pct * 100 },
          { name: "remaining", value: (1 - pct) * 100 },
        ];
        return (
          <PieChart>
            <Pie
              data={gaugeData}
              startAngle={180}
              endAngle={0}
              cx="50%"
              cy="85%"
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={gaugeColor} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
            <text x="50%" y="75%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 600, fill: "#e2e8f0" }}>
              {value}{artifact.dataKeys[0]?.label ? ` ${artifact.dataKeys[0].label}` : ""}
            </text>
            <text x="50%" y="90%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: "#64748b" }}>
              of {max}
            </text>
          </PieChart>
        );
      }
    }
  }, [artifact]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-slate-200">{artifact.title}</span>
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
      {artifact.statistics?.r != null && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>r = {artifact.statistics.r.toFixed(3)}</span>
          {artifact.statistics.pValue != null && <span>p = {artifact.statistics.pValue.toFixed(4)}</span>}
          {artifact.statistics.slope != null && <span>slope = {artifact.statistics.slope.toFixed(3)}</span>}
        </div>
      )}
      {artifact.annotations && artifact.annotations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {artifact.annotations.map((ann, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
              style={{
                color: ann.color || "#94a3b8",
                borderColor: `${ann.color || "#94a3b8"}33`,
                backgroundColor: `${ann.color || "#94a3b8"}11`,
              }}
            >
              {ann.label}
            </span>
          ))}
        </div>
      )}
      {artifact.insight && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
          {artifact.insight}
        </p>
      )}
    </motion.div>
  );
}

function ComparisonCard({ artifact }: { artifact: ComparisonArtifact }) {
  const hasEnhanced = artifact.metrics && artifact.metrics.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3"
    >
      <span className="text-sm font-medium text-slate-200">{artifact.title}</span>

      {/* Period header */}
      {artifact.periods && (
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">{artifact.periods.baseline.label}</span>
            {artifact.periods.baseline.range && <span className="text-slate-600">({artifact.periods.baseline.range})</span>}
          </div>
          <span className="text-slate-600">vs</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">{artifact.periods.compare.label}</span>
            {artifact.periods.compare.range && <span className="text-slate-600">({artifact.periods.compare.range})</span>}
          </div>
        </div>
      )}

      {hasEnhanced ? (
        <div className="space-y-1.5">
          {artifact.metrics!.map((m, i) => {
            const dirColor = m.change.direction === "improved"
              ? "text-emerald-400" : m.change.direction === "declined"
              ? "text-red-400" : "text-slate-400";
            const badgeBg = m.change.direction === "improved"
              ? "bg-emerald-500/10 border-emerald-500/20" : m.change.direction === "declined"
              ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10";
            const sign = m.change.percentage > 0 ? "+" : "";

            return (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-slate-300">{m.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    {m.baseline}{m.unit ? ` ${m.unit}` : ""}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className="text-xs font-medium text-slate-200 tabular-nums">
                    {m.compare}{m.unit ? ` ${m.unit}` : ""}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border tabular-nums ${dirColor} ${badgeBg}`}>
                    {sign}{m.change.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {artifact.items.map((item, i) => {
            const TrendIcon = item.trend ? TREND_ICONS[item.trend] : null;
            const trendColor = item.trend ? TREND_COLORS[item.trend] : "";
            const pct = item.target ? Math.min((item.current / item.target) * 100, 100) : 0;

            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-200">
                      {item.current}{item.unit ? ` ${item.unit}` : ""}
                    </span>
                    {item.target != null && (
                      <span className="text-[10px] text-slate-500">/ {item.target}{item.unit ? ` ${item.unit}` : ""}</span>
                    )}
                    {TrendIcon && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
                  </div>
                </div>
                {item.target != null && (
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {artifact.summary && (
        <div className="border-t border-white/5 pt-2 space-y-1">
          <p className="text-xs font-medium text-slate-300">{artifact.summary.headline}</p>
          <div className="flex flex-wrap gap-1">
            {artifact.summary.improved.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-500/10">↑ {s}</span>
            ))}
            {artifact.summary.declined.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] text-red-400 bg-red-500/10">↓ {s}</span>
            ))}
            {artifact.summary.stable.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-white/5">— {s}</span>
            ))}
          </div>
        </div>
      )}

      {artifact.insight && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
          {artifact.insight}
        </p>
      )}
    </motion.div>
  );
}

/**
 * Parse artifact from AI tool result embedded in message.
 * Format: <!--ARTIFACT:{"type":"chart",...}-->
 */
export function parseArtifactFromMessage(content: string): Artifact | null {
  const match = content.match(/<!--ARTIFACT:([\s\S]*?)-->/);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    if (data.type === "chart" || data.type === "comparison") {
      return data as Artifact;
    }
  } catch {
    // Malformed artifact
  }
  return null;
}
