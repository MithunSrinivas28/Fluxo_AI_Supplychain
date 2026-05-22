import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon, Upload, FileText, MessageSquare, Cpu,
  AlertTriangle, CheckCircle2, XCircle, ArrowRight, Sparkles,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInventory, getProducts, createRequest, parseNLP, postMLPreview, bulkUploadRequests } from "@/services/api";

/* ── Types ── */
type InputMode = "structured" | "bulk" | "natural";

interface RequestPayload {
  sku: string;
  requested_quantity: number;
  zone: string;
  warehouse?: string;
  priority?: string;
}

interface MLPreview {
  forecast: number;
  lower_bound: number;
  upper_bound: number;
  currentStock: number;
  product_name: string;
  category: string;
  lag_1: number;
  lag_2: number;
  fallback?: boolean;
}

interface BulkRow {
  product_id: string;
  zone: string;
  warehouse: string;
  requested_quantity: number;
  expected_delivery_date: string;
  price: number;
  discount_percent: number;
  festival_flag: boolean;
  valid: boolean;
  error?: string;
}

/* ── Constants ── */
const zones = ["North", "South", "East", "West"];
const warehouses = ["A", "B", "C"];

/* ── Animation config ── */
const fieldAnim = (i: number) => ({
  initial: { opacity: 0, x: 12 } as const,
  animate: { opacity: 1, x: 0 } as const,
  transition: { duration: 0.3, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
});

const riskColor: Record<string, string> = {
  critical: "text-destructive",
  moderate: "text-amber",
  safe: "text-success",
};
const riskBg: Record<string, string> = {
  critical: "bg-destructive/10 border-destructive/20",
  moderate: "bg-amber/10 border-amber/20",
  safe: "bg-success/10 border-success/20",
};

/* ── Component ── */
interface RequestIntakeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestIntakeDrawer = ({ open, onOpenChange }: RequestIntakeDrawerProps) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<InputMode>("structured");
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: inventoryData = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: getInventory
  });
  const inventoryItems = Array.isArray(inventoryData) ? inventoryData : [];

  const { data: productsData = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts
  });
  const products = Array.isArray(productsData) ? productsData : [];

  // Structured form state
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [zone, setZone] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [festival, setFestival] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [mlPreview, setMlPreview] = useState<MLPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Bulk state
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState("");

  // NL state
  const [nlText, setNlText] = useState("");
  const [nlParsed, setNlParsed] = useState<Record<string, string> | null>(null);
  const [nlIsParsing, setNlIsParsing] = useState(false);

  const category = useMemo(() => {
    const p = inventoryItems.find((p: any) => p.sku === product);
    return p?.category ?? "";
  }, [product, inventoryItems]);

  const availableWarehouses = useMemo(() =>
    zone ? warehouses : []
    , [zone]);

  const fetchMLPreview = useCallback(async () => {
    if (!product || !zone || !warehouse) return;
    setPreviewLoading(true);
    try {
      const result = await postMLPreview({
        sku: product,
        zone,
        warehouse,
        discount_percent: Number(discount) || 0,
        is_festival: festival ? 1 : 0,
        order_date: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : new Date().toISOString(),
      });
      setMlPreview(result);
      setShowPreview(true);
    } catch (err) {
      console.error("ML Preview failed:", err);
    } finally {
      setPreviewLoading(false);
    }
  }, [product, zone, warehouse, discount, festival, deliveryDate]);

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    // Simulate parsed CSV rows
    const simulated: BulkRow[] = [
      { product_id: "INV-001", zone: "Zone A", warehouse: "WH-A1", requested_quantity: 500, expected_delivery_date: "2026-03-10", price: 12.5, discount_percent: 5, festival_flag: false, valid: true },
      { product_id: "INV-003", zone: "Zone A", warehouse: "WH-A2", requested_quantity: 200, expected_delivery_date: "2026-03-12", price: 8.0, discount_percent: 0, festival_flag: true, valid: true },
      { product_id: "INVALID", zone: "Zone X", warehouse: "", requested_quantity: -10, expected_delivery_date: "", price: 0, discount_percent: 0, festival_flag: false, valid: false, error: "Invalid product_id, missing zone/warehouse" },
      { product_id: "INV-006", zone: "Zone D", warehouse: "WH-D1", requested_quantity: 1000, expected_delivery_date: "2026-03-15", price: 3.2, discount_percent: 10, festival_flag: false, valid: true },
    ];
    setBulkRows(simulated);
  };

  const handleNLParse = async () => {
    setNlIsParsing(true);
    try {
      const parsed = await parseNLP(nlText);
      const match = inventoryItems.find((i: any) => i.product.toLowerCase().includes((parsed.product || "").toLowerCase()));
      
      setNlParsed({
        Product: match?.product || parsed.product || "Unknown",
        SKU: match?.sku || "",
        Quantity: parsed.quantity ? parsed.quantity.toString() : "0",
        Zone: parsed.zone || "Unknown",
        Warehouse: "Auto-assign",
        "Delivery Date": "ASAP"
      });
    } catch (err) {
      console.error("Failed to parse NLP via backend", err);
    } finally {
      setNlIsParsing(false);
    }
  };

  const resetForm = () => {
    setProduct(""); setQuantity(""); setZone(""); setWarehouse("");
    setPrice(""); setDiscount(""); setFestival(false); setDeliveryDate(undefined);
    setMlPreview(null); setShowPreview(false);
    setBulkRows([]); setBulkFileName("");
    setNlText(""); setNlParsed(null);
  };

  const handleSubmit = async () => {
    try {
      if (mode === "structured") {
        const payload = {
          sku: product,
          zone,
          warehouse,
          requested_quantity: Number(quantity) || 0,
          discount_percent: Number(discount) || 0,
          is_festival: festival ? 1 : 0,
          order_date: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : new Date().toISOString()
        };
        await createRequest(payload);
      } else if (mode === "bulk") {
        // Submit valid bulk rows
        const validRows = bulkRows.filter(r => r.valid);
        for (const row of validRows) {
          await createRequest(row);
        }
      } else if (mode === "natural" && nlParsed) {
          await createRequest({
              sku: nlParsed.SKU || "EGG-001",
              zone: nlParsed.Zone.toLowerCase().replace(" ", ""),
              warehouse: nlParsed.Warehouse === "Auto-assign" ? "" : nlParsed.Warehouse,
              requested_quantity: parseInt(nlParsed.Quantity) || 0,
              discount_percent: 0,
              is_festival: 0,
              order_date: new Date().toISOString()
          });
      }
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  const isFormValid = product && quantity && zone && warehouse && deliveryDate;

  const modes: { key: InputMode; label: string; icon: React.ElementType }[] = [
    { key: "structured", label: "Structured", icon: FileText },
    { key: "bulk", label: "Bulk Upload", icon: Upload },
    { key: "natural", label: "Natural Language", icon: MessageSquare },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] bg-card border-border/40 p-0 overflow-y-auto"
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <SheetHeader className="text-left space-y-1 p-0">
            <SheetTitle className="text-base font-display font-semibold text-foreground tracking-tight">
              Supply Request Intake
            </SheetTitle>
            <SheetDescription className="text-[11px] text-muted-foreground">
              Submit requests to the ML forecasting pipeline for demand impact analysis.
            </SheetDescription>
          </SheetHeader>

          {/* Mode Selector */}
          <motion.div {...fieldAnim(0)} className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border/30">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setShowPreview(false); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[11px] font-medium transition-all duration-200",
                  mode === m.key
                    ? "bg-card text-foreground shadow-[var(--shadow-soft)] border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <m.icon className="h-3 w-3" />
                {m.label}
              </button>
            ))}
          </motion.div>

          {/* ═══ STRUCTURED FORM ═══ */}
          <AnimatePresence mode="wait">
            {mode === "structured" && (
              <motion.div
                key="structured"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-4"
              >
                {/* Product */}
                <motion.div {...fieldAnim(1)} className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Product</Label>
                  <Select value={product} onValueChange={(v) => { setProduct(v); setShowPreview(false); }}>
                    <SelectTrigger className="bg-muted/30 border-border/40 h-9 text-sm">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length > 0 ? products.map((p: any) => (
                        <SelectItem key={p.sku} value={p.sku}>
                          <span className="flex items-center gap-2">
                            {p.name}
                            <span className="text-[10px] text-muted-foreground font-mono">{p.sku}</span>
                          </span>
                        </SelectItem>
                      )) : inventoryItems
                        .filter((p: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.sku === p.sku) === i)
                        .map((p: any) => (
                        <SelectItem key={p.sku} value={p.sku}>
                          <span className="flex items-center gap-2">
                            {p.product}
                            <span className="text-[10px] text-muted-foreground font-mono">{p.sku}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Category (auto) */}
                {category && (
                  <motion.div {...fieldAnim(2)} className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Category</Label>
                    <div className="h-9 px-3 flex items-center rounded-md bg-muted/20 border border-border/30 text-sm text-muted-foreground">
                      {category}
                    </div>
                  </motion.div>
                )}

                {/* Quantity + Price */}
                <motion.div {...fieldAnim(3)} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Requested Qty</Label>
                    <Input
                      type="number" placeholder="0" value={quantity}
                      onChange={e => { setQuantity(e.target.value); setShowPreview(false); }}
                      className="bg-muted/30 border-border/40 h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Price / Unit</Label>
                    <Input
                      type="number" placeholder="0.00" value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="bg-muted/30 border-border/40 h-9"
                    />
                  </div>
                </motion.div>

                {/* Delivery Date */}
                <motion.div {...fieldAnim(4)} className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Expected Delivery Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 bg-muted/30 border-border/40",
                          !deliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {deliveryDate ? format(deliveryDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deliveryDate}
                        onSelect={setDeliveryDate}
                        disabled={(d) => d < new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </motion.div>

                {/* Zone + Warehouse */}
                <motion.div {...fieldAnim(5)} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Zone</Label>
                    <Select value={zone} onValueChange={(v) => { setZone(v); setWarehouse(""); }}>
                      <SelectTrigger className="bg-muted/30 border-border/40 h-9 text-sm">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Warehouse</Label>
                    <Select value={warehouse} onValueChange={setWarehouse} disabled={!zone}>
                      <SelectTrigger className="bg-muted/30 border-border/40 h-9 text-sm">
                        <SelectValue placeholder={zone ? "Select" : "Select zone first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWarehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                {/* Discount + Festival */}
                <motion.div {...fieldAnim(6)} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Discount %</Label>
                    <Input
                      type="number" placeholder="0" value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      className="bg-muted/30 border-border/40 h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Festival Period</Label>
                    <div className="h-9 flex items-center gap-2.5 px-3 rounded-md bg-muted/20 border border-border/30">
                      <Switch checked={festival} onCheckedChange={setFestival} className="scale-90" />
                      <span className="text-xs text-muted-foreground">{festival ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div {...fieldAnim(7)}>
                  <Button
                    onClick={fetchMLPreview}
                    disabled={!product || !zone || !warehouse || previewLoading}
                    className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm font-medium"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    {previewLoading ? "Loading Prediction..." : "Preview ML Impact"}
                  </Button>
                </motion.div>

                {/* ML Preview Panel */}
                <AnimatePresence>
                  {showPreview && mlPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg bg-muted/30 border border-border/30 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <h4 className="text-xs font-display font-semibold text-foreground tracking-wide">ML Forecast Impact</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-md bg-card/60 border border-border/20 space-y-1">
                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Forecast</p>
                            <p className="text-lg font-display font-bold text-foreground">{mlPreview.forecast?.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">units/week</p>
                          </div>
                          <div className="p-3 rounded-md bg-card/60 border border-border/20 space-y-1">
                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Confidence Interval</p>
                            <p className="text-lg font-display font-bold text-foreground">{mlPreview.lower_bound} – {mlPreview.upper_bound}</p>
                            <p className="text-[10px] text-muted-foreground">lower – upper</p>
                          </div>
                          <div className="p-3 rounded-md bg-card/60 border border-border/20 space-y-1">
                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Current Stock</p>
                            <p className="text-lg font-display font-bold text-foreground">{mlPreview.currentStock?.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">{mlPreview.product_name}</p>
                          </div>
                          <div className="p-3 rounded-md bg-card/60 border border-border/20 space-y-1">
                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Historical (lag)</p>
                            <p className="text-lg font-display font-bold text-foreground">{mlPreview.lag_1}</p>
                            <p className="text-[10px] text-muted-foreground">last week ({mlPreview.lag_2} prior)</p>
                          </div>
                        </div>

                        {mlPreview.fallback && (
                          <div className="p-2 rounded-md bg-amber/10 border border-amber/20 text-[10px] text-amber">
                            ⚠ ML service unavailable — using historical average fallback
                          </div>
                        )}

                        <div className="p-3 rounded-md bg-card/60 border border-border/20">
                          <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">Category</p>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 capitalize">
                            <ArrowRight className="h-3 w-3 text-primary" />
                            {mlPreview.category}
                          </p>
                        </div>

                        <Button onClick={handleSubmit} className="w-full h-10 gap-2 text-sm font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Submit to Forecast Pipeline
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ═══ BULK UPLOAD ═══ */}
            {mode === "bulk" && (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-4"
              >
                <motion.div {...fieldAnim(1)} className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Upload CSV / Excel</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Required columns: product_id, zone, warehouse, requested_quantity, expected_delivery_date, price, discount_percent, festival_flag
                  </p>
                  <label className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-border/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">
                      {bulkFileName || "Drop file or click to browse"}
                    </span>
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkUpload} />
                  </label>
                </motion.div>

                {bulkRows.length > 0 && (
                  <motion.div {...fieldAnim(2)} className="space-y-2">
                    <h4 className="text-xs font-display font-semibold text-foreground">Parsed Preview</h4>
                    <div className="rounded-lg border border-border/30 overflow-hidden">
                      <div className="grid grid-cols-[80px_60px_60px_60px_60px] gap-0 px-3 py-1.5 bg-muted/40 border-b border-border/30">
                        {["Product", "Zone", "WH", "Qty", "Status"].map(h => (
                          <span key={h} className="text-[9px] text-muted-foreground tracking-wider uppercase font-medium">{h}</span>
                        ))}
                      </div>
                      {bulkRows.map((row, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.06 }}
                          className={cn(
                            "grid grid-cols-[80px_60px_60px_60px_60px] gap-0 px-3 py-2 items-center text-xs border-b border-border/20 last:border-0",
                            !row.valid && "bg-destructive/5"
                          )}
                        >
                          <span className={cn("font-mono text-[11px] truncate", !row.valid && "text-destructive")}>{row.product_id}</span>
                          <span className="text-muted-foreground">{row.zone}</span>
                          <span className="text-muted-foreground">{row.warehouse || "—"}</span>
                          <span className={cn("font-medium", row.requested_quantity < 0 && "text-destructive")}>{row.requested_quantity}</span>
                          <span>
                            {row.valid ? (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            ) : (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-destructive" />
                              </span>
                            )}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                    {bulkRows.some(r => !r.valid) && (
                      <p className="text-[10px] text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {bulkRows.filter(r => !r.valid).length} row(s) contain validation errors
                      </p>
                    )}

                    <Button
                      onClick={handleSubmit}
                      disabled={!bulkRows.some(r => r.valid)}
                      className="w-full h-10 gap-2 text-sm font-medium"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      Submit to Forecast Pipeline
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══ NATURAL LANGUAGE ═══ */}
            {mode === "natural" && (
              <motion.div
                key="natural"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-4"
              >
                <motion.div {...fieldAnim(1)} className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground tracking-wider uppercase">Describe Your Request</Label>
                  <Textarea
                    value={nlText}
                    onChange={e => { setNlText(e.target.value); setNlParsed(null); }}
                    placeholder='e.g. "Need 1200 units of Rice for North zone, delivery by March 8th, no festival period"'
                    className="bg-muted/30 border-border/40 min-h-[100px] text-sm resize-none"
                  />
                </motion.div>

                <motion.div {...fieldAnim(2)}>
                  <Button
                    onClick={handleNLParse}
                    disabled={nlText.trim().length < 10 || nlIsParsing}
                    variant="outline"
                    className="w-full h-10 gap-2 text-sm font-medium border-border/40"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {nlIsParsing ? "Extracting JSON Intent..." : "Parse Request via LLM"}
                  </Button>
                </motion.div>

                <AnimatePresence>
                  {nlParsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg bg-muted/30 border border-border/30 p-4 space-y-3">
                        <h4 className="text-xs font-display font-semibold text-foreground tracking-wide">Parsed Structured Data</h4>
                        <div className="space-y-2">
                          {Object.entries(nlParsed).map(([key, val], i) => (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.05 }}
                              className="flex justify-between items-center py-1.5 px-3 rounded-md bg-card/60 border border-border/20"
                            >
                              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">{key}</span>
                              <span className="text-xs font-medium text-foreground">{val}</span>
                            </motion.div>
                          ))}
                        </div>

                        <Button onClick={handleSubmit} className="w-full h-10 gap-2 text-sm font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm & Submit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};
