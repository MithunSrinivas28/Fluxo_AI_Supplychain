import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { getRequests, getInventory } from "@/services/api";
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

/* ── Real request data from backend (no Math.random) ── */
interface RequestItem {
  id: string;
  product: string;
  sku: string;
  zone: string;
  warehouse: string;
  requestedQty: number;
  forecast: number;
  lowerBound: number;
  upperBound: number;
  riskLevel: string;
  status: string;
  date: string;
  category: string;
  fulfilledQuantity: number;
  currentStock: number;
}

function mapRequests(requests: any[], inventoryItems: any[]): RequestItem[] {
  return requests.map((r: any, i: number) => {
    // Find matching inventory for stock info
    const inv = inventoryItems.find((it: any) =>
      it.sku === r.sku && it.zone === r.zone && it.warehouse === r.warehouse
    ) || inventoryItems.find((it: any) => it.sku === r.sku);

    return {
      id: r._id || r.id || `REQ-${i}`,
      product: r.product || r.sku || "Unknown",
      sku: r.sku || "",
      zone: r.zone || "North",
      warehouse: r.warehouse || "A",
      requestedQty: r.requested_quantity || r.requestedQty || 0,
      forecast: Math.round(r.forecast || 0),
      lowerBound: Math.round(r.lower_bound || 0),
      upperBound: Math.round(r.upper_bound || 0),
      riskLevel: r.risk_level || "Balanced",
      status: r.status || "pending",
      date: r.createdAt || r.order_date || new Date().toISOString(),
      category: r.category || "",
      fulfilledQuantity: r.fulfilledQuantity || 0,
      currentStock: inv?.stock || 0,
    };
  });
}

/* ── Severity color map ── */
const riskBadge: Record<string, string> = {
  "High Overstock Risk": "bg-destructive/10 text-destructive border-destructive/20",
  "Understock Risk": "bg-amber/10 text-amber border-amber/20",
  "Balanced": "bg-primary/10 text-primary border-primary/20",
};
const statusBadge: Record<string, string> = {
  pending: "bg-amber/10 text-amber border-amber/20",
  PARTIAL: "bg-amber/10 text-amber border-amber/20",
  FULFILLED: "bg-teal/10 text-teal border-teal/20",
  approved: "bg-teal/10 text-teal border-teal/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ── Stock Projection Bar ── */
const StockBar = ({ current, fulfilled, max }: { current: number; fulfilled: number; max: number }) => {
  const cap = Math.max(max, current, 1);
  const curPct = Math.min((current / cap) * 100, 100);
  const fulfilledPct = Math.min((fulfilled / cap) * 100, 100);
  return (
    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden relative">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/25"
        initial={{ width: 0 }}
        animate={{ width: `${curPct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
        initial={{ width: 0 }}
        animate={{ width: `${fulfilledPct}%` }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
      />
    </div>
  );
};

interface RequestsProps {
  initialIntakeOpen?: boolean;
}

const Requests = ({ initialIntakeOpen = false }: RequestsProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(initialIntakeOpen);

  const { data: requestsData = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: getRequests,
  });
  const requests = Array.isArray(requestsData) ? requestsData : (requestsData as any)?.data || [];

  const { data: inventoryData = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: getInventory,
  });
  const inventoryItems = Array.isArray(inventoryData) ? inventoryData : [];

  const mappedRequests = useMemo(() =>
    mapRequests(requests, inventoryItems),
    [requests, inventoryItems]
  );

  const metrics = useMemo(() => {
    const total = mappedRequests.length;
    const atRisk = mappedRequests.filter(r => r.riskLevel !== "Balanced").length;
    const fulfilled = mappedRequests.filter(r => r.status === "FULFILLED").length;
    const partial = mappedRequests.filter(r => r.status === "PARTIAL").length;
    return { total, atRisk, fulfilled, partial };
  }, [mappedRequests]);

  const handleRowClick = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
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
                { icon: Activity, label: "Total Requests", value: String(metrics.total), status: "online" as const },
                { icon: AlertTriangle, label: "Risk Flagged", value: String(metrics.atRisk), status: metrics.atRisk > 2 ? "warning" as const : "online" as const },
                { icon: TrendingUp, label: "Fulfilled", value: String(metrics.fulfilled), status: "online" as const },
                { icon: Clock, label: "Partial", value: String(metrics.partial), status: metrics.partial > 0 ? "warning" as const : "online" as const },
                { icon: Cpu, label: "Model", value: "XGBoost Quantile", status: "online" as const },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-5 py-2.5 flex-1 min-w-0 ${i > 0 ? "border-l border-border/40" : ""}`}>
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase leading-none">{item.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${item.status === "online" ? "bg-success" : item.status === "warning" ? "bg-amber" : "bg-destructive"}`} />
                      </span>
                      <p className="text-xs font-medium text-foreground truncate">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ═══ REQUEST TABLE ═══ */}
          <motion.div {...section(0.08)}>
            <Card className="border-border/40 bg-card shadow-[var(--shadow-card)] overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-display font-semibold text-foreground">Request Queue</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Real ML predictions from XGBoost · Click to expand</p>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {mappedRequests.length} entries
                </div>
              </div>

              <CardContent className="p-0">
                {/* Header */}
                <div className="grid grid-cols-[40px_minmax(0,1fr)_70px_60px_70px_90px_100px_110px_80px] gap-0 px-5 py-2 border-y border-border/40 bg-muted/30">
                  {["", "Product / SKU", "Zone", "WH", "Qty", "ML Forecast", "Stock", "Risk Level", "Status"].map((h, i) => (
                    <span key={i} className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">{h}</span>
                  ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-border/30">
                  {mappedRequests.map((req, idx) => (
                    <div key={req.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
                        onClick={() => handleRowClick(req.id)}
                        className={`grid grid-cols-[40px_minmax(0,1fr)_70px_60px_70px_90px_100px_110px_80px] gap-0 px-5 py-3 items-center cursor-pointer transition-all duration-200 relative group ${expandedRow === req.id ? "bg-muted/40" : "hover:bg-muted/20"
                          }`}
                      >
                        {/* Severity Strip */}
                        <div className="flex items-center">
                          <div className={`w-[3px] h-8 rounded-full ${req.riskLevel === "High Overstock Risk" ? "bg-destructive" :
                            req.riskLevel === "Understock Risk" ? "bg-amber" : "bg-primary"
                            }`} />
                        </div>

                        {/* Product */}
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-medium text-foreground truncate">{req.product || req.sku}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{req.sku}</p>
                        </div>

                        {/* Zone */}
                        <span className="text-xs text-muted-foreground">{req.zone}</span>

                        {/* Warehouse */}
                        <span className="text-xs text-foreground font-mono">{req.warehouse}</span>

                        {/* Qty */}
                        <span className="text-xs text-foreground font-medium">{req.requestedQty.toLocaleString()}</span>

                        {/* ML Forecast */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-foreground">{req.forecast.toLocaleString()}</span>
                          <span className="text-[9px] text-muted-foreground">
                            [{req.lowerBound}-{req.upperBound}]
                          </span>
                        </div>

                        {/* Stock */}
                        <div className="space-y-1">
                          <StockBar current={req.currentStock} fulfilled={req.fulfilledQuantity} max={req.currentStock + req.requestedQty} />
                          <span className="text-[10px] text-muted-foreground">{req.currentStock.toLocaleString()} left</span>
                        </div>

                        {/* Risk */}
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border w-fit ${riskBadge[req.riskLevel] || "bg-muted text-muted-foreground border-border"
                          }`}>
                          {req.riskLevel === "High Overstock Risk" ? "Overstock" :
                            req.riskLevel === "Understock Risk" ? "Understock" : "Balanced"}
                        </span>

                        {/* Status */}
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border capitalize ${statusBadge[req.status] ?? "bg-muted text-muted-foreground border-border"
                            }`}>
                            {req.status}
                          </span>
                          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${expandedRow === req.id ? "rotate-180" : ""}`} />
                        </div>
                      </motion.div>

                      {/* ── Expanded Detail Panel ── */}
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
                                <h4 className="text-xs font-display font-semibold text-foreground tracking-wide mb-3">ML Prediction Detail</h4>
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="space-y-1 p-3 rounded-md bg-card/60 border border-border/20">
                                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Forecast</p>
                                    <p className="text-lg font-display font-bold text-foreground">{req.forecast.toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground">units/week predicted</p>
                                  </div>
                                  <div className="space-y-1 p-3 rounded-md bg-card/60 border border-border/20">
                                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Confidence Interval</p>
                                    <p className="text-lg font-display font-bold text-foreground">{req.lowerBound} – {req.upperBound}</p>
                                    <p className="text-[10px] text-muted-foreground">lower – upper bound</p>
                                  </div>
                                  <div className="space-y-1 p-3 rounded-md bg-card/60 border border-border/20">
                                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Fulfillment</p>
                                    <p className="text-lg font-display font-bold text-foreground">{req.fulfilledQuantity.toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground">of {req.requestedQty.toLocaleString()} requested</p>
                                  </div>
                                  <div className="space-y-1 p-3 rounded-md bg-card/60 border border-border/20">
                                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Category</p>
                                    <p className="text-lg font-display font-bold text-foreground capitalize">{req.category}</p>
                                    <p className="text-[10px] text-muted-foreground">Created {new Date(req.date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {mappedRequests.length === 0 && (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No requests yet. Create one to see ML predictions.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </TooltipProvider>
    </AppLayout>
  );
};

export default Requests;
