import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "dark" | "light" | "ocean" | "nature";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  t: (dark: string, light: string) => string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggle: () => {},
  t: (d) => d,
});

export function useSharedLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };
    window.addEventListener("local-storage", handleStorageChange as EventListener);
    return () => window.removeEventListener("local-storage", handleStorageChange as EventListener);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key, value: valueToStore } }));
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cardishirt-theme") as Theme;
      if (["dark", "light", "ocean", "nature"].includes(stored)) {
        return stored;
      }
      return "dark";
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("cardishirt-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const toggle = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  const t = (dark: string, light: string) => (theme === "dark" ? dark : light);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// Centralized token set
export function useTokens() {
  const { theme } = useTheme();

  // Tokens for Dark (default)
  const darkTokens = {
    pageBg: "#0D0F1A",
    cardBg: "#141629",
    cardElevated: "#1A1D35",
    cardBorder: "rgba(100,120,200,0.15)",
    borderSubtle: "rgba(100,120,200,0.1)",
    textPrimary: "#F0F2FF",
    textSecondary: "#8890B8",
    textMuted: "#4A5070",
    cardiacRed: "#E8304A",
    cardiacRedGlow: "rgba(232,48,74,0.25)",
    green: "#27C28A",
    amber: "#F5A623",
    ecgBg: "#0D0F1A",
    ecgGrid: "rgba(100,120,200,0.08)",
    ecgGridMajor: "rgba(100,120,200,0.15)",
    bubbleUser: "#2A2E50",
    bubbleAI: "#1E2140",
    bubbleUserText: "#F0F2FF",
    bubbleAIText: "#E8E8F0",
    inputBg: "#1A1D35",
    sidebarBg: "#141629",
    mapBg: "#0D0F1A",
    mapGrid: "rgba(100,120,200,0.06)",
    mapRoad: "rgba(100,120,200,0.12)",
    chipBg: "#0D0F1A",
    hoverBg: "#1A1D35",
    shadow: "none",
  };

  // Tokens for Light
  const lightTokens = {
    pageBg: "#F4F5F9",
    cardBg: "#FFFFFF",
    cardElevated: "#F9FAFB",
    cardBorder: "rgba(0,0,0,0.08)",
    borderSubtle: "rgba(0,0,0,0.05)",
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#6B7280",
    cardiacRed: "#E8304A",
    cardiacRedGlow: "rgba(232,48,74,0.12)",
    green: "#27C28A",
    amber: "#F5A623",
    ecgBg: "#FFFFFF",
    ecgGrid: "rgba(0,0,0,0.04)",
    ecgGridMajor: "rgba(0,0,0,0.12)",
    bubbleUser: "#E8304A",
    bubbleAI: "#F3F4F6",
    bubbleUserText: "#F0F2FF",
    bubbleAIText: "#1A1D2E",
    inputBg: "#F3F4F6",
    sidebarBg: "#FFFFFF",
    mapBg: "#E8EAF0",
    mapGrid: "rgba(0,0,0,0.04)",
    mapRoad: "rgba(0,0,0,0.08)",
    chipBg: "#F3F4F6",
    hoverBg: "#F3F4F6",
    shadow: "0 1px 3px rgba(0,0,0,0.08)",
  };

  // Tokens for Ocean
  const oceanTokens = {
    pageBg: "#0A1929",
    cardBg: "#132F4C",
    cardElevated: "#173A5E",
    cardBorder: "rgba(0,198,255,0.15)",
    borderSubtle: "rgba(0,198,255,0.1)",
    textPrimary: "#F0F7FF",
    textSecondary: "#A8C7FA",
    textMuted: "#82AEE8",
    cardiacRed: "#FF5252",
    cardiacRedGlow: "rgba(255,82,82,0.25)",
    green: "#00E676",
    amber: "#FFEA00",
    ecgBg: "#0A1929",
    ecgGrid: "rgba(0,198,255,0.08)",
    ecgGridMajor: "rgba(0,198,255,0.15)",
    bubbleUser: "#0059B2",
    bubbleAI: "#173A5E",
    bubbleUserText: "#FFFFFF",
    bubbleAIText: "#E0F2FE",
    inputBg: "#173A5E",
    sidebarBg: "#132F4C",
    mapBg: "#0A1929",
    mapGrid: "rgba(0,198,255,0.06)",
    mapRoad: "rgba(0,198,255,0.12)",
    chipBg: "#0A1929",
    hoverBg: "#173A5E",
    shadow: "none",
  };

  // Tokens for Nature
  const natureTokens = {
    pageBg: "#0F1A15",
    cardBg: "#162B21",
    cardElevated: "#1C362A",
    cardBorder: "rgba(100,200,150,0.15)",
    borderSubtle: "rgba(100,200,150,0.08)",
    textPrimary: "#E8F5E9",
    textSecondary: "#A5D6A7",
    textMuted: "#81C784",
    cardiacRed: "#FF5252",
    cardiacRedGlow: "rgba(255,82,82,0.25)",
    green: "#69F0AE",
    amber: "#FFB300",
    ecgBg: "#0B1410",
    ecgGrid: "rgba(100,200,150,0.05)",
    ecgGridMajor: "rgba(100,200,150,0.15)",
    bubbleUser: "#2E7D32",
    bubbleAI: "#1C362A",
    bubbleUserText: "#FFFFFF",
    bubbleAIText: "#E8F5E9",
    inputBg: "#1C362A",
    sidebarBg: "#12211A",
    mapBg: "#0F1A15",
    mapGrid: "rgba(100,200,150,0.06)",
    mapRoad: "rgba(100,200,150,0.12)",
    chipBg: "#1C362A",
    hoverBg: "#1C362A",
    shadow: "none",
  };

  if (theme === "light") return lightTokens;
  if (theme === "ocean") return oceanTokens;
  if (theme === "nature") return natureTokens;
  return darkTokens;
}