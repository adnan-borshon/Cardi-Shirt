import { useState, useRef, useEffect } from "react";
import { Send, Mic, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTokens } from "./ThemeContext";

interface Message {
  id: number;
  from: "ai" | "user";
  text: string;
  proactive?: boolean;
  hasECG?: boolean;
  time: string;
}

const initialMessages: Message[] = [
  { id: 1, from: "ai", text: "Good afternoon, Adnan. Your heart has been steady today — your resting rate is 72 BPM and your rhythm is normal. How can I help you?", time: "3:40 PM" },
  { id: 2, from: "ai", text: "CardiShirt noticed your resting heart rate has been slightly lower than your usual this afternoon — this can sometimes mean you're more relaxed than usual. No action needed.", proactive: true, time: "3:15 PM" },
];

const quickPrompts = ["Is my heart okay today?", "How was my sleep last night?", "What should I avoid today?"];

export function AIChat({ isMobile = false }: { isMobile?: boolean }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tk = useTokens();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), from: "user", text, time: "Now" }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const responses: Record<string, string> = {
        "Is my heart okay today?": "Yes, Adnan — your heart is doing well today. Your rhythm has been consistently normal sinus, your heart rate has stayed between 68–75 BPM, and your HRV is in a healthy range. Your AI Health Score is 87, which is 3 points better than yesterday.",
        "How was my sleep last night?": "Based on your overnight ECG data, you had a restful night. Your heart rate dropped to a healthy 58 BPM during deep sleep, and no rhythm irregularities were detected. Your HRV was elevated during sleep, which is a positive sign of recovery.",
        "What should I avoid today?": "Based on your recent patterns, I'd recommend avoiding strenuous exercise in the afternoon heat, as your heart rate tends to elevate more than usual between 2–4 PM. Stay hydrated and consider a gentle walk in the cooler evening hours instead.",
      };
      const aiText = responses[text] || "Your heart data looks normal right now. Your rhythm is regular and your heart rate is within your personal baseline. If you have specific concerns, I'd recommend discussing them with DR. Rohan at your next appointment.";
      setTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: "ai", text: aiText, time: "Now", hasECG: text.toLowerCase().includes("heart") && Math.random() > 0.5 }]);
    }, 1500);
  };

  return (
    <div className={`flex flex-col ${isMobile ? "h-[500px]" : "h-full"}`} style={{ background: tk.cardBg }}>
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: `0.5px solid ${tk.cardBorder}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: "#E8304A" }} />
          <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 15 }}>CardiShirt AI</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#27C28A] animate-pulse" />
        </div>
        <p style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Has access to your full cardiac history</p>
        <div className="mt-1.5 px-2 py-0.5 rounded-full w-fit" style={{ background: tk.chipBg, color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 9 }}>
          Viewing today's data, 8h of ECG, current vitals
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5" style={{ background: msg.from === "user" ? tk.bubbleUser : tk.bubbleAI, border: msg.from === "ai" ? `0.5px solid ${tk.borderSubtle}` : "none" }}>
              {msg.proactive && (
                <div className="flex items-center gap-1 mb-1.5">
                  <Activity size={10} style={{ color: tk.amber }} />
                  <span style={{ color: tk.amber, fontFamily: "DM Mono, monospace", fontSize: 9 }}>CardiShirt noticed</span>
                </div>
              )}
              {msg.from === "ai" && !msg.proactive && (
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles size={10} style={{ color: "#E8304A" }} />
                </div>
              )}
              <p style={{ color: msg.from === "user" ? tk.bubbleUserText : tk.bubbleAIText, fontFamily: "Syne, sans-serif", fontSize: 13, lineHeight: 1.55 }}>{msg.text}</p>
              {msg.hasECG && (
                <div className="mt-2 rounded-lg overflow-hidden p-2" style={{ background: tk.ecgBg, border: `0.5px solid ${tk.borderSubtle}` }}>
                  <svg width="100%" height="30" viewBox="0 0 200 30" preserveAspectRatio="none">
                    <polyline points="0,15 20,15 25,15 30,12 35,18 40,15 50,15 55,5 60,25 65,2 70,28 75,15 80,15 90,12 100,15 110,15 120,15 125,12 130,18 135,15 145,15 150,5 155,25 160,2 165,28 170,15 175,15 185,12 195,15 200,15" fill="none" stroke="#E8304A" strokeWidth="1.5" />
                  </svg>
                  <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 8 }}>ECG snapshot • Lead II • 3:40 PM</span>
                </div>
              )}
              <span className="block mt-1" style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9, textAlign: msg.from === "user" ? "right" : "left" }}>{msg.time}</span>
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl w-fit" style={{ background: tk.bubbleAI }}>
              <Sparkles size={10} style={{ color: "#E8304A" }} />
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (<div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: tk.textSecondary, animationDelay: `${i * 0.15}s` }} />))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
        {quickPrompts.map((p) => (
          <button key={p} className="px-3 py-1.5 rounded-full whitespace-nowrap transition-colors" style={{ background: tk.chipBg, color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, border: `0.5px solid ${tk.cardBorder}` }} onClick={() => sendMessage(p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: `0.5px solid ${tk.cardBorder}` }}>
        <div className="flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(input)} placeholder="Ask about your heart today..." className="flex-1 px-3.5 py-2.5 rounded-xl outline-none" style={{ background: tk.inputBg, color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, border: `0.5px solid ${tk.cardBorder}` }} />
          <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: tk.inputBg, border: `0.5px solid ${tk.cardBorder}` }}>
            <Mic size={16} style={{ color: tk.textSecondary }} />
          </button>
          <button onClick={() => sendMessage(input)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: "#E8304A" }}>
            <Send size={16} style={{ color: "#fff" }} />
          </button>
        </div>
        <p style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 8, marginTop: 6, textAlign: "center" }}>
          CardiShirt AI is a monitoring companion, not a doctor. Always consult your physician for medical decisions.
        </p>
      </div>
    </div>
  );
}
