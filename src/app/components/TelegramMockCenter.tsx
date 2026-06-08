import { useState, useEffect, useRef } from "react";
import { useTelegramMockMessages, API_URL } from "./useBackend";
import { useTokens } from "./ThemeContext";
import { 
  Send, AlertTriangle, Trash2, Bell, Play, CheckCircle, X, 
  Smartphone, ShieldAlert, Ambulance, UserCheck, MessageSquare, Terminal
} from "lucide-react";

export function TelegramMockCenter() {
  const tk = useTokens();
  const { messages, newMsg, clearMessages, dismissNewMsg } = useTelegramMockMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"controls" | "logs">("controls");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastNotification, setLastNotification] = useState<any | null>(null);

  // Play a soft notification chime for realistic demo
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio chime block:", e);
    }
  };

  // Watch for new messages to display notification banner
  useEffect(() => {
    if (newMsg) {
      setLastNotification(newMsg);
      playChime();
      const timer = setTimeout(() => {
        setLastNotification(null);
        dismissNewMsg();
      }, 7000); // dismiss after 7s
      return () => clearTimeout(timer);
    }
  }, [newMsg, dismissNewMsg]);

  // Check if simulation is active
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/esp32/simulate-status`);
        const data = await res.json();
        setIsSimulating(data.active && data.type === "fall");
      } catch (e) {}
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerFallSim = async () => {
    try {
      setIsSimulating(true);
      await fetch(`${API_URL}/api/esp32/simulate-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "fall" })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const stopSim = async () => {
    try {
      setIsSimulating(false);
      await fetch(`${API_URL}/api/esp32/simulate-stop`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const triggerAmbulanceDispatch = async () => {
    try {
      await fetch(`${API_URL}/api/telegram/dispatch`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const triggerCaregiverCall = async () => {
    try {
      await fetch(`${API_URL}/api/telegram/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetName: "Rehnuma" })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* ── Slide-in Telegram Notification Banner ── */}
      {lastNotification && (
        <div 
          className="fixed top-5 right-5 z-[99999] max-w-[360px] w-full rounded-2xl p-4 flex gap-3.5 shadow-2xl animate-slide-in-right"
          style={{
            background: "rgba(30, 41, 59, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            color: "#fff",
            fontFamily: "Syne, sans-serif"
          }}
        >
          {/* Telegram Logo Icon Circle */}
          <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-[#229ED9]/20 border border-[#229ED9]/30">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#229ED9]">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.95 1.23-5.5 3.63-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.74 3.87-1.69 6.45-2.8 7.74-3.35 3.69-1.54 4.45-1.81 4.95-1.82.11 0 .36.03.52.16.14.11.18.26.19.38v.19z"/>
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[14px] text-[#229ED9] tracking-wide">Telegram Bot (Mocked)</span>
              <span className="text-[10px] text-gray-400 font-mono">Just now</span>
            </div>
            {/* Render HTML tags safely */}
            <div 
              className="text-[13px] text-gray-100 mt-1 leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: lastNotification.text }}
            />
          </div>
          
          <button 
            onClick={() => setLastNotification(null)}
            className="text-gray-400 hover:text-white transition-colors self-start"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Floating Action Button (FAB) for Teacher Demo Hub ── */}
      <div className="fixed bottom-5 left-5 z-[9999]">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
          style={{
            background: "#229ED9", 
            boxShadow: "0 4px 20px rgba(34,158,217,0.4)"
          }}
          title="Teacher Demo Hub"
        >
          <Terminal size={24} style={{ color: "#fff" }} />
        </button>
      </div>

      {/* ── Slide-out Demo Hub Drawer (Left Side) ── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[99998] transition-opacity duration-300"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div 
            className="fixed top-0 left-0 bottom-0 z-[99999] flex flex-col h-full shadow-2xl animate-slide-in-left"
            style={{
              width: "min(380px, 100vw)",
              background: tk.cardBg,
              borderRight: `1px solid ${tk.cardBorder}`,
              color: tk.textPrimary,
              fontFamily: "Syne, sans-serif"
            }}
          >
            {/* Drawer Header */}
            <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between" style={{ background: tk.cardElevated, borderBottom: `1px solid ${tk.cardBorder}` }}>
              <div>
                <span className="font-bold text-[16px] tracking-tight block">Teacher Demo Hub</span>
                <span className="text-[11px] text-[#229ED9] font-semibold">Emergency & Telegram Simulator</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} style={{ color: tk.textSecondary }} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b" style={{ borderColor: tk.cardBorder }}>
              <button 
                onClick={() => setActiveTab("controls")}
                className="flex-1 py-3 text-center text-[13px] font-semibold border-b-2 transition-colors"
                style={{ 
                  borderColor: activeTab === "controls" ? "#229ED9" : "transparent",
                  color: activeTab === "controls" ? "#229ED9" : tk.textSecondary
                }}
              >
                Simulate Actions
              </button>
              <button 
                onClick={() => setActiveTab("logs")}
                className="flex-1 py-3 text-center text-[13px] font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5"
                style={{ 
                  borderColor: activeTab === "logs" ? "#229ED9" : "transparent",
                  color: activeTab === "logs" ? "#229ED9" : tk.textSecondary
                }}
              >
                Telegram Logs
                {messages.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#229ED9] text-white text-[10px] font-bold flex items-center justify-center">
                    {messages.length}
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeTab === "controls" ? (
                <>
                  {/* Card 1: Critical Fall SOS */}
                  <div className="p-4 rounded-xl space-y-3" style={{ background: tk.cardElevated, border: `1px solid ${tk.cardBorder}` }}>
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={18} style={{ color: "#E8304A" }} />
                      <span className="text-[14px] font-bold">Fall Ingestion Simulator</span>
                    </div>
                    <p className="text-[12px]" style={{ color: tk.textSecondary, lineHeight: 1.5 }}>
                      Simulate a critical fall event to verify the automatic SOS trigger and real-time dashboard banner notifications.
                    </p>
                    <div className="flex gap-2">
                      {isSimulating ? (
                        <button 
                          onClick={stopSim}
                          className="w-full py-2.5 rounded-lg text-white font-semibold text-[13px] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          style={{ background: "#E8304A" }}
                        >
                          <X size={14} /> Stop Simulation
                        </button>
                      ) : (
                        <button 
                          onClick={triggerFallSim}
                          className="w-full py-2.5 rounded-lg text-white font-semibold text-[13px] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          style={{ background: "#27C28A" }}
                        >
                          <Play size={14} fill="#fff" /> Start Fall SOS Sim
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Manual Telegram Alerts */}
                  <div className="p-4 rounded-xl space-y-3.5" style={{ background: tk.cardElevated, border: `1px solid ${tk.cardBorder}` }}>
                    <div className="flex items-center gap-2">
                      <Ambulance size={18} style={{ color: "#229ED9" }} />
                      <span className="text-[14px] font-bold">Mock Telegram Alerts</span>
                    </div>
                    <p className="text-[12px]" style={{ color: tk.textSecondary, lineHeight: 1.5 }}>
                      Test individual emergency alert paths to see the formatted messages sent to contacts.
                    </p>
                    
                    <button 
                      onClick={triggerAmbulanceDispatch}
                      className="w-full py-2.5 rounded-lg border font-semibold text-[13px] hover:bg-black/5 dark:hover:bg-white/5 active:scale-97 transition-all flex items-center justify-center gap-2"
                      style={{ borderColor: "#229ED9", color: "#229ED9", background: "transparent" }}
                    >
                      <Ambulance size={14} /> Dispatch Ambulance Alert
                    </button>
                    
                    <button 
                      onClick={triggerCaregiverCall}
                      className="w-full py-2.5 rounded-lg border font-semibold text-[13px] hover:bg-black/5 dark:hover:bg-white/5 active:scale-97 transition-all flex items-center justify-center gap-2"
                      style={{ borderColor: "#27C28A", color: "#27C28A", background: "transparent" }}
                    >
                      <UserCheck size={14} /> Caregiver Call Request
                    </button>
                  </div>
                </>
              ) : (
                /* Telegram Sent Message Log */
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold" style={{ color: tk.textSecondary }}>Sent Alert Messages</span>
                    {messages.length > 0 && (
                      <button 
                        onClick={clearMessages}
                        className="text-[11px] text-[#E8304A] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 size={12} /> Clear Logs
                      </button>
                    )}
                  </div>
                  
                  {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-2">
                      <MessageSquare size={32} style={{ color: tk.textMuted }} />
                      <p className="text-[13px] font-semibold" style={{ color: tk.textSecondary }}>No messages sent yet</p>
                      <p className="text-[11px]" style={{ color: tk.textMuted }}>Trigger an action to see logs</p>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {messages.map((m, i) => (
                        <div 
                          key={`log-${i}`}
                          className="p-3.5 rounded-xl text-[12px] space-y-1.5 border leading-relaxed shadow-sm"
                          style={{ 
                            background: tk.cardElevated, 
                            borderColor: tk.cardBorder 
                          }}
                        >
                          <div className="flex items-center justify-between border-b pb-1 mb-1.5" style={{ borderColor: tk.cardBorder }}>
                            <span className="font-bold text-[#229ED9]">Transmission #{messages.length - i}</span>
                            <span className="text-[9px]" style={{ color: tk.textMuted }}>
                              {new Date(m.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div 
                            style={{ fontFamily: "DM Mono, monospace", fontSize: "11.5px" }}
                            dangerouslySetInnerHTML={{ __html: m.text }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="flex-shrink-0 p-4 border-t text-center text-[10px]" style={{ borderColor: tk.cardBorder, background: tk.cardElevated, color: tk.textMuted }}>
              <span>Designed for pair-programming project evaluation</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
