import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useUISettings, type AccentColor } from "@/context/UISettingsContext";
import { useCompany } from "@/context/CompanyContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  Building2, Palette, SlidersHorizontal, Users, BookOpen, Info,
  Upload, User, Clock, UserPlus, Image
} from "lucide-react";

const ACCENT_OPTIONS: { value: AccentColor; label: string; hsl: string }[] = [
  { value: "blue", label: "Industrial Blue", hsl: "224 64% 55%" },
  { value: "teal", label: "Teal", hsl: "174 62% 48%" },
  { value: "amber", label: "Amber", hsl: "38 92% 55%" },
  { value: "green", label: "Green", hsl: "152 56% 48%" },
  { value: "red", label: "Red", hsl: "0 62% 55%" },
];

const INDUSTRIES = [
  { value: "supply-chain", label: "Supply Chain & Logistics" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & E-Commerce" },
  { value: "pharma", label: "Pharmaceuticals" },
  { value: "fmcg", label: "FMCG" },
  { value: "other", label: "Other" },
];

const InfoTip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help inline ml-1.5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 pb-3">
    <span className="text-primary">{icon}</span>
    <h3 className="text-[15px] font-semibold tracking-tight text-foreground font-display">{title}</h3>
  </div>
);

const SettingRow = ({ label, info, children }: { label: string; info?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-b-0">
    <span className="text-[13px] text-muted-foreground flex items-center">
      {label}
      {info && <InfoTip text={info} />}
    </span>
    {children}
  </div>
);

const Admin = () => {
  const { user } = useAuth();
  const ui = useUISettings();
  const company = useCompany();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(company.companyName);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => company.setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNameSave = () => {
    company.setCompanyName(nameValue);
    setEditingName(false);
  };

  const sectionMotion = ui.reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  return (
    <AppLayout title="Company Settings">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* ─── COMPANY IDENTITY ─── */}
        <motion.section {...sectionMotion}>
          <SectionHeader icon={<Building2 className="h-4 w-4" />} title="Company Identity" />

          <div className="flex items-start gap-6 py-5 border-b border-border/40">
            <div className="relative group flex-shrink-0">
              <Avatar className="h-[80px] w-[80px] border-2 border-border rounded-md">
                {company.logoPreview ? (
                  <AvatarImage src={company.logoPreview} alt="Company logo" className="object-cover" />
                ) : (
                  <AvatarFallback className="text-xl font-display font-bold bg-primary/10 text-primary rounded-md">
                    <Image className="h-6 w-6 text-muted-foreground/50" />
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload className="h-4 w-4 text-foreground" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="h-9 text-sm max-w-[260px]"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  />
                  <Button size="sm" className="h-8 text-xs" onClick={handleNameSave}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditingName(false); setNameValue(company.companyName); }}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-display font-bold text-foreground">{company.companyName}</h2>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setEditingName(true)}>Edit</Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {INDUSTRIES.find(i => i.value === company.industry)?.label ?? company.industry}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            <SettingRow label="Industry">
              <Select value={company.industry} onValueChange={company.setIndustry}>
                <SelectTrigger className="w-[200px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow label="Accent Color">
              <div className="flex gap-2">
                {ACCENT_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    title={c.label}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${company.accentColor === c.value ? "border-foreground scale-110" : "border-border/60"}`}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                    onClick={() => company.setCompanyAccent(c.value)}
                  />
                ))}
              </div>
            </SettingRow>
          </div>
        </motion.section>

        {/* ─── OPERATIONAL DEFAULTS ─── */}
        <motion.section {...sectionMotion} transition={{ duration: 0.2, delay: 0.05 }}>
          <SectionHeader icon={<SlidersHorizontal className="h-4 w-4" />} title="Operational Defaults" />

          <div className="divide-y divide-border/40">
            <SettingRow
              label="Risk Threshold"
              info="The default risk score threshold above which items are flagged for review. Range: 0–100."
            >
              <div className="flex items-center gap-3 w-[200px]">
                <Slider
                  value={[company.operationalDefaults.riskThreshold]}
                  onValueChange={([v]) => company.setOperationalDefaults(d => ({ ...d, riskThreshold: v }))}
                  min={0} max={100} step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono tabular-nums text-foreground w-8 text-right">
                  {company.operationalDefaults.riskThreshold}
                </span>
              </div>
            </SettingRow>

            <SettingRow
              label="Forecast Horizon"
              info="Default number of days used for demand and inventory forecasting models."
            >
              <Select
                value={company.operationalDefaults.forecastHorizon}
                onValueChange={(v) => company.setOperationalDefaults(d => ({ ...d, forecastHorizon: v }))}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3d">3 Days</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="14d">14 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow
              label="Festival Multiplier"
              info="When enabled, applies a seasonal demand multiplier during detected festival periods to adjust forecasts."
            >
              <Switch
                checked={company.operationalDefaults.festivalToggle}
                onCheckedChange={(v) => company.setOperationalDefaults(d => ({ ...d, festivalToggle: v }))}
              />
            </SettingRow>

            <SettingRow
              label="Reorder Sensitivity"
              info="Controls how aggressively the system triggers reorder alerts. Higher values mean earlier alerts."
            >
              <div className="flex items-center gap-3 w-[200px]">
                <Slider
                  value={[company.operationalDefaults.reorderSensitivity]}
                  onValueChange={([v]) => company.setOperationalDefaults(d => ({ ...d, reorderSensitivity: v }))}
                  min={0} max={100} step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono tabular-nums text-foreground w-8 text-right">
                  {company.operationalDefaults.reorderSensitivity}
                </span>
              </div>
            </SettingRow>
          </div>
        </motion.section>

        {/* ─── USER OVERVIEW ─── */}
        <motion.section {...sectionMotion} transition={{ duration: 0.2, delay: 0.1 }}>
          <SectionHeader icon={<Users className="h-4 w-4" />} title="User Overview" />

          <div className="divide-y divide-border/40">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[13px] font-medium text-foreground">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={user?.role === "admin" ? "online" : "pending"} />
                <span className="text-[11px] text-muted-foreground capitalize">{user?.role}</span>
              </div>
            </div>

            <SettingRow label="Last Login">
              <span className="text-[13px] text-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" /> 2026-03-03 08:14
              </span>
            </SettingRow>

            <div className="py-3">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5" disabled>
                        <UserPlus className="h-3 w-3" /> Invite User
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Backend required</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.section>

        {/* ─── PLATFORM GUIDE ─── */}
        <motion.section {...sectionMotion} transition={{ duration: 0.2, delay: 0.15 }}>
          <SectionHeader icon={<BookOpen className="h-4 w-4" />} title="Platform Guide" />

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="requests-flow" className="border-border/40">
              <AccordionTrigger className="text-[13px] font-medium py-3 hover:no-underline">
                How Requests flow to Inventory
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Retailers submit supply requests specifying product, quantity, and priority. Requests enter a queue
                where warehouse managers or admins review and approve them. Approved requests trigger inventory
                allocation from the designated warehouse zone, updating stock levels and generating outbound
                transaction records in real time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ml-prediction" className="border-border/40">
              <AccordionTrigger className="text-[13px] font-medium py-3 hover:no-underline">
                How ML prediction works
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                The system uses historical order data, seasonal patterns, and external signals (e.g., festival
                calendars) to generate demand forecasts. Models are retrained periodically and produce confidence
                scores for each prediction. Forecasts inform reorder alerts, warehouse load projections, and
                risk assessments across all inventory zones.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="risk-calc" className="border-border/40">
              <AccordionTrigger className="text-[13px] font-medium py-3 hover:no-underline">
                How Risk is calculated
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Risk scores combine multiple factors: current stock relative to minimum thresholds, demand velocity,
                supplier lead times, and forecast confidence. Items exceeding the configured risk threshold are flagged
                for immediate review. The risk threshold can be adjusted in Operational Defaults above.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="warehouse-load" className="border-border/40">
              <AccordionTrigger className="text-[13px] font-medium py-3 hover:no-underline">
                How Warehouse load is derived
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Warehouse load is calculated as a ratio of current total stock to the warehouse's rated capacity,
                factoring in pending inbound shipments and approved outbound requests. Load percentages above 85%
                trigger capacity warnings, while loads below 30% may indicate under-utilization or supply gaps.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.section>

        <div className="h-8" />
      </div>
    </AppLayout>
  );
};

export default Admin;
