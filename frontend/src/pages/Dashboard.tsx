import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
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
import { useQuery } from "@tanstack/react-query";
import {
  getInventory, getDecisions,
  getAnalyticsDemandTrends, getAnalyticsSeasonal,
  getAnalyticsFeatureImportance, getAnalyticsWarehouseUtilization,
  getAnalyticsZonePerformance,
} from "@/services/api";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, Warehouse, Shield,
  TrendingUp, TrendingDown, Cpu, Clock, BarChart3,
  Gauge, Info,
} from "lucide-react";

type TimeRange = "7D" | "30D" | "90D";

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

const featureTooltips: Record<string, string> = {
  "Discount Impact": "Measures how promotional pricing affects demand volume across SKUs",
  "Seasonal Effect": "Captures recurring temporal patterns in demand cycles",
  "Zone Effect": "Correlation between zone location and demand patterns",
  "Festival Impact": "Demand uplift during festival/holiday periods",
  "Price Elasticity": "Sensitivity of demand to unit price changes",
};

const Dashboard = () => {
  const { user } = useAuth();
  const isRetailer = user?.role === "retailer";
  const isWarehouse = user?.role === "warehouse";
  
  const [range, setRange] = useState<TimeRange>("7D");

  // ─── Real API Data ───
  const periodMap: Record<TimeRange, string> = { "7D": "7d", "30D": "30d", "90D": "90d" };

  const { data: inventoryData = [], isLoading: invLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: getInventory,
  });
  const safeInventory = Array.isArray(inventoryData) ? inventoryData : [];

  const { data: decisionsData = [], isLoading: decisionsLoading } = useQuery({
    queryKey: ["decisions"],
    queryFn: getDecisions,
  });
  const safeRisk = Array.isArray(decisionsData) ? decisionsData : [];

  const { data: demandTrends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ["analytics-demand-trends", range],
    queryFn: () => getAnalyticsDemandTrends(periodMap[range]),
  });

  const { data: seasonalData = [], isLoading: seasonalLoading } = useQuery({
    queryKey: ["analytics-seasonal"],
    queryFn: getAnalyticsSeasonal,
  });

  const { data: featureImportance = [], isLoading: featuresLoading } = useQuery({
    queryKey: ["analytics-feature-importance"],
    queryFn: getAnalyticsFeatureImportance,
  });

  const { data: warehouseUtil = [], isLoading: warehouseLoading } = useQuery({
    queryKey: ["analytics-warehouse-util"],
    queryFn: getAnalyticsWarehouseUtilization,
  });

  const { data: zonePerformance = [], isLoading: zoneLoading } = useQuery({
    queryKey: ["analytics-zone-performance"],
    queryFn: getAnalyticsZonePerformance,
  });

  const isLoading = invLoading || decisionsLoading || trendsLoading || seasonalLoading || featuresLoading || warehouseLoading || zoneLoading;

  // ─── Derived Metrics (from real data) ───
  const safeTrends = Array.isArray(demandTrends) ? demandTrends : [];

  const totalForecastedDemand = useMemo(() =>
    safeTrends.reduce((sum: number, d: any) => sum + (d.orders ?? 0), 0), [safeTrends]
  );

  // Compute real change: compare latest half vs earlier half of the trend data
  const demandChange = useMemo(() => {
    if (safeTrends.length < 2) return 0;
    const mid = Math.floor(safeTrends.length / 2);
    const recent = safeTrends.slice(mid).reduce((s: number, d: any) => s + (d.orders ?? 0), 0);
    const earlier = safeTrends.slice(0, mid).reduce((s: number, d: any) => s + (d.orders ?? 0), 0);
    return earlier > 0 ? +((recent - earlier) / earlier * 100).toFixed(1) : 0;
  }, [safeTrends]);

  const sparklineData = useMemo(() =>
    safeTrends.slice(-6).map((d: any) => d.orders ?? 0),
    [safeTrends]
  );

  // Seasonal curve from API
  const seasonalCurve = useMemo(() => {
    const safe = Array.isArray(seasonalData) ? seasonalData : [];
    if (safe.length === 0) return [];
    return safe.map((d: any) => ({
      month: d.monthName || `M${d.month}`,
      demand: d.demand ?? 0,
    }));
  }, [seasonalData]);

  // Forecast chart data from demand trends
  const forecastData = useMemo(() => {
    if (safeTrends.length === 0) return [];
    return safeTrends.map((d: any, i: number) => {
      const isForecast = i >= safeTrends.length - 2;
      return {
        date: d.date,
        actual: isForecast ? undefined : d.orders,
        forecast: isForecast ? d.orders : undefined,
        upper: isForecast ? Math.round(d.orders * 1.12) : undefined,
        lower: isForecast ? Math.round(d.orders * 0.88) : undefined,
        bridge: i === safeTrends.length - 3 ? d.orders : undefined,
      };
    });
  }, [safeTrends]);

  // Demand pressure from real data
  const totalStock = useMemo(() =>
    safeInventory.reduce((s: number, i: any) => s + (i.stock || 0), 0), [safeInventory]
  );
  const demandPressure = useMemo(() =>
    totalStock > 0 ? Math.min(Math.round((totalForecastedDemand / totalStock) * 100), 100) : 0,
    [totalForecastedDemand, totalStock]
  );

  // Warehouse zone data from analytics API
  const warehouseData = useMemo(() => {
    const zones = Array.isArray(zonePerformance) ? zonePerformance : [];
    return zones.map((z: any) => {
      const zoneItems = safeInventory.filter((i: any) => i.zone === z.zone);
      const zTotalStock = z.totalStock || zoneItems.reduce((s: number, i: any) => s + (i.stock || 0), 0);
      const avgDemand = z.avgDemand || 1;
      const weeksOfStock = avgDemand > 0 ? Math.round(zTotalStock / avgDemand * 10) / 10 : 0;
      const hasAlert = safeRisk.some((r: any) => r.zone === z.zone);
      const sparkline = safeTrends.slice(-6).map((d: any) => d.orders ?? 0);
      return {
        zone: z.zone,
        items: z.productCount || zoneItems.length,
        totalStock: zTotalStock,
        avgDemand,
        weeksOfStock,
        hasAlert,
        sparkline: sparkline.length > 1 ? sparkline : [0, 0, 0, 0, 0, 0],
      };
    });
  }, [zonePerformance, safeInventory, safeRisk, safeTrends]);

  // Last forecast timestamp (derived from latest trend data)
  const lastForecastTime = useMemo(() => {
    if (safeTrends.length === 0) return "No data";
    const last = safeTrends[safeTrends.length - 1];
    return last?.date || "Latest";
  }, [safeTrends]);

  const riskLevel = safeRisk.length > 2 ? "Elevated" : safeRisk.length > 0 ? "Moderate" : "Low";
  const riskStatus = riskLevel === "Low" ? "online" : riskLevel === "Moderate" ? "warning" : "critical";

  const tooltipStyle = {
    borderRadius: 6,
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    fontSize: 11,
    padding: "8px 12px",
  };

  const safeFeatures = Array.isArray(featureImportance) ? featureImportance : [];

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading operational intelligence...</p>
        </div>
      </AppLayout>
    );
  }

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
                { icon: TrendingUp, label: "Seasonal Signal", value: seasonalCurve.length > 0 ? "Active" : "Loading", status: "online" as const },
                { icon: Clock, label: "Last Data Point", value: lastForecastTime, status: "online" as const },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 px-5 py-2.5 flex-1 min-w-0 ${i > 0 ? "border-l border-border/40" : ""
                    }`}
                >
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase leading-none">{item.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${item.status === "online" ? "bg-success animate-ping" :
                          item.status === "warning" ? "bg-amber animate-ping" : "bg-destructive animate-ping"
                          }`} style={{ animationDuration: "2s" }} />
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${item.status === "online" ? "bg-success" :
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
                      Aggregated Demand · {range}
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
                          <span className="text-[10px] text-muted-foreground">vs prior period</span>
                        </div>
                      </div>
                      {sparklineData.length > 1 && <MiniSparkline data={sparklineData} />}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Demand Pressure Index */}
              {!isRetailer && (
              <motion.div {...cardHover}>
                <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                        Demand vs Stock Ratio
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          Aggregated demand ÷ total stock across all zones. Higher values indicate supply strain.
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
              )}

              {/* SKUs At Risk */}
              {!isRetailer && (
              <motion.div {...cardHover}>
                <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${safeRisk.length > 0 ? "bg-destructive" : "bg-success"}`} />
                  <CardContent className="p-5">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-3">
                      SKUs At Risk
                    </p>
                    <p className="text-[28px] font-display font-bold text-foreground leading-none tracking-tight">
                      {safeRisk.length}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {safeRisk.filter((i: any) => i.status === "critical").length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-5 rounded-sm bg-destructive/80" />
                          <span className="text-[10px] text-muted-foreground">
                            {safeRisk.filter((i: any) => i.status === "critical").length} critical
                          </span>
                        </div>
                      )}
                      {safeRisk.filter((i: any) => i.status === "low").length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-5 rounded-sm bg-amber/80" />
                          <span className="text-[10px] text-muted-foreground">
                            {safeRisk.filter((i: any) => i.status === "low").length} low
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}

              {/* Total Inventory */}
              {!isRetailer && (
              <motion.div {...cardHover}>
                <Card className="border-border/40 bg-card shadow-card overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                        Total Inventory
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[220px]">
                          Total stock units across all zones, warehouses, and products.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[28px] font-display font-bold text-foreground leading-none tracking-tight">
                      {totalStock.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">Across {safeInventory.length} SKU-zone-warehouse entries</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Gauge className="h-3 w-3 text-teal" />
                      <span className="text-[10px] text-teal font-medium">{warehouseData.length} zones active</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}
            </div>
          </motion.div>

          {/* ═══ FORECAST COMMAND PANEL ═══ */}
          {!isWarehouse && (
          <motion.div {...section(0.1)}>
            <Card className="border-border/40 bg-card shadow-card">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-6 pt-6 pb-3">
                  <div>
                    <h3 className="text-base font-display font-semibold text-foreground">
                      Demand Trend Analysis
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Historical demand aggregated weekly from {safeTrends.length} data points
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-primary rounded-full" />
                        Historical
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-teal rounded-full" />
                        Latest
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
                      <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--teal))" fillOpacity={0.08} />
                      <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--card))" fillOpacity={1} />
                      <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#actualGrad)" dot={false} connectNulls={false} />
                      <Area type="monotone" dataKey="forecast" stroke="hsl(var(--teal))" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGrad)" dot={{ r: 3, fill: "hsl(var(--teal))", strokeWidth: 0 }} connectNulls={false} />
                      <Line type="monotone" dataKey="bridge" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} connectNulls={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-4 px-6 pb-5 text-[10px] text-muted-foreground">
                  <span>Data Source: WeeklySales collection</span>
                  <span className="w-px h-3 bg-border/60" />
                  <span>Model: XGBoost (3 quantile regressors)</span>
                  <span className="w-px h-3 bg-border/60" />
                  <span>{safeTrends.length} weeks of data</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}

          {/* ═══ RISK & REORDER + TREND & SEASON ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Risk & Reorder Intelligence */}
            {!isRetailer && (
            <motion.div className="lg:col-span-5" {...section(0.15)}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-display font-semibold text-foreground">Risk & Reorder Intelligence</h3>
              </div>
              <Card className="border-border/40 bg-card shadow-card h-[calc(100%-32px)]">
                <CardContent className="p-4 space-y-3">
                  {safeRisk.length > 0 ? (
                    safeRisk.slice(0, 8).map((item: any, i: number) => (
                      <motion.div
                        key={item.id || i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                        className="flex gap-3 rounded-md bg-muted/20 overflow-hidden"
                      >
                        <div className={`w-1 shrink-0 ${item.status === "critical" ? "bg-destructive" : "bg-amber"}`} />
                        <div className="py-3 pr-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground truncate">{item.product}</p>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.status === "critical"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-amber/10 text-amber"
                              }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-1.5">
                            <span>Zone: {item.zone}</span>
                            <span>SKU: {item.sku}</span>
                            <span>Stock: {item.stock?.toLocaleString()}</span>
                            <span>Avg Weekly: {item.avgWeeklyDemand?.toLocaleString()}</span>
                            <span>Weeks Left: {item.weeksOfStock}</span>
                            <span>Reorder: {item.suggestedReorder?.toLocaleString()}</span>
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
            )}

            {/* Trend & Season Analysis */}
            <motion.div className={isRetailer ? "lg:col-span-12" : "lg:col-span-7"} {...section(0.18)}>
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
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>Avg demand by month across all zones/products</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Importance */}
                <Card className="border-border/40 bg-card shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                        Feature Importance · XGBoost
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[220px]">
                          Computed from actual data variance: discount effect on demand, seasonal variance, zone differences, festival uplift, and price sensitivity.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-3">
                      {safeFeatures.map((f: any) => (
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
                            {featureTooltips[f.feature] || `${f.feature}: ${f.pct}% contribution to demand prediction`}
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
          {!isRetailer && (
          <motion.div {...section(0.22)}>
            <div className="flex items-center gap-2 mb-3">
              <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-sm font-display font-semibold text-foreground">Zone Intelligence Grid</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {warehouseData.map((z: any, i: number) => (
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
                          <p className="text-[10px] text-muted-foreground">Total Stock</p>
                          <p className="text-sm font-display font-bold text-foreground">{z.totalStock.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Avg Demand/wk</p>
                          <p className="text-sm font-display font-bold text-foreground">{z.avgDemand.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-muted-foreground">Weeks of Stock</span>
                        <span className="text-[10px] font-medium text-foreground">{z.weeksOfStock}</span>
                      </div>
                      <TensionBar value={Math.min(z.weeksOfStock * 20, 100)} />

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
          )}

        </div>
      </TooltipProvider>
    </AppLayout>
  );
};

export default Dashboard;
