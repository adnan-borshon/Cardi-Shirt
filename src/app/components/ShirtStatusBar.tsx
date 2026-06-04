import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, Battery, Clock, Radio } from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useLiveVitals } from "./useBackend";

export function ShirtStatusBar() {
  const tk = useTokens();
  const { connected, vitals } = useLiveVitals();
  
  const [flash, setFlash] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());
  const [isHardwareActive, setIsHardwareActive] = useState(false);

  // Watch for incoming vitals data
  useEffect(() => {
    if (vitals) {
      lastActiveRef.current = Date.now();
      setIsHardwareActive(true);
      
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(t);
    }
  }, [vitals]);

  // Hardware watchdog timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActiveRef.current > 4000) {
        setIsHardwareActive(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live sync message
  const getSyncedMessage = () => {
    if (!vitals) return "Waiting for data...";
    const secondsAgo = Math.round((Date.now() - new Date(vitals.timestamp).getTime()) / 1000);
    if (secondsAgo < 0) return "Synced just now";
    if (secondsAgo < 60) return `Synced ${secondsAgo}s ago`;
    return `Synced ${Math.floor(secondsAgo / 60)}m ago`;
  };

  const synced = getSyncedMessage();

  // Determine status configurations
  const getStatusConfig = () => {
    if (!connected) {
      return {
        label: "Server Offline",
        color: "#E8304A",
        icon: WifiOff,
        flashColor: "transparent"
      };
    }
    if (!isHardwareActive) {
      return {
        label: "Awaiting Shirt",
        color: "#F5A623",
        icon: Wifi,
        flashColor: "transparent"
      };
    }
    return {
      label: "Connected",
      color: tk.green || "#27C28A",
      icon: Wifi,
      flashColor: "#27C28A"
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div
      className="flex flex-wrap items-center gap-4 md:gap-6 px-4 py-2.5 rounded-xl mb-4 sticky top-0 z-10"
      style={{
        background: tk.cardBg,
        borderBottom: `0.5px solid ${tk.cardBorder}`,
        boxShadow: tk.shadow,
      }}
    >
      {/* Dynamic Status Connection Badge */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <StatusIcon size={14} style={{ color: status.color }} />
          {flash && isHardwareActive && (
            <div
              className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
              style={{
                background: status.flashColor,
                boxShadow: `0 0 6px ${status.flashColor}`,
              }}
            />
          )}
        </div>
        <span
          style={{
            color: status.color,
            fontFamily: "DM Mono, monospace",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Leads Active Indicator */}
      <div className="flex items-center gap-2">
        <Radio size={14} style={{ color: tk.textSecondary }} />
        <span style={{ color: isHardwareActive ? tk.textPrimary : tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>
          {isHardwareActive ? "3/3 leads active" : "0/3 leads active"}
        </span>
      </div>

      {/* Battery Indicator */}
      <div className="flex items-center gap-2">
        <Battery size={14} style={{ color: tk.textSecondary }} />
        <span style={{ color: isHardwareActive ? tk.textPrimary : tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>
          {isHardwareActive ? "72%" : "—"}
        </span>
      </div>

      {/* Synced Info */}
      <div className="flex items-center gap-2 ml-auto">
        <Clock size={14} style={{ color: tk.textMuted }} />
        <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 11 }}>
          {synced}
        </span>
      </div>
    </div>
  );
}