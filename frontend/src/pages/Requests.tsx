import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supplyRequests, inventoryItems } from "@/data/mock";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, Clock, TrendingUp, TrendingDown,
  Cpu, ChevronDown, Info, Warehouse as WarehouseIcon, Plus,
} from "lucide-react";
import { RequestIntakeDrawer } from "@/components/RequestIntakeDrawer";

/* ── Animation helpers ── */
const section = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
});

/* ── ML-enriched request data derived from existing mock ── */
const mlZones = ["Zone A", "Zone B", "Zone C", "Zone D"];
const mlRecommendations = ["Approve", "Partial Fulfill", "Reallocate Warehouse", "Delay Fulfillment"] as const;
type MLRecommendation = typeof mlRecommendations[number];

interface EnrichedRequest {
  id: string;
  product: string;
  zone: string;
  suggestedWarehouse: string;
  requestedQty: number;
  predictedWeeklyDemand: number;
  projectedStockAfter: number;
  currentStock: number;
  riskLevel: "critical" | "moderate" | "safe" | "neutral";
  mlRecommendation: MLRecommendation;
  status: string;
  date: string;
  forecastAge: string;
  demandImpactScore: number;
  // Decision intelligence
  ifApproved: { shortageDate: string; riskIncrease: number };
  ifSplit: { riskReduction: number; newProjection: number };
  ifDelayed: { demandDrift: number; seasonalAdj: number };
  confidence: number;
}

const enrichedRequests: EnrichedRequest[] = supplyRequests.map((r, i) => {
  const inv = inventoryItems.find(it => it.product === r.product);
  const currentStock = inv?.stock ?? 500;
  const zone = inv?.zone ?? mlZones[i % mlZones.length];
  const predictedDemand = Math.round(r.quantity * (0.8 + Math.random() * 0.4));
  const projectedAfter = Math.max(currentStock - r.quantity, 0);
  const riskLevel: EnrichedRequest["riskLevel"] =
    projectedAfter < 100 ? "critical" :
    projectedAfter < 300 ? "moderate" :
    projectedAfter < 800 ? "safe" : "neutral";
  const recIdx = riskLevel === "critical" ? 2 : riskLevel === "moderate" ? 1 : 0;
  const demandImpact = Math.round((r.quantity / Math.max(currentStock, 1)) * 100);

  return {
    id: r.id,
    product: r.product,
    zone,
    suggestedWarehouse: `WH-${zone.replace("Zone ", "")}${Math.ceil(Math.random() * 3)}`,
    requestedQty: r.quantity,
    predictedWeeklyDemand: predictedDemand,
    projectedStockAfter: projectedAfter,
    currentStock,
    riskLevel,
    mlRecommendation: mlRecommendations[recIdx],
    status: r.status,
    date: r.date,
    forecastAge: `${Math.floor(Math.random() * 20 + 5)}m ago`,
    demandImpactScore: Math.min(demandImpact, 100),
    ifApproved: {
      shortageDate: projectedAfter < 200 ? "~3 days" : projectedAfter < 500 ? "~8 days" : ">14 days",
      riskIncrease: riskLevel === "critical" ? 34 : riskLevel === "moderate" ? 12 : 3,
    },
    ifSplit: {
      riskReduction: riskLevel === "critical" ? 41 : riskLevel === "moderate" ? 22 : 8,
      newProjection: Math.round(projectedAfter + r.quantity * 0.4),
    },
    ifDelayed: {
      demandDrift: Math.round((Math.random() * 8 + 2) * 10) / 10,
      seasonalAdj: Math.round((Math.random() * 5 - 2) * 10) / 10,
    },
    confidence: Math.round(88 + Math.random() * 10),
  };
});

/* ── Severity color map ── */
const severityBar: Record<string, string> = {
  critical: "bg-destructive",
  moderate: "bg-amber",
  safe: "bg-primary",
  neutral: "bg-muted-foreground/30",
};
const severityBadge: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  moderate: "bg-amber/10 text-amber border-amber/20",
  safe: "bg-primary/10 text-primary border-primary/20",
  neutral: "bg-muted text-muted-foreground border-border",
};
const recBadge: Record<string, string> = {
  Approve: "bg-success/10 text-success border-success/20",
  "Partial Fulfill": "bg-amber/10 text-amber border-amber/20",
  "Reallocate Warehouse": "bg-primary/10 text-primary border-primary/20",
  "Delay Fulfillment": "bg-destructive/10 text-destructive border-destructive/20",
};
const statusBadge: Record<string, string> = {
  pending: "bg-amber/10 text-amber border-amber/20",
  approved: "bg-teal/10 text-teal border-teal/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ── Stock Projection Bar ── */
const StockBar = ({ current, projected, max }: { current: number; projected: number; max: number }) => {
  const cap = Math.max(max, current, 1);
  const curPct = Math.min((current / cap) * 100, 100);
  const projPct = Math.min((projected / cap) * 100, 100);
  const isLow = projected < max * 0.15;
  return (
    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden relative">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/25"
        initial={{ width: 0 }}
        animate={{ width: `${curPct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${isLow ? "bg-destructive/70" : "bg-primary/60"}`}
        initial={{ width: 0 }}
        animate={{ width: `${projPct}%` }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
      />
    </div>
  );
};

/* ── Utilization Bar (side panel) ── */
const UtilBar = ({ value, label }: { value: number; label: string }) => {
  const color = value > 85 ? "bg-destructive" : value > 65 ? "bg-amber" : "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}%</span>
      </div>
      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

/* ── Mini Sparkline ── */
const Spark = ({ data }: { data: number[] }) => (
  <svg viewBox="0 0 48 16" className="w-12 h-4" preserveAspectRatio="none">
    <polyline
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="1.2"
      strokeLinecap="round"
      points={data.map((v, i) => {
        const max = Math.max(...data); const min = Math.min(...data);
        const range = max - min || 1;
        return `${(i / (data.length - 1)) * 48},${14 - ((v - min) / range) * 12}`;
      }).join(" ")}
    />
  </svg>
);

interface RequestsProps {
  initialIntakeOpen?: boolean;
}

const Requests = ({ initialIntakeOpen = false }: RequestsProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(initialIntakeOpen);

  const metrics = useMemo(() => {
    const total = enrichedRequests.length;
    const mlFlagged = enrichedRequests.filter(r => r.riskLevel === "critical" || r.riskLevel === "moderate").length;
    const shortageRisk = enrichedRequests.filter(r => r.riskLevel === "critical").length;
    const avgImpact = Math.round(enrichedRequests.reduce((s, r) => s + r.demandImpactScore, 0) / total);
    return { total, mlFlagged, shortageRisk, avgImpact };
  }, []);

  const selectedReq = enrichedRequests.find(r => r.id === selectedRow);

  const warehouseImpact = useMemo(() => {
    if (!selectedReq) return [];
    return mlZones.map(z => {
      const items = inventoryItems.filter(i => i.zone === z);
      const stock = items.reduce((s, i) => s + i.stock, 0);
      const cap = items.reduce((s, i) => s + i.minStock * 3, 0) || 1;
      const base = Math.round((stock / cap) * 100);
      const afterApproval = selectedReq.zone === z
        ? Math.min(base + Math.round((selectedReq.requestedQty / cap) * 20), 100)
        : base;
      return { zone: z, utilization: base, afterApproval, sparkline: [base - 8, base - 3, base + 2, base] };
    });
  }, [selectedRow]);

  const handleRowClick = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
    setSelectedRow(id);
  };

  return (
    <AppLayout title="Requests">
      <TooltipProvider delayDuration={200}>
        <div className="space-y-5 max-w-[1600px]">

          {/* ═══ PAGE HEADER WITH CREATE BUTTON ═══ */}
          <div className="flex items-center justify-between">
            <div />
            <Button
              onClick={() => setIntakeOpen(true)}
              className="h-9 gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Request
            </Button>
          </div>

          <RequestIntakeDrawer open={intakeOpen} onOpenChange={setIntakeOpen} />

          {/* ═══ GLOBAL INTELLIGENCE STRIP ═══ */}
          <motion.div {...section(0)}>
            <div className="flex items-center gap-0 rounded-lg bg-card border border-border/40 overflow-hidden shadow-[var(--shadow-card)]">
              {[
                { icon: Activity, label: "Active Requests", value: String(metrics.total), status: "online" as const, pulse: false },
                { icon: AlertTriangle, label: "ML Flagged Risk", value: String(metrics.mlFlagged), status: metrics.mlFlagged > 2 ? "warning" as const : "online" as const, pulse: metrics.mlFlagged > 2 },
                { icon: AlertTriangle, label: "Shortage Risk", value: String(metrics.shortageRisk), status: metrics.shortageRisk > 0 ? "critical" as const : "online" as const, pulse: metrics.shortageRisk > 0 },
                { icon: Cpu, label: "Avg Demand Impact", value: `${metrics.avgImpact}%`, status: metrics.avgImpact > 60 ? "warning" as const : "online" as const, pulse: false },
                { icon: Clock, label: "Last Forecast", value: "2026-03-01 06:42 UTC", status: "online" as const, pulse: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-5 py-2.5 flex-1 min-w-0 ${i > 0 ? "border-l border-border/40" : ""}`}>
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase leading-none">{item.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        {item.pulse && (
                          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                            item.status === "online" ? "bg-success" : item.status === "warning" ? "bg-amber" : "bg-destructive"
                          }`} style={{ animationDuration: "2.5s" }} />
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          item.status === "online" ? "bg-success" : item.status === "warning" ? "bg-amber" : "bg-destructive"
                        }`} />
                      </span>
                      <p className="text-xs font-medium text-foreground truncate">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ═══ MAIN CONTENT: TABLE + SIDE PANEL ═══ */}
          <div className="flex gap-5">

            {/* ── Request Grid ── */}
            <motion.div {...section(0.08)} className="flex-1 min-w-0">
              <Card className="border-border/40 bg-card shadow-[var(--shadow-card)] overflow-hidden">
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-display font-semibold text-foreground">Request Intelligence Queue</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">ML-enriched operational requests · Click to expand decision panel</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {enrichedRequests.length} entries
                  </div>
                </div>

                <CardContent className="p-0">
                  {/* Header */}
                  <div className="grid grid-cols-[40px_minmax(0,1fr)_70px_80px_70px_90px_100px_80px_120px_80px] gap-0 px-5 py-2 border-y border-border/40 bg-muted/30">
                    {["", "Product", "Zone", "Warehouse", "Qty", "Pred. Demand", "Stock Projection", "Risk", "ML Action", "Status"].map((h, i) => (
                      <span key={i} className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">{h}</span>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-border/30">
                    {enrichedRequests.map((req, idx) => (
                      <div key={req.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                          onClick={() => handleRowClick(req.id)}
                          className={`grid grid-cols-[40px_minmax(0,1fr)_70px_80px_70px_90px_100px_80px_120px_80px] gap-0 px-5 py-3 items-center cursor-pointer transition-all duration-200 relative group ${
                            expandedRow === req.id ? "bg-muted/40" : "hover:bg-muted/20"
                          }`}
                          whileHover={{ y: -2 }}
                        >
                          {/* Severity Strip */}
                          <div className="flex items-center">
                            <div className={`w-[3px] h-8 rounded-full ${severityBar[req.riskLevel]}`} />
                          </div>

                          {/* Product */}
                          <div className="min-w-0 pr-2">
                            <p className="text-sm font-medium text-foreground truncate">{req.product}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{req.id}</p>
                          </div>

                          {/* Zone */}
                          <span className="text-xs text-muted-foreground">{req.zone}</span>

                          {/* Warehouse */}
                          <span className="text-xs text-foreground font-mono">{req.suggestedWarehouse}</span>

                          {/* Qty */}
                          <span className="text-xs text-foreground font-medium">{req.requestedQty.toLocaleString()}</span>

                          {/* Predicted Demand */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-foreground">{req.predictedWeeklyDemand.toLocaleString()}</span>
                            <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />
                          </div>

                          {/* Stock Projection */}
                          <div className="space-y-1">
                            <StockBar current={req.currentStock} projected={req.projectedStockAfter} max={req.currentStock} />
                            <span className="text-[10px] text-muted-foreground">{req.projectedStockAfter.toLocaleString()} left</span>
                          </div>

                          {/* Risk */}
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border capitalize w-fit ${severityBadge[req.riskLevel]}`}>
                            {req.riskLevel}
                          </span>

                          {/* ML Action */}
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border w-fit ${recBadge[req.mlRecommendation]}`}>
                            {req.mlRecommendation}
                          </span>

                          {/* Status */}
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border capitalize ${statusBadge[req.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                              {req.status}
                            </span>
                            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${expandedRow === req.id ? "rotate-180" : ""}`} />
                          </div>
                        </motion.div>

                        {/* ── Expanded Decision Intelligence Panel ── */}
                        <AnimatePresence>
                          {expandedRow === req.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                              className="overflow-hidden"
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: 0.12 }}
                                className="px-5 pb-4 pt-1"
                              >
                                <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-display font-semibold text-foreground tracking-wide">Decision Intelligence Panel</h4>
                                    <span className="text-[10px] text-muted-foreground">Forecast computed {req.forecastAge}</span>
                                  </div>

                                  <div className="grid grid-cols-4 gap-4">
                                    {/* If Approved */}
                                    <div className="space-y-2 p-3 rounded-md bg-card/60 border border-border/20">
                                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">If Approved Fully</p>
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">Shortage ETA</span>
                                          <span className="text-foreground font-medium">{req.ifApproved.shortageDate}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">Risk Increase</span>
                                          <span className="text-destructive font-medium">+{req.ifApproved.riskIncrease}%</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* If Split */}
                                    <div className="space-y-2 p-3 rounded-md bg-card/60 border border-border/20">
                                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">If Split Warehouses</p>
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">Risk Reduction</span>
                                          <span className="text-success font-medium">-{req.ifSplit.riskReduction}%</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">New Projection</span>
                                          <span className="text-foreground font-medium">{req.ifSplit.newProjection.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* If Delayed */}
                                    <div className="space-y-2 p-3 rounded-md bg-card/60 border border-border/20">
                                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">If Delayed 1 Week</p>
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">Demand Drift</span>
                                          <span className="text-foreground font-medium">{req.ifDelayed.demandDrift}%</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">Seasonal Adj</span>
                                          <span className={`font-medium ${req.ifDelayed.seasonalAdj >= 0 ? "text-amber" : "text-success"}`}>
                                            {req.ifDelayed.seasonalAdj > 0 ? "+" : ""}{req.ifDelayed.seasonalAdj}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Confidence */}
                                    <div className="space-y-2 p-3 rounded-md bg-card/60 border border-border/20">
                                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Recommendation Confidence</p>
                                      <p className="text-2xl font-display font-bold text-foreground leading-none">{req.confidence}%</p>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 cursor-help">
                                            <Info className="h-2.5 w-2.5 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">How is this calculated?</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-xs max-w-[220px]">
                                          Demand Impact Score = (Requested Qty ÷ Current Stock) × 100, weighted by seasonal adjustment and warehouse capacity factors.
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Side Impact Panel ── */}
            <motion.div {...section(0.15)} className="w-64 shrink-0 hidden xl:block">
              <Card className="border-border/40 bg-card shadow-[var(--shadow-card)] sticky top-6">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-display font-semibold text-foreground tracking-wide">Warehouse Impact</h3>
                  </div>

                  {!selectedReq ? (
                    <p className="text-[11px] text-muted-foreground">Select a request to view warehouse capacity impact analysis.</p>
                  ) : (
                    <>
                      <p className="text-[10px] text-muted-foreground">
                        Impact analysis for <span className="text-foreground font-medium">{selectedReq.id}</span>
                      </p>

                      <div className="space-y-3">
                        {warehouseImpact.map((w) => (
                          <div key={w.zone} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-foreground font-medium">{w.zone}</span>
                              <Spark data={w.sparkline} />
                            </div>
                            <UtilBar value={w.utilization} label="Current" />
                            {selectedReq.zone === w.zone && (
                              <UtilBar value={w.afterApproval} label="After Approval" />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-border/30">
                        <p className="text-[10px] text-muted-foreground">
                          <span className="text-foreground font-medium">{selectedReq.zone}</span> utilization change shown if request is approved at full quantity.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

        </div>
      </TooltipProvider>
    </AppLayout>
  );
};

export default Requests;
