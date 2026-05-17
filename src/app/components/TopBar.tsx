import { Menu, Sun, Moon } from "lucide-react";
import { useTheme, useTokens } from "./ThemeContext";

interface TopBarProps {
  onMenuOpen: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  const { theme, toggle } = useTheme();
  const tk = useTokens();

  return (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30" style={{ background: tk.cardBg, borderBottom: `0.5px solid ${tk.cardBorder}` }}>
      <button onClick={onMenuOpen} className="p-1.5 rounded-lg" style={{ color: tk.textSecondary }}>
        <Menu size={20} />
      </button>
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
        <path d="M4 16 Q8 8, 12 16 Q14 20, 16 12 Q18 4, 20 16 Q24 24, 28 16" stroke="#E8304A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: "Syne, sans-serif", color: tk.textPrimary, fontSize: 16, fontWeight: 700 }}>CardiShirt</span>
      <button onClick={toggle} className="ml-auto p-1.5 rounded-lg" style={{ color: tk.textSecondary }}>
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
