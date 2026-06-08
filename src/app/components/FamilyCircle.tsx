import { Plus } from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useFamily } from "./FamilyContext";
import { useNavigate } from "react-router";

export function FamilyCircle() {
  const tk = useTokens();
  const { members } = useFamily();
  const navigate = useNavigate();
  return (
    <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
      <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 12, display: "block" }}>Family Circle</span>
      <div className="flex items-center gap-5 overflow-x-auto pb-1">
        {members.map((f) => (
          <div key={f.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: f.avatarColor, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14 }}>{f.initials}</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: f.status === "active" ? "#27C28A" : tk.textMuted, borderColor: tk.cardBg }} />
            </div>
            <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 11, maxWidth: 60, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{f.name.split(" ")[0]}</span>
            <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>{f.status === "active" ? "Online" : f.status === "recent" ? "Recent" : "Offline"}</span>
          </div>
        ))}
        <button onClick={() => navigate("/family")} className="flex flex-col items-center gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-dashed" style={{ borderColor: tk.cardBorder, color: tk.textSecondary }}>
            <Plus size={18} />
          </div>
          <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>Add</span>
        </button>
      </div>
    </div>
  );
}
