import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useUISettings, type ThemeMode } from "@/context/UISettingsContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Pencil, Shield, Key, Clock, LogOut, Monitor, Moon, Sun,
  Info, Eye, EyeOff, Check, Smartphone, Lock, History,
  ChevronRight, Loader2
} from "lucide-react";

const AUDIT_TRAIL = [
  { action: "Approved request REQ-4820", ts: "2026-03-03 14:22" },
  { action: "Modified inventory SKU-1042 (+200 units)", ts: "2026-03-03 11:05" },
  { action: "Changed password", ts: "2026-03-02 09:30" },
  { action: "Edited profile display name", ts: "2026-03-01 16:45" },
  { action: "Approved request REQ-4815", ts: "2026-03-01 10:12" },
  { action: "Logged in from new device", ts: "2026-02-28 08:00" },
  { action: "Toggled dark mode", ts: "2026-02-27 19:22" },
  { action: "Submitted request REQ-4810", ts: "2026-02-27 14:10" },
  { action: "Updated min threshold SKU-2001", ts: "2026-02-26 11:33" },
  { action: "Enabled compact mode", ts: "2026-02-25 09:15" },
];

const SESSIONS = [
  { device: "Chrome · macOS", ip: "192.168.1.42", lastActive: "Now" },
  { device: "Safari · iPhone", ip: "10.0.0.12", lastActive: "2h ago" },
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score += 25;
  if (pw.length >= 12) score += 15;
  if (/[A-Z]/.test(pw)) score += 15;
  if (/[a-z]/.test(pw)) score += 10;
  if (/[0-9]/.test(pw)) score += 15;
  if (/[^A-Za-z0-9]/.test(pw)) score += 20;
  if (score < 40) return { score, label: "Weak", color: "hsl(var(--destructive))" };
  if (score < 70) return { score, label: "Fair", color: "hsl(var(--amber))" };
  return { score: Math.min(score, 100), label: "Strong", color: "hsl(var(--success))" };
}

const InfoTip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help inline ml-1.5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">{text}</TooltipContent>
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

const Profile = () => {
  const { user, logout } = useAuth();
  const ui = useUISettings();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [editName, setEditName] = useState(user?.name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved, setEditSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const pwStrength = useMemo(() => getPasswordStrength(newPw), [newPw]);

  const [tokenExpiry, setTokenExpiry] = useState(3600);
  useEffect(() => {
    const interval = setInterval(() => setTokenExpiry((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(interval);
  }, []);
  const tokenMins = Math.floor(tokenExpiry / 60);
  const tokenSecs = tokenExpiry % 60;

  const handleEditSave = () => {
    setEditSaving(true);
    setTimeout(() => {
      setEditSaving(false);
      setEditSaved(true);
      setTimeout(() => { setEditSaved(false); setEditOpen(false); }, 600);
    }, 800);
  };

  const handlePwSave = () => {
    setPwSaved(true);
    setTimeout(() => { setPwSaved(false); setPasswordOpen(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }, 800);
  };

  const sectionMotion = ui.reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  return (
    <AppLayout title="Profile">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* ─── IDENTITY & OVERVIEW ─── */}
        <motion.section {...sectionMotion}>
          <SectionHeader icon={<User className="h-4 w-4" />} title="Identity & Overview" />
          <div className="flex items-start gap-6 py-5 border-b border-border/40">
            <div className="relative group flex-shrink-0">
              <Avatar className="h-[90px] w-[90px] border-2 border-border">
                <AvatarFallback className="text-2xl font-display font-bold bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setEditOpen(true)}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-4 w-4 text-foreground" />
              </button>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-display font-bold text-foreground truncate">{user?.name}</h2>
                <StatusBadge status={user?.role === "admin" ? "online" : user?.role === "retailer" ? "processing" : "pending"} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                </span>
                <span className="font-mono tabular-nums">ID: {user?.id}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 flex-shrink-0" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          </div>
          <div className="divide-y divide-border/40">
            <SettingRow label="Role"><span className="text-[13px] text-foreground capitalize">{user?.role ?? "—"}</span></SettingRow>
            <SettingRow label="Account Created"><span className="text-[13px] text-foreground">2025-11-14</span></SettingRow>
            <SettingRow label="Last Login"><span className="text-[13px] text-foreground">2026-03-03 08:14</span></SettingRow>
            <SettingRow label="Token Expiry" info="JWT token expiration countdown. When it reaches 0, you will be automatically logged out.">
              <span className={`font-mono text-xs tabular-nums ${tokenExpiry < 300 ? "text-destructive" : "text-muted-foreground"}`}>
                {tokenMins}m {String(tokenSecs).padStart(2, "0")}s
              </span>
            </SettingRow>
          </div>
        </motion.section>

        {/* ─── UI PERSONALIZATION ─── */}
        <motion.section {...sectionMotion} transition={{ duration: 0.2, delay: 0.05 }}>
          <SectionHeader icon={<Monitor className="h-4 w-4" />} title="UI Personalization" />
          <div className="divide-y divide-border/40">
            <SettingRow label="Theme">
              <div className="flex gap-1">
                {([
                  { val: "light" as ThemeMode, icon: <Sun className="h-3.5 w-3.5" />, label: "Light" },
                  { val: "dark" as ThemeMode, icon: <Moon className="h-3.5 w-3.5" />, label: "Dark" },
                  { val: "system" as ThemeMode, icon: <Monitor className="h-3.5 w-3.5" />, label: "System" },
                ]).map((t) => (
                  <Button
                    key={t.val}
                    variant={ui.theme === t.val ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1"
                    onClick={() => ui.setTheme(t.val)}
                  >
                    {t.icon} {t.label}
                  </Button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Compact Mode" info="Reduces padding and row heights for denser information display.">
              <Switch checked={ui.compactMode} onCheckedChange={ui.setCompactMode} />
            </SettingRow>
            <SettingRow label="Reduce Motion" info="Disables non-essential animations throughout the interface.">
              <Switch checked={ui.reduceMotion} onCheckedChange={ui.setReduceMotion} />
            </SettingRow>
          </div>
        </motion.section>

        {/* ─── SECURITY ─── */}
        <motion.section {...sectionMotion} transition={{ duration: 0.2, delay: 0.1 }}>
          <SectionHeader icon={<Shield className="h-4 w-4" />} title="Security" />
          <div className="divide-y divide-border/40">
            <SettingRow label="Password">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground/70">Last changed: 2026-02-20</span>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setPasswordOpen(true)}>
                  <Key className="h-3 w-3" /> Change
                </Button>
              </div>
            </SettingRow>
            <SettingRow label="Two-Factor Authentication" info="Adds an extra layer of security by requiring a time-based code from an authenticator app.">
              <div className="flex items-center gap-3">
                <StatusBadge status="pending" className="text-[10px]" />
                <Button variant="outline" size="sm" className="h-7 text-xs">Enable</Button>
              </div>
            </SettingRow>
            <div className="py-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-muted-foreground">Active Sessions</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-amber hover:text-amber gap-1.5">
                  <LogOut className="h-3 w-3" /> Logout All
                </Button>
              </div>
              <div className="space-y-1.5">
                {SESSIONS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-sm bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground">{s.device}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{s.ip}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{s.lastActive}</span>
                  </div>
                ))}
              </div>
            </div>
            <SettingRow label="Token Expiry" info="JWT tokens auto-refresh before expiration. If the countdown reaches 0, you'll need to log in again.">
              <span className={`font-mono text-xs tabular-nums ${tokenExpiry < 300 ? "text-destructive" : "text-muted-foreground"}`}>
                {tokenMins}m {String(tokenSecs).padStart(2, "0")}s remaining
              </span>
            </SettingRow>
          </div>
        </motion.section>

        {/* ─── ACTIVITY & AUDIT TRAIL ─── */}
        <motion.section {...sectionMotion} transition={{ duration: 0.2, delay: 0.15 }}>
          <SectionHeader icon={<History className="h-4 w-4" />} title="Activity & Audit Trail" />
          <div className="divide-y divide-border/30">
            {AUDIT_TRAIL.map((entry, i) => (
              <motion.div
                key={i}
                initial={ui.reduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-xs text-foreground">{entry.action}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono tabular-nums">{entry.ts}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── DANGER ZONE ─── */}
        <motion.section {...sectionMotion} transition={{ duration: 0.2, delay: 0.2 }}>
          <div className="flex items-center justify-between border border-destructive/20 rounded-sm bg-destructive/5 px-5 py-4">
            <div>
              <p className="text-[13px] font-medium text-foreground">Sign Out</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">End your current session and return to login.</p>
            </div>
            <Button variant="destructive" size="sm" className="text-xs gap-1.5" onClick={logout}>
              <LogOut className="h-3 w-3" /> Sign Out
            </Button>
          </div>
        </motion.section>

        <div className="h-8" />
      </div>

      {/* ─── EDIT PROFILE MODAL ─── */}
      <AnimatePresence>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-base">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Display Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button size="sm" className="text-xs gap-1.5 min-w-[100px]" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> :
                 editSaved ? <><Check className="h-3 w-3" /> Saved</> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AnimatePresence>

      {/* ─── CHANGE PASSWORD MODAL ─── */}
      <AnimatePresence>
        <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-base">Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Password</Label>
                <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="h-9 text-sm pr-9"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {newPw && (
                  <div className="space-y-1 mt-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Strength</span>
                      <span className="text-[10px] font-medium" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                    </div>
                    <Progress value={pwStrength.score} className="h-1" style={{ "--progress-color": pwStrength.color } as React.CSSProperties} />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirm Password</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="h-9 text-sm" />
                {confirmPw && confirmPw !== newPw && (
                  <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setPasswordOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                className="text-xs gap-1.5"
                disabled={!currentPw || !newPw || newPw !== confirmPw}
                onClick={handlePwSave}
              >
                {pwSaved ? <><Check className="h-3 w-3" /> Updated</> : "Update Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </AppLayout>
  );
};

export default Profile;
