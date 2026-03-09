import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusDot } from "@/components/StatusDot";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
} from "recharts";
import {
  chartData7D, chartData30D, chartData90D,
  inventoryItems, systemStatuses,
} from "@/data/mock";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, Warehouse, Shield,
  TrendingUp, TrendingDown, Cpu, Clock, BarChart3,
  Gauge, Info,
} from "lucide-react";

type TimeRange = "7D" | "30D" | "90D";
const chartMap = { "7D": chartData7D, "30D": chartData30D, "90D": chartData90D };

const section = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
});

const cardHover = {
  whileHover: { y: -4, scale: 1.01 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

/* ── Sparkline (tiny inline chart) ── */
const MiniSparkline = ({ data, color = "hsl(var(--primary))" }: { data: number[]; color?: string }) => (
  <svg viewBox="0 0 80 24" className="w-20 h-6" preserveAspectRatio="none">
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      points={data
        .map((v, i) => {
          const max = Math.max(...data);
          const min = Math.min(...data);
          const range = max - min || 1;
          const x = (i / (data.length - 1)) * 80;
          const y = 22 - ((v - min) / range) * 20;
          return `${x},${y}`;
        })
        .join(" ")}
    />
  </svg>
);

/* ── Tension Bar (horizontal gauge) ── */
const TensionBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 85 ? "bg-destructive" : pct > 65 ? "bg-amber" : "bg-success";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

/* ── Feature Importance Data ── */
const featureImportance = [
  { feature: "Discount Impact", pct: 28 },
  { feature: "Seasonal Effect", pct: 24 },
  { feature: "Warehouse Load", pct: 19 },
  { feature: "Category Interaction", pct: 16 },
  { feature: "Price Elasticity", pct: 13 },
];

const featureTooltips: Record<string, string> = {
  "Discount Impact": "Measures how promotional pricing affects demand volume across SKUs",
  "Seasonal Effect": "Captures recurring temporal patterns in demand cycles",
  "Warehouse Load": "Correlation between warehouse utilization and fulfillment speed",
  "Category Interaction": "Cross-category demand influence on inventory movement",
  "Price Elasticity": "Sensitivity of demand to unit price changes",
};

const Dashboard = () => {
  const [range, setRange] = useState<TimeRange>("7D");
  const data = chartMap[range];

  const riskItems = useMemo(() =>
    inventoryItems.filter(i => i.status === "critical" || i.status === "low"), []
  );

  // Derive forecast metrics from existing data
  const totalForecastedDemand = useMemo(() =>
    chartData7D.reduce((sum, d) => sum + d.orders, 0), []
  );
  const prevWeekDemand = useMemo(() =>
    Math.round(totalForecastedDemand * 0.92), [totalForecastedDemand]
  );
  const demandChange = useMemo(() =>
    +(((totalForecastedDemand - prevWeekDemand) / prevWeekDemand) * 100).toFixed(1),
    [totalForecastedDemand, prevWeekDemand]
  );

  const totalCapacity = useMemo(() =>
    inventoryItems.reduce((s, i) => s + i.minStock * 3, 0), []
  );
  const demandPressure = useMemo(() =>
    Math.min(Math.round((totalForecastedDemand / totalCapacity) * 100), 100),
    [totalForecastedDemand, totalCapacity]
  );

  const sparklineData = useMemo(() =>
    [2680, 2810, 2720, 2950, 3020, totalForecastedDemand], [totalForecastedDemand]
  );

  // Seasonal pattern data (yearly demand curve)
  const seasonalCurve = useMemo(() => [
    { month: "Jan", demand: 320 }, { month: "Feb", demand: 290 },
    { month: "Mar", demand: 340 }, { month: "Apr", demand: 380 },
    { month: "May", demand: 420 }, { month: "Jun", demand: 460 },
    { month: "Jul", demand: 440 }, { month: "Aug", demand: 410 },
    { month: "Sep", demand: 480 }, { month: "Oct", demand: 520 },
    { month: "Nov", demand: 580 }, { month: "Dec", demand: 540 },
  ], []);

  // Forecast chart with confidence band
  const forecastData = useMemo(() =>
    data.map((d, i) => {
      const isForecast = i >= data.length - 2;
      return {
        date: d.date,
        actual: isForecast ? undefined : d.orders,
        forecast: isForecast ? d.orders : undefined,
        upper: isForecast ? Math.round(d.orders * 1.12) : undefined,
        lower: isForecast ? Math.round(d.orders * 0.88) : undefined,
        // Bridge point for continuous line
        bridge: i === data.length - 3 ? d.orders : undefined,
      };
    }),
    [data]
  );

  // Warehouse zone intelligence
  const zones = ["Zone A", "Zone B", "Zone C", "Zone D"];
  const warehouseData = useMemo(() =>
    zones.map(zone => {
      const items = inventoryItems.filter(i => i.zone === zone);
      const totalStock = items.reduce((s, i) => s + i.stock, 0);
      const capacity = items.reduce((s, i) => s + i.minStock * 3, 0);
      const utilization = capacity > 0 ? Math.round((totalStock / capacity) * 100) : 0;
      const hasAlert = items.some(i => i.status === "critical" || i.status === "low");
      const sparkline = [65, 72, 68, 74, utilization, Math.min(utilization + 3, 100)];
      return { zone, items: items.length, totalStock, capacity, utilization, hasAlert, sparkline };
    }),
    []
  );

  const riskLevel = riskItems.length > 2 ? "Elevated" : riskItems.length > 0 ? "Moderate" : "Low";
  const riskStatus = riskLevel === "Low" ? "online" : riskLevel === "Moderate" ? "warning" : "critical";

  const tooltipStyle = {
    borderRadius: 6,
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    fontSize: 11,
    padding: "8px 12px",
  };

  return (
    <AppLayout title="Dashboard">
      <TooltipProvider delayDuration={200}>
        <div className="space-y-6 max-w-[1440px]">

          {/* ═══ GLOBAL STATE BAR ═══ */}
          <motion.div {...section(0)}>
            <div className="flex items-center gap-0 rounded-lg bg-card border border-border/40 overflow-hidden shadow-card">
              {[
                { icon: Activity, label: "System Health", value: "Operational", status: "online" as const },
                { icon: Cpu, label: "Forecast Engine", value: "Active", status: "online" as const },
                { icon: Shield, label: "Risk Level", value: riskLevel, status: riskStatus as "online" | "warning" | "critical" },
                { icon: TrendingUp, label: "Seasonal Signal", value: "Active", status: "online" as const },
                { icon: Clock, label: "Last Forecast", value: "2026-02-28 08:14 UTC", status: "online" as const },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 px-5 py-2.5 flex-1 min-w-0 ${
                    i > 0 ? "border-l border-border/40" : ""
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase leading-none">{item.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          item.status === "online" ? "bg-success animate-ping" :
                          item.status === "warning" ? "bg-amber animate-ping" : "bg-destructive animate-ping"
                        }`} style={{ animationDuration: "2s" }} />
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          item.status === "online" ? "bg-success" :
                          item.status === "warning" ? "bg-amber" : "bg-destructive"
                        }`} />
                      </span>
                      <p className="text-xs font-medium text-foreground truncate">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ═══ STRATEGIC FORECAST METRICS ═══ */}
          <motion.div {...section(0.05)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Total Forecasted Demand */}
              <motion.div {...cardHover}>
                <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  <CardContent className="p-5">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-3">
                      Forecasted Demand · Next 7D
                    </p>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[28px] font-display font-bold text-foreground leading-none tracking-tight">
                          {totalForecastedDemand.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          {demandChange >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-success" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-destructive" />
                          )}
                          <span className={`text-xs font-medium ${demandChange >= 0 ? "text-success" : "text-destructive"}`}>
                            {demandChange > 0 ? "+" : ""}{demandChange}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">vs prev week</span>
                        </div>
                      </div>
                      <MiniSparkline data={sparklineData} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Demand Pressure Index */}
              <motion.div {...cardHover}>
                <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                        Demand Pressure Index
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          Predicted demand ÷ available capacity. Higher values indicate supply strain.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[28px] font-display font-bold text-foreground leading-none tracking-tight">
                      {demandPressure}%
                    </p>
                    <div className="mt-3">
                      <TensionBar value={demandPressure} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {demandPressure > 85 ? "Critical strain" : demandPressure > 65 ? "Moderate pressure" : "Capacity available"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* SKUs At Risk */}
              <motion.div {...cardHover}>
                <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${riskItems.length > 0 ? "bg-destructive" : "bg-success"}`} />
                  <CardContent className="p-5">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-3">
                      SKUs At Risk · Next 7D
                    </p>
                    <p className="text-[28px] font-display font-bold text-foreground leading-none tracking-tight">
                      {riskItems.length}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {inventoryItems.filter(i => i.status === "critical").length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-5 rounded-sm bg-destructive/80" />
                          <span className="text-[10px] text-muted-foreground">
                            {inventoryItems.filter(i => i.status === "critical").length} critical
                          </span>
                        </div>
                      )}
                      {inventoryItems.filter(i => i.status === "low").length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-5 rounded-sm bg-amber/80" />
                          <span className="text-[10px] text-muted-foreground">
                            {inventoryItems.filter(i => i.status === "low").length} low
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Forecast Confidence */}
              <motion.div {...cardHover}>
                <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                        Forecast Confidence
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[220px]">
                          Time-split validation accuracy: model tested on rolling forward windows to prevent data leakage.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[28px] font-display font-bold text-foreground leading-none tracking-tight">
                      97.8%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">Time-Split Validation</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Gauge className="h-3 w-3 text-teal" />
                      <span className="text-[10px] text-teal font-medium">High confidence</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* ═══ FORECAST COMMAND PANEL ═══ */}
          <motion.div {...section(0.1)}>
            <Card className="border-border/40 bg-card shadow-card">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-6 pt-6 pb-3">
                  <div>
                    <h3 className="text-base font-display font-semibold text-foreground">
                      Demand Forecast Command
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Historical demand · Forecast projection · Confidence band
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-primary rounded-full" />
                        Actual
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-teal rounded-full" />
                        Forecast
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-4 bg-teal/10 rounded-sm border border-teal/20" />
                        Confidence
                      </span>
                    </div>
                    <div className="flex gap-0.5 bg-muted/50 rounded-md p-0.5">
                      {(["7D", "30D", "90D"] as TimeRange[]).map((r) => (
                        <Button
                          key={r}
                          variant={range === r ? "default" : "ghost"}
                          size="sm"
                          className={`h-7 text-xs px-3 font-medium ${range === r ? "" : "text-muted-foreground hover:text-foreground"}`}
                          onClick={() => setRange(r)}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-2">
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={forecastData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--teal))" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="hsl(var(--teal))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={44} />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      {/* Confidence band */}
                      <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--teal))" fillOpacity={0.08} />
                      <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--card))" fillOpacity={1} />
                      {/* Actual demand */}
                      <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#actualGrad)" dot={false} connectNulls={false} />
                      {/* Forecast */}
                      <Area type="monotone" dataKey="forecast" stroke="hsl(var(--teal))" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGrad)" dot={{ r: 3, fill: "hsl(var(--teal))", strokeWidth: 0 }} connectNulls={false} />
                      {/* Bridge from actual to forecast */}
                      <Line type="monotone" dataKey="bridge" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} connectNulls={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-4 px-6 pb-5 text-[10px] text-muted-foreground">
                  <span>Last retrain: 2 days ago</span>
                  <span className="w-px h-3 bg-border/60" />
                  <span>Model: v3.2.1</span>
                  <span className="w-px h-3 bg-border/60" />
                  <span>Confidence: 97.8%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ═══ RISK & REORDER + TREND & SEASON ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Risk & Reorder Intelligence */}
            <motion.div className="lg:col-span-5" {...section(0.15)}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-display font-semibold text-foreground">Risk & Reorder Intelligence</h3>
              </div>
              <Card className="border-border/40 bg-card shadow-card h-[calc(100%-32px)]">
                <CardContent className="p-4 space-y-3">
                  {riskItems.length > 0 ? (
                    riskItems.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                        className="flex gap-3 rounded-md bg-muted/20 overflow-hidden"
                      >
                        <div className={`w-1 shrink-0 ${item.status === "critical" ? "bg-destructive" : "bg-amber"}`} />
                        <div className="py-3 pr-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground truncate">{item.product}</p>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              item.status === "critical"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-amber/10 text-amber"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-1.5">
                            <span>Zone: {item.zone}</span>
                            <span>SKU: {item.sku}</span>
                            <span>Stock: {item.stock.toLocaleString()}</span>
                            <span>Predicted demand: {(item.minStock * 2).toLocaleString()}</span>
                            <span>Shortage ETA: {item.status === "critical" ? "~2 days" : "~5 days"}</span>
                            <span>Risk: {item.status === "critical" ? "High" : "Medium"}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">No active risk alerts</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Trend & Season Analysis */}
            <motion.div className="lg:col-span-7" {...section(0.18)}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-display font-semibold text-foreground">Trend & Season Analysis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-32px)]">

                {/* Seasonal Pattern Curve */}
                <Card className="border-border/40 bg-card shadow-card">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-3">
                      Seasonal Demand Pattern
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={seasonalCurve}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={32} />
                        <RechartsTooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                        {/* Seasonal phase markers */}
                        {[2, 5, 8, 11].map(idx => (
                          <Line key={idx} type="monotone" dataKey={() => undefined} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="h-px w-3 border-t border-dashed border-muted-foreground/40" />
                        Q1/Q3 transition
                      </span>
                      <span className="text-teal font-medium">Festival Surge Active</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Importance */}
                <Card className="border-border/40 bg-card shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                        Feature Importance · RF Model
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[220px]">
                          Random Forest feature ranking showing which variables most influence demand predictions.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-3">
                      {featureImportance.map((f) => (
                        <Tooltip key={f.feature}>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-foreground">{f.feature}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">{f.pct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-primary/70"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${f.pct * 3.5}%` }}
                                  transition={{ duration: 0.6, delay: 0.3 }}
                                />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs max-w-[200px]">
                            {featureTooltips[f.feature]}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>

          {/* ═══ WAREHOUSE COMMAND GRID ═══ */}
          <motion.div {...section(0.22)}>
            <div className="flex items-center gap-2 mb-3">
              <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-sm font-display font-semibold text-foreground">Warehouse Command Grid</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {warehouseData.map((z, i) => (
                <motion.div
                  key={z.zone}
                  {...cardHover}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.04 }}
                >
                  <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                    {z.hasAlert && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber" />
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-display font-semibold text-foreground">{z.zone}</span>
                        {z.hasAlert && (
                          <span className="text-[9px] font-medium text-amber bg-amber/10 px-1.5 py-0.5 rounded">
                            Alert
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Forecasted</p>
                          <p className="text-sm font-display font-bold text-foreground">{z.totalStock.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Capacity</p>
                          <p className="text-sm font-display font-bold text-foreground">{z.capacity.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-muted-foreground">Utilization</span>
                        <span className="text-[10px] font-medium text-foreground">{z.utilization}%</span>
                      </div>
                      <TensionBar value={z.utilization} />

                      <div className="flex items-center justify-between mt-3">
                        <MiniSparkline data={z.sparkline} color={z.hasAlert ? "hsl(var(--amber))" : "hsl(var(--primary))"} />
                        <span className="text-[10px] text-muted-foreground">{z.items} SKUs</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </TooltipProvider>
    </AppLayout>
  );
};

export default Dashboard;
