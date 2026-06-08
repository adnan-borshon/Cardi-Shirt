import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { HamburgerMenu } from "./HamburgerMenu";
import { AIChat } from "./AIChat";
import { TelegramMockCenter } from "./TelegramMockCenter";
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
      <TelegramMockCenter />
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar onMenuOpen={() => setMenuOpen(true)} />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Floating Chatbot FAB */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end">
        {chatOpen ? (
          <div className="w-[340px] sm:w-[380px] h-[700px] max-h-[calc(100vh-40px)] rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300" style={{ borderWidth: 0.5, borderStyle: "solid", borderColor: tk.cardBorder, background: tk.cardBg, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: tk.cardElevated, borderBottom: `0.5px solid ${tk.cardBorder}` }}>
              <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 600 }}>CardiShirt AI</span>
              <button onClick={() => setChatOpen(false)} className="cursor-pointer p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="Close chat">
                <X size={18} style={{ color: tk.textSecondary }} />
              </button>
            </div>
            <AIChat isMobile />
          </div>
        ) : (
          <button onClick={() => setChatOpen(true)} className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200" style={{ background: "#E8304A", boxShadow: "0 4px 20px rgba(232,48,74,0.4)" }} title="Open chat">
            <MessageCircle size={24} style={{ color: "#fff" }} />
          </button>
        )}
      </div>
    </div>
  );
}