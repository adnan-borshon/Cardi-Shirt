import { useState } from "react";
import { Sun, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTokens } from "./ThemeContext";

const questions = [
  { id: "feeling", q: "How are you feeling today?", options: ["Good", "Okay", "Not great"] },
  { id: "sleep", q: "Did you sleep well?", options: ["Yes", "Somewhat", "No"] },
  { id: "meds", q: "Have you taken your medication?", options: ["Yes", "Not yet"] },
];

export function DailyCheckIn() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Date logic to only show once per day
  const todayStr = new Date().toISOString().split('T')[0];
  const [lastCheckInDate, setLastCheckInDate] = useState(() => {
    try { return localStorage.getItem("cs_last_checkin_date") || ""; } catch { return ""; }
  });
  
  const [dismissed, setDismissed] = useState(lastCheckInDate === todayStr);
  const tk = useTokens();

  const allAnswered = Object.keys(answers).length === questions.length;
  if (dismissed) return null;

  const handleComplete = () => {
    try { localStorage.setItem("cs_last_checkin_date", todayStr); } catch {}
    setTimeout(() => setDismissed(true), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="rounded-xl p-4 mb-4"
        style={{ background: tk.cardElevated, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}
      >
        {!allAnswered ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Sun size={16} style={{ color: tk.amber }} />
              <span style={{ color: tk.amber, fontFamily: "Syne, sans-serif", fontSize: 13 }}>Good morning, Adnan</span>
            </div>
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id}>
                  <p style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, marginBottom: 6 }}>
                    {answers[q.id] ? "✓ " : ""}{q.q}
                  </p>
                  {!answers[q.id] && (
                    <div className="flex gap-2">
                      {q.options.map((opt) => (
                        <button key={opt} className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 hover:opacity-80" style={{ background: tk.chipBg, color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 12, border: `0.5px solid ${tk.cardBorder}` }} onClick={() => setAnswers({ ...answers, [q.id]: opt })}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2" onAnimationComplete={handleComplete}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(39,194,138,0.2)" }}>
              <Check size={14} style={{ color: "#27C28A" }} />
            </div>
            <span style={{ color: "#27C28A", fontFamily: "Syne, sans-serif", fontSize: 13 }}>Check-in complete — thank you, Adnan!</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
