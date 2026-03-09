import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUISettings, type AccentColor } from "./UISettingsContext";

export interface OperationalDefaults {
  riskThreshold: number;       // 0–100
  forecastHorizon: string;     // "3d" | "7d" | "14d" | "30d"
  festivalToggle: boolean;
  reorderSensitivity: number;  // 0–100
}

export interface CompanySettings {
  companyName: string;
  industry: string;
  accentColor: AccentColor;
  logoPreview: string | null;
  operationalDefaults: OperationalDefaults;
}

interface CompanyContextType extends CompanySettings {
  setCompanyName: (v: string) => void;
  setIndustry: (v: string) => void;
  setCompanyAccent: (v: AccentColor) => void;
  setLogoPreview: (v: string | null) => void;
  setOperationalDefaults: (fn: (prev: OperationalDefaults) => OperationalDefaults) => void;
}

const STORAGE_KEY = "fluxo-company-settings";

const defaults: CompanySettings = {
  companyName: "FluxoAI Corp",
  industry: "supply-chain",
  accentColor: "blue",
  logoPreview: null,
  operationalDefaults: {
    riskThreshold: 65,
    forecastHorizon: "7d",
    festivalToggle: false,
    reorderSensitivity: 50,
  },
};

function load(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(load);
  const ui = useUISettings();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync company accent to global UI accent
  useEffect(() => {
    ui.setAccentColor(settings.accentColor);
  }, [settings.accentColor]);

  const setCompanyName = useCallback((v: string) => setSettings(s => ({ ...s, companyName: v })), []);
  const setIndustry = useCallback((v: string) => setSettings(s => ({ ...s, industry: v })), []);
  const setCompanyAccent = useCallback((v: AccentColor) => setSettings(s => ({ ...s, accentColor: v })), []);
  const setLogoPreview = useCallback((v: string | null) => setSettings(s => ({ ...s, logoPreview: v })), []);
  const setOperationalDefaults = useCallback(
    (fn: (prev: OperationalDefaults) => OperationalDefaults) =>
      setSettings(s => ({ ...s, operationalDefaults: fn(s.operationalDefaults) })),
    []
  );

  return (
    <CompanyContext.Provider value={{ ...settings, setCompanyName, setIndustry, setCompanyAccent, setLogoPreview, setOperationalDefaults }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
};
