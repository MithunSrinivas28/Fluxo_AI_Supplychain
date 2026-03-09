import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { inventoryItems as initialItems, warehousesByZone } from "@/data/mock";
import type { InventoryItem, InventoryTransaction } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, AlertTriangle, TrendingDown, Sparkles, ChevronDown, ChevronRight,
  Plus, Minus, Settings2, Trash2, Search
} from "lucide-react";

/* ──────────── helpers ──────────── */
const fmt = (n: number) => n.toLocaleString();
const ago = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const computeStatus = (stock: number, min: number, addedDate: string): InventoryItem["status"] => {
  const daysSinceAdded = (Date.now() - new Date(addedDate).getTime()) / 86400000;
  if (daysSinceAdded <= 7) return "new";
  if (stock <= min * 0.5) return "critical";
  if (stock <= min) return "low";
  return "healthy";
};

const severityColor: Record<string, string> = {
  healthy: "bg-success",
  low: "bg-amber",
  critical: "bg-destructive",
  new: "bg-primary",
};

const section = (delay: number) => ({
  initial: { opacity: 0, y: 10 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

/* ──────────── component ──────────── */
const Inventory = () => {
  const zones = Object.keys(warehousesByZone);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item: InventoryItem | null; mode: "add" | "remove" | "threshold" | "delete" }>({ open: false, item: null, mode: "add" });
  const [adjustQty, setAdjustQty] = useState("");
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(new Set());

  const warehouses = selectedZone === "all" ? Object.values(warehousesByZone).flat() : (warehousesByZone[selectedZone] ?? []);

  const filtered = useMemo(() => {
    let list = items;
    if (selectedZone !== "all") list = list.filter(i => i.zone === selectedZone);
    if (selectedWarehouse !== "all") list = list.filter(i => i.warehouse === selectedWarehouse);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.product.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    return list;
  }, [items, selectedZone, selectedWarehouse, searchQuery]);

  const totalSKUs = filtered.length;
  const totalUnits = filtered.reduce((s, i) => s + i.stock, 0);
  const lowCount = filtered.filter(i => i.status === "low" || i.status === "critical").length;
  const newCount = filtered.filter(i => i.status === "new").length;

  /* ── stock adjustment ── */
  const handleAdjust = () => {
    if (!adjustModal.item) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) return;
    const id = adjustModal.item.id;

    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      let newStock = item.stock;
      let newMin = item.minStock;
      let txType: InventoryTransaction["type"] = "adjustment";
      let txSource = "Manual Adjustment";
      let txQty = qty;

      if (adjustModal.mode === "add") {
        newStock = item.stock + qty;
        txType = "inbound";
        txSource = "Manual Inbound";
      } else if (adjustModal.mode === "remove") {
        newStock = Math.max(0, item.stock - qty);
        txType = "outbound";
        txSource = "Outbound (Sale)";
        txQty = -qty;
      } else if (adjustModal.mode === "threshold") {
        newMin = qty;
        txSource = `Threshold updated to ${qty}`;
        txQty = 0;
      }

      const tx: InventoryTransaction = {
        id: `TX-${Date.now()}`,
        date: new Date().toISOString(),
        type: txType,
        source: txSource,
        quantity: txQty,
        updatedBy: "Warehouse Manager",
      };

      const updated: InventoryItem = {
        ...item,
        stock: newStock,
        minStock: newMin,
        lastUpdated: new Date().toISOString(),
        transactions: [tx, ...item.transactions],
        status: computeStatus(newStock, newMin, item.addedDate),
      };
      return updated;
    }));

    // highlight row briefly
    setHighlightedRows(prev => new Set(prev).add(id));
    setTimeout(() => setHighlightedRows(prev => { const n = new Set(prev); n.delete(id); return n; }), 2000);

    setAdjustModal({ open: false, item: null, mode: "add" });
    setAdjustQty("");
  };

  const handleDelete = () => {
    if (!adjustModal.item) return;
    setItems(prev => prev.filter(i => i.id !== adjustModal.item!.id));
    setAdjustModal({ open: false, item: null, mode: "add" });
  };

  const openAdjust = (item: InventoryItem, mode: "add" | "remove" | "threshold" | "delete") => {
    setAdjustModal({ open: true, item, mode });
    setAdjustQty("");
  };

  return (
    <AppLayout title="Inventory">
      <div className="space-y-5">

        {/* ───── ZONE / WAREHOUSE FILTER ───── */}
        <motion.div {...section(0)} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Zone</Label>
            <Select value={selectedZone} onValueChange={v => { setSelectedZone(v); setSelectedWarehouse("all"); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Warehouse</Label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[170px] h-8 text-xs bg-card border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search product or SKU…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-[200px] text-xs bg-card border-border/60"
            />
          </div>
        </motion.div>

        {/* ───── SUMMARY BAR ───── */}
        <motion.div {...section(0.08)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Package, label: "Total SKUs", value: totalSKUs, color: "text-primary" },
            { icon: Package, label: "Total Units", value: fmt(totalUnits), color: "text-foreground" },
            { icon: AlertTriangle, label: "Low Stock Items", value: lowCount, color: "text-amber" },
            { icon: Sparkles, label: "Newly Added", value: newCount, color: "text-primary" },
          ].map((m, i) => (
            <Card key={i} className="border-border/40 shadow-none bg-card/80">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-md bg-muted/60 ${m.color}`}>
                  <m.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{m.label}</p>
                  <p className="text-lg font-display font-bold leading-tight">{m.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* ───── INVENTORY TABLE ───── */}
        <motion.div {...section(0.16)}>
          <Card className="border-border/40 shadow-none bg-card/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    {["", "Product", "Category", "Current Stock", "Min Threshold", "Status", "Last Updated", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((item, idx) => {
                      const isExpanded = expandedRow === item.id;
                      const isHighlighted = highlightedRows.has(item.id);
                      const isCritical = item.status === "critical";
                      return (
                        <motion.tr
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.3, delay: idx * 0.04 }}
                          className="group relative border-b border-border/30 cursor-pointer"
                          style={{ position: "relative" }}
                        >
                          {/* severity strip */}
                          <td className="w-1 p-0 relative">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${severityColor[item.status]}`} />
                          </td>

                          {/* product */}
                          <td className="px-4 py-3" onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                              <div>
                                <p className="font-medium text-foreground">{item.product}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">{item.sku}</p>
                              </div>
                            </div>
                          </td>

                          {/* category */}
                          <td className="px-4 py-3 text-muted-foreground text-xs">{item.category}</td>

                          {/* stock */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <motion.span
                                key={item.stock}
                                initial={{ scale: 1.15, color: isHighlighted ? "hsl(var(--success))" : undefined }}
                                animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                                transition={{ duration: 0.6 }}
                                className="font-bold tabular-nums"
                              >
                                {fmt(item.stock)}
                              </motion.span>
                              {isHighlighted && (
                                <motion.span
                                  initial={{ opacity: 0, x: -4 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="text-[9px] text-success font-medium"
                                >
                                  Inbound
                                </motion.span>
                              )}
                            </div>
                            {/* stock bar */}
                            <div className="mt-1 w-24">
                              <Progress
                                value={Math.min(100, (item.stock / (item.minStock * 2)) * 100)}
                                className={`h-1 ${isCritical ? "[&>div]:bg-destructive" : item.status === "low" ? "[&>div]:bg-amber" : "[&>div]:bg-success"}`}
                              />
                            </div>
                          </td>

                          {/* min threshold */}
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">{fmt(item.minStock)}</td>

                          {/* status */}
                          <td className="px-4 py-3"><StatusBadge status={item.status} /></td>

                          {/* last updated */}
                          <td className="px-4 py-3 text-xs text-muted-foreground">{ago(item.lastUpdated)}</td>

                          {/* actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <TooltipProvider delayDuration={200}>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openAdjust(item, "add"); }}>
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent side="top" className="text-xs">Add Stock</TooltipContent></Tooltip>

                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openAdjust(item, "remove"); }}>
                                    <Minus className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent side="top" className="text-xs">Reduce Stock</TooltipContent></Tooltip>

                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openAdjust(item, "threshold"); }}>
                                    <Settings2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent side="top" className="text-xs">Edit Threshold</TooltipContent></Tooltip>

                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); openAdjust(item, "delete"); }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent side="top" className="text-xs">Remove SKU</TooltipContent></Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>

                  {/* ── expanded transaction rows ── */}
                  {filtered.map(item => expandedRow === item.id && (
                    <tr key={`${item.id}-exp`}>
                      <td colSpan={8} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden bg-muted/30 border-b border-border/30"
                        >
                          <div className="px-8 py-4">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                              Transaction History — {item.product}
                            </p>
                            {item.transactions.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No transactions recorded.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border/40">
                                    {["Date", "Type", "Source", "Qty Change", "Updated By"].map(h => (
                                      <th key={h} className="px-3 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.transactions.map((tx, ti) => (
                                    <motion.tr
                                      key={tx.id}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: ti * 0.05, duration: 0.25 }}
                                      className="border-b border-border/20"
                                    >
                                      <td className="px-3 py-2 text-muted-foreground">{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                      <td className="px-3 py-2">
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                                          ${tx.type === "inbound" ? "bg-success/10 text-success" : tx.type === "outbound" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                                          {tx.type === "inbound" ? "↑" : tx.type === "outbound" ? "↓" : "±"} {tx.type}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">{tx.source}</td>
                                      <td className={`px-3 py-2 font-mono font-medium ${tx.quantity > 0 ? "text-success" : tx.quantity < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                        {tx.quantity > 0 ? `+${fmt(tx.quantity)}` : fmt(tx.quantity)}
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">{tx.updatedBy}</td>
                                    </motion.tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Pipeline indicator */}
        <motion.div {...section(0.24)} className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Request Approval Pipeline Active — Approved requests automatically update warehouse inventory
        </motion.div>
      </div>

      {/* ───── STOCK ADJUSTMENT MODAL ───── */}
      <Dialog open={adjustModal.open} onOpenChange={o => !o && setAdjustModal({ open: false, item: null, mode: "add" })}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-sm font-display">
              {adjustModal.mode === "add" && "Add Stock (Inbound)"}
              {adjustModal.mode === "remove" && "Reduce Stock (Outbound)"}
              {adjustModal.mode === "threshold" && "Edit Minimum Threshold"}
              {adjustModal.mode === "delete" && "Remove SKU"}
            </DialogTitle>
          </DialogHeader>

          {adjustModal.item && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-md p-3">
                <p className="text-sm font-medium">{adjustModal.item.product}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{adjustModal.item.sku} · {adjustModal.item.warehouse}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Current: <strong className="text-foreground">{fmt(adjustModal.item.stock)}</strong></span>
                  <span>Min: <strong className="text-foreground">{fmt(adjustModal.item.minStock)}</strong></span>
                </div>
              </div>

              {adjustModal.mode === "delete" ? (
                <p className="text-sm text-muted-foreground">
                  This will permanently remove <strong>{adjustModal.item.product}</strong> from this warehouse. This action cannot be undone.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">
                    {adjustModal.mode === "add" && "Quantity to Add"}
                    {adjustModal.mode === "remove" && "Quantity to Remove"}
                    {adjustModal.mode === "threshold" && "New Minimum Threshold"}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter quantity"
                    value={adjustQty}
                    onChange={e => setAdjustQty(e.target.value)}
                    className="bg-background border-border/60"
                  />
                  {adjustModal.mode === "remove" && adjustQty && parseInt(adjustQty) > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Projected stock: <strong className={
                        (adjustModal.item.stock - parseInt(adjustQty)) <= adjustModal.item.minStock * 0.5
                          ? "text-destructive"
                          : (adjustModal.item.stock - parseInt(adjustQty)) <= adjustModal.item.minStock
                            ? "text-amber"
                            : "text-success"
                      }>
                        {fmt(Math.max(0, adjustModal.item.stock - parseInt(adjustQty)))}
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAdjustModal({ open: false, item: null, mode: "add" })}>
              Cancel
            </Button>
            {adjustModal.mode === "delete" ? (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Remove SKU
              </Button>
            ) : (
              <Button size="sm" onClick={handleAdjust} disabled={!adjustQty || parseInt(adjustQty) <= 0}>
                {adjustModal.mode === "add" ? "Add Stock" : adjustModal.mode === "remove" ? "Remove Stock" : "Update Threshold"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Inventory;
