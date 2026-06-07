import { useState, useRef, useEffect } from "react";
import { Send, Mic, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTokens } from "./ThemeContext";

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

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
  const [messages, setMessages] = useLocalStorage<Message[]>("cs_chat_messages", initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tk = useTokens();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMsg: Message = { id: Date.now(), from: "user", text, time: timeStr };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);
    
    try {
      const historyPayload = messages.map(msg => ({
        role: msg.from === "user" ? "user" : "model",
        text: msg.text
      }));

      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: text, history: historyPayload })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: "ai", text: data.reply || "Sorry, I could not generate a response.", time: timeStr, hasECG: text.toLowerCase().includes("heart") && Math.random() > 0.5 }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: "ai", text: "Connection error. Ensure the backend is running.", time: timeStr }]);
    }
    setTyping(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full" style={{ background: tk.cardBg }}>
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: `0.5px solid ${tk.cardBorder}` }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "#E8304A" }} />
            <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 15 }}>CardiShirt AI</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#27C28A] animate-pulse" />
          </div>
          {messages.length > initialMessages.length && (
            <button onClick={() => { if (window.confirm("Clear chat history?")) setMessages(initialMessages); }} className="hover:underline transition-opacity" style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, background: "none", border: "none", cursor: "pointer" }}>
              Clear Chat
            </button>
          )}
        </div>
        <p style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Has access to your full cardiac history</p>
        <div className="mt-1.5 px-2 py-0.5 rounded-full w-fit" style={{ background: tk.chipBg, color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 9 }}>
          Viewing today's data, 8h of ECG, current vitals
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scrollbar px-4 py-3 space-y-3">
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
      <div className="px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar flex-shrink-0">
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
