import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { HamburgerMenu } from "./HamburgerMenu";
import { AIChat } from "./AIChat";
import { useTokens } from "./ThemeContext";
import { MessageCircle, X } from "lucide-react";
import { useGeolocationWatcher } from "./useBackend";

export function AppLayout() {
  useGeolocationWatcher();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const tk = useTokens();
  const location = useLocation();

  const isDashboard = location.pathname === "/" || location.pathname === "/settings";

  return (
    <div className="flex h-screen w-full transition-colors duration-300" style={{ background: tk.pageBg, fontFamily: "Syne, sans-serif" }}>
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Sidebar onHamburgerOpen={() => setMenuOpen(true)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar onMenuOpen={() => setMenuOpen(true)} />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* AI Chat — only on dashboard */}
      {isDashboard && (
        <aside className="hidden xl:flex flex-col w-[360px] flex-shrink-0" style={{ borderLeft: `0.5px solid ${tk.cardBorder}` }}>
          <AIChat />
        </aside>
      )}

      {/* Mobile chat FAB */}
      {isDashboard && (
        <div className="xl:hidden fixed bottom-5 right-5 z-30">
          {chatOpen ? (
            <div className="w-[340px] h-[520px] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ borderWidth: 0.5, borderStyle: "solid", borderColor: tk.cardBorder, background: tk.cardBg }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ background: tk.cardElevated }}>
                <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13 }}>CardiShirt AI</span>
                <button onClick={() => setChatOpen(false)}><X size={18} style={{ color: tk.textSecondary }} /></button>
              </div>
              <AIChat isMobile />
            </div>
          ) : (
            <button onClick={() => setChatOpen(true)} className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#E8304A", boxShadow: "0 4px 20px rgba(232,48,74,0.4)" }}>
              <MessageCircle size={24} style={{ color: "#fff" }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}