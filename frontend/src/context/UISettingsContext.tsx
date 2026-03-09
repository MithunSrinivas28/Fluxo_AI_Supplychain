import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "blue" | "teal" | "amber" | "green" | "red";

const ACCENT_MAP: Record<AccentColor, { light: string; dark: string }> = {
  blue:  { light: "224 64% 33%", dark: "224 64% 55%" },
  teal:  { light: "174 62% 42%", dark: "174 62% 48%" },
  amber: { light: "38 92% 50%",  dark: "38 92% 55%" },
  green: { light: "152 56% 42%", dark: "152 56% 48%" },
  red:   { light: "0 62% 45%",   dark: "0 62% 55%" },
};

interface UISettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  compactMode: boolean;
  reduceMotion: boolean;
}

interface UISettingsContextType extends UISettings {
  setTheme: (t: ThemeMode) => void;
  setAccentColor: (c: AccentColor) => void;
  setCompactMode: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
}

const STORAGE_KEY = "fluxo-ui-settings";

const defaults: UISettings = {
  theme: "dark",
  accentColor: "blue",
  compactMode: false,
  reduceMotion: false,
};

function loadSettings(): UISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}

const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined);

export const UISettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UISettings>(loadSettings);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    let resolved = settings.theme;
    if (resolved === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
  }, [settings.theme]);

  // Apply accent color CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const accent = ACCENT_MAP[settings.accentColor];
    const val = isDark ? accent.dark : accent.light;
    root.style.setProperty("--primary", val);
    root.style.setProperty("--ring", val);
    root.style.setProperty("--sidebar-primary", val);
    root.style.setProperty("--sidebar-ring", val);
  }, [settings.accentColor, settings.theme]);

  // Apply compact mode
  useEffect(() => {
    document.documentElement.setAttribute("data-compact", settings.compactMode ? "true" : "false");
  }, [settings.compactMode]);

  // Apply reduce motion
  useEffect(() => {
    document.documentElement.setAttribute("data-reduce-motion", settings.reduceMotion ? "true" : "false");
  }, [settings.reduceMotion]);

  const setTheme = useCallback((t: ThemeMode) => setSettings(s => ({ ...s, theme: t })), []);
  const setAccentColor = useCallback((c: AccentColor) => setSettings(s => ({ ...s, accentColor: c })), []);
  const setCompactMode = useCallback((v: boolean) => setSettings(s => ({ ...s, compactMode: v })), []);
  const setReduceMotion = useCallback((v: boolean) => setSettings(s => ({ ...s, reduceMotion: v })), []);

  return (
    <UISettingsContext.Provider value={{ ...settings, setTheme, setAccentColor, setCompactMode, setReduceMotion }}>
      {children}
    </UISettingsContext.Provider>
  );
};

export const useUISettings = () => {
  const ctx = useContext(UISettingsContext);
  if (!ctx) throw new Error("useUISettings must be used within UISettingsProvider");
  return ctx;
};
