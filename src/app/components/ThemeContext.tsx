import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  t: (dark: string, light: string) => string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggle: () => {},
  t: (d) => d,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cardishirt-theme") as Theme) || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("cardishirt-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const t = (dark: string, light: string) => (theme === "dark" ? dark : light);

  return (
    <ThemeContext.Provider value={{ theme, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// Centralized token set
export function useTokens() {
  const { theme } = useTheme();
  const d = theme === "dark";
  return {
    pageBg: d ? "#0D0F1A" : "#F4F5F9",
    cardBg: d ? "#141629" : "#FFFFFF",
    cardElevated: d ? "#1A1D35" : "#F9FAFB",
    cardBorder: d ? "rgba(100,120,200,0.15)" : "rgba(0,0,0,0.08)",
    borderSubtle: d ? "rgba(100,120,200,0.1)" : "rgba(0,0,0,0.05)",
    textPrimary: d ? "#F0F2FF" : "#1A1D2E",
    textSecondary: d ? "#8890B8" : "#6B7280",
    textMuted: d ? "#4A5070" : "#9CA3AF",
    cardiacRed: "#E8304A",
    cardiacRedGlow: d ? "rgba(232,48,74,0.25)" : "rgba(232,48,74,0.12)",
    green: "#27C28A",
    amber: "#F5A623",
    ecgBg: d ? "#0D0F1A" : "#FFFFFF",
    ecgGrid: d ? "rgba(100,120,200,0.08)" : "rgba(0,0,0,0.04)",
    ecgGridMajor: d ? "rgba(100,120,200,0.15)" : "rgba(0,0,0,0.12)",
    bubbleUser: d ? "#2A2E50" : "#E8304A",
    bubbleAI: d ? "#1E2140" : "#F3F4F6",
    bubbleUserText: "#F0F2FF",
    bubbleAIText: d ? "#E8E8F0" : "#1A1D2E",
    inputBg: d ? "#1A1D35" : "#F3F4F6",
    sidebarBg: d ? "#141629" : "#FFFFFF",
    mapBg: d ? "#0D0F1A" : "#E8EAF0",
    mapGrid: d ? "rgba(100,120,200,0.06)" : "rgba(0,0,0,0.04)",
    mapRoad: d ? "rgba(100,120,200,0.12)" : "rgba(0,0,0,0.08)",
    chipBg: d ? "#0D0F1A" : "#F3F4F6",
    hoverBg: d ? "#1A1D35" : "#F3F4F6",
    shadow: d ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
  };
}