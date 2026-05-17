import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Flame, Trophy,
  Heart, Shirt, User, Sparkles, Globe, Edit3, Pill, AlertTriangle,
  CheckCircle, ArrowLeft, ArrowRight, Plus, Trash2, X, Check, Clock,
  Wind, Gauge, Brain, TrendingUp, TrendingDown
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTokens, useTheme } from "./ThemeContext";

// --- Types & Data ---
interface DayData {
  day: number;
  wearing: "full" | "partial" | "none" | "future";
  score: number;
  wearHours: number;
  wearMinutes: number;
  hasAlert: boolean;
  hasSymptom: boolean;
}

function generateMonthData(year: number, month: number): DayData[] {
  const today = new Date(2026, 3, 3);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: DayData[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date > today) {
      data.push({ day: d, wearing: "future", score: 0, wearHours: 0, wearMinutes: 0, hasAlert: false, hasSymptom: false });
    } else {
      const seed = (d * 7 + month * 13) % 10;
      const wearing: DayData["wearing"] = seed < 1 ? "none" : seed < 3 ? "partial" : "full";
      const score = wearing === "none" ? 0 : 40 + (seed * 6);
      data.push({
        day: d,
        wearing,
        score,
        wearHours: wearing === "full" ? 8 + (seed % 4) : wearing === "partial" ? 3 + (seed % 4) : 0,
        wearMinutes: wearing === "none" ? 0 : (seed * 7) % 60,
        hasAlert: d === 3 || d === 15,
        hasSymptom: d === 10 || d === 25,
      });
    }
  }
  return data;
}

const hrData = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, "0")}:00`,
  hr: h < 6 ? 54 + Math.random() * 8 : h < 9 ? 62 + Math.random() * 12 : h < 17 ? 70 + Math.random() * 15 : h < 21 ? 68 + Math.random() * 10 : 58 + Math.random() * 8,
  worn: !(h >= 0 && h <= 3),
}));

function getEvents(L: typeof t["en"]) {
  return [
    { time: "7:14 AM", icon: Shirt, color: "#9AA0B8", text: L.evtShirtConnected, action: L.evtViewDetails, type: "device" as const },
    { time: "8:30 AM", icon: User, color: "#5B8AF0", text: L.evtCheckin, action: L.evtEditNote, type: "patient" as const },
    { time: "9:00 AM", icon: Pill, color: "#5B8AF0", text: L.evtMedLogged, action: L.evtEditNote, type: "patient" as const },
    { time: "11:45 AM", icon: Wind, color: "#27C28A", text: L.evtBreathingNormal, action: L.evtView, type: "cardiac" as const },
    { time: "1:30 PM", icon: Gauge, color: "#F5A623", text: L.evtStrainElevated, action: L.evtView, type: "cardiac" as const },
    { time: "2:15 PM", icon: Heart, color: "#E8304A", text: L.evtIrregular, action: L.evtViewECG, type: "cardiac" as const },
    { time: "2:18 PM", icon: TrendingDown, color: "#E8304A", text: L.evtTWaveInversion, action: L.evtViewECG, type: "cardiac" as const },
    { time: "2:22 PM", icon: TrendingUp, color: "#E8304A", text: L.evtSTDeviation, action: L.evtViewECG, type: "cardiac" as const },
    { time: "3:15 PM", icon: Brain, color: "#27C28A", text: L.evtStressLow, action: L.evtView, type: "cardiac" as const },
    { time: "3:42 PM", icon: Sparkles, color: "#F5A623", text: L.evtAISummary, action: L.evtView, type: "cardiac" as const },
    { time: "6:00 PM", icon: User, color: "#5B8AF0", text: L.evtFatigue, action: L.evtEditNote, type: "patient" as const },
  ];
}

function getHealthColor(score: number): string {
  if (score >= 75) return "#27C28A";
  if (score >= 40) return "#F5A623";
  return "#E8304A";
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayHeaders = ["M", "T", "W", "T", "F", "S", "S"];

const monthNamesBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const dayHeadersBn = ["সো", "ম", "বু", "বৃ", "শু", "শ", "র"];
const weekdaysBn: Record<string, string> = { Sunday: "রবিবার", Monday: "সোমবার", Tuesday: "মঙ্গলবার", Wednesday: "বুধবার", Thursday: "বৃহস্পতিবার", Friday: "শুক্রবার", Saturday: "শনিবার" };

function toBengaliNum(n: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (d) => bnDigits[parseInt(d)]);
}

const t = {
  en: {
    today: "Today", currentStreak: "Current streak", days: "days", personalBest: "Personal best", daysWorn: "Days worn",
    alerts: "Alerts", avgScore: "Avg Score", hrvTrend: "HRV Trend", events: "events", health: "health", improving: "Improving",
    of: "of", full: "Full", partial: "Partial", notWorn: "Not worn", future: "Future",
    cardishirtAI: "CardiShirt AI", hrChart: "24-Hour Heart Rate",
    medication: "Medication", irregular: "Irregular", fatigue: "Fatigue",
    rmssd: "RMSSD", aboveAvg: "above your 30-day average", goodVariability: "Good variability",
    poincare: "Poincaré Plot", whatMean: "What does this mean?",
    poincareExplain: "A Poincaré plot shows how each heartbeat interval compares to the next. A tight cluster along the diagonal line means your heart rhythm is very regular. Wider scatter indicates more variability, which is usually a healthy sign at rest.",
    eventsTimeline: "Events Timeline", noCardiacEvents: "No cardiac events detected today",
    hideDevice: "Hide", showDevice: "Show", deviceEvents: "device events",
    medicationLog: "Medication Log", edit: "Edit", done: "Done", add: "Add", save: "Save", cancel: "Cancel",
    morning: "Morning", noon: "Noon", evening: "Evening",
    addNewMed: "Add new medication", noMedsLogged: "No medications logged", addMedication: "Add medication",
    namePlaceholder: "Name (e.g. Lisinopril)", dosagePlaceholder: "Dosage (e.g. 10mg)", timePlaceholder: "Time (e.g. 8:00 AM)",
    notes: "Notes", addNote: "Add a note for this day...", saveNote: "Save note",
    prevDay: "Previous day", nextDay: "Next day", selectDay: "Select a day to view details",
    noDataDay: "No data for this day", logNote: "Log a note for this day",
    aiAlert: "Thursday had one moment worth noting. At around 2:15 in the afternoon your heart showed an irregular pattern for about 40 seconds before returning to normal. The rest of the day was calm, and our AI model considers the event mild given your overall pattern. We've logged it for your doctor's review.",
    aiGood: "This was a quiet day for your heart. Your rhythm stayed steady through your morning routine, and your resting rate settled into your usual range by mid-afternoon. Your HRV reading this evening was one of your better ones this month — a good sign.",
    aiNotWorn: "Without the shirt on this day, we have no record of your heart's activity. This is an isolated gap in an otherwise consistent record — nothing to worry about. If you experienced any symptoms, it's worth mentioning them to your doctor at your next visit.",
    aiNotWorn2: "Consistent wearing helps us build a more accurate personal baseline for you. Even partial days contribute meaningful data.",
    alert1: "1 alert",
    aiPartialFn: (h: number) => `We have about ${h} hours of data from this day. Your heart showed a normal rhythm throughout this window. We don't have data for the rest of the day, so our assessment covers only this period.`,
    wornFn: (h: number, m: number) => `Worn ${h}h ${m}m`,
    partialFn: (h: number, m: number) => `Partial — ${h}h ${m}m`,
    evtShirtConnected: "CardiShirt connected", evtCheckin: "Check-in: feeling good",
    evtMedLogged: "Medication logged: Metoprolol 25mg", evtIrregular: "Irregular rhythm — 40 seconds",
    evtBreathingNormal: "Breathing rate: 16 BPM — normal", evtStrainElevated: "Strain level elevated — 42% max",
    evtTWaveInversion: "T wave inversion — Lead III", evtSTDeviation: "ST deviation detected — +0.8 mV",
    evtStressLow: "Stress index: 24/100 — low",
    evtAISummary: "AI summary generated", evtFatigue: "Symptom logged: mild fatigue",
    evtViewDetails: "View details", evtEditNote: "Edit note", evtViewECG: "View ECG clip", evtView: "View",
  },
  bn: {
    today: "আজ", currentStreak: "বর্তমান ধারা", days: "দিন", personalBest: "ব্যক্তিগত সেরা", daysWorn: "পরিধান দিন",
    alerts: "সতর্কতা", avgScore: "গড় স্কোর", hrvTrend: "HRV প্রবণতা", events: "ইভেন্ট", health: "স্বাস্থ্য", improving: "উন্নতি",
    of: "এর মধ্যে", full: "সম্পূর্ণ", partial: "আংশিক", notWorn: "পরেননি", future: "ভবিষ্যৎ",
    cardishirtAI: "কার্ডিশার্ট AI", hrChart: "২৪ ঘণ্টার হৃদস্পন্দন",
    medication: "ওষুধ", irregular: "অনিয়মিত", fatigue: "ক্লান্তি",
    rmssd: "RMSSD", aboveAvg: "আপনার ৩০ দিনের গড়ের উপরে", goodVariability: "ভালো পরিবর্তনশীলতা",
    poincare: "পোয়াঁকারে প্লট", whatMean: "এর অর্থ কী?",
    poincareExplain: "একটি পোয়াঁকারে প্লট দেখায় প্রতিটি হৃদস্পন্দনের ব্যবধান পরবর্তীটির সাথে কীভাবে তুলনা করে। তির্যক রেখা বরাবর একটি ঘন গুচ্ছ মানে আপনার হৃদয়ের ছন্দ অনেক নিয়মিত। বিস্তৃত বিচ্ছুরণ আরও পরিবর্তনশীলতা নির্দেশ করে, যা বিশ্রামে সাধারণত একটি সুস্থ লক্ষণ।",
    eventsTimeline: "ইভেন্ট টাইমলাইন", noCardiacEvents: "আজ কোনো কার্ডিয়াক ইভেন্ট সনাক্ত হয়নি",
    hideDevice: "লুকান", showDevice: "দেখান", deviceEvents: "ডিভাইস ইভেন্ট",
    medicationLog: "ওষুধের লগ", edit: "সম্পাদনা", done: "সম্পন্ন", add: "যোগ", save: "সংরক্ষণ", cancel: "বাতিল",
    morning: "সকাল", noon: "দুপুর", evening: "সন্ধ্যা",
    addNewMed: "নতুন ওষুধ যোগ করুন", noMedsLogged: "কোনো ওষুধ লগ করা হয়নি", addMedication: "ওষুধ যোগ করুন",
    namePlaceholder: "নাম (যেমন লিসিনোপ্রিল)", dosagePlaceholder: "ডোজ (যেমন ১০ মিগ্রা)", timePlaceholder: "সময় (যেমন সকাল ৮:০০)",
    notes: "নোট", addNote: "এই দিনের জন্য একটি নোট যোগ করুন...", saveNote: "নোট সংরক্ষণ",
    prevDay: "আগের দিন", nextDay: "পরের দিন", selectDay: "বিস্তারিত দেখতে একটি দিন নির্বাচন করুন",
    noDataDay: "এই দিনের জন্য কোনো ডেটা নেই", logNote: "এই দিনের জন্য একটি নোট লিখুন",
    aiAlert: "বৃহস্পতিবারে একটি বিষয় লক্ষণীয় ছিল। বিকেল ২:১৫ নাগাদ আপনার হৃদয় প্রায় ৪০ সেকেন্ডের জন্য একটি অনিয়মিত ছন্দ দেখিয়েছিল, তারপর স্বাভাবিকে ফিরে এসেছে। বাকি দিন শান্ত ছিল, এবং আমাদের AI মডেল আপনার সামগ্রিক প্যাটার্নের পরিপ্রেক্ষিতে ঘটনাটিকে হালকা বলে মনে করে। আমরা আপনার ডাক্তারের পর্যালোচনার জন্য এটি লগ করেছি।",
    aiGood: "আপনার হৃদয়ের জন্য এটি একটি শান্ত দিন ছিল। আপনার সকালের রুটিনের সময় ছন্দ স্থির ছিল, এবং বিকেলের মাঝামাঝি আপনার বিশ্রামের হার স্বাভাবিক পরিসরে স্থির হয়েছে। আজ সন্ধ্যায় আপনার HRV রিডিং এই মাসের সেরাগুলোর মধ্যে একটি — একটি ভালো লক্ষণ।",
    aiNotWorn: "এই দিনে শার্ট না পরায় আপনার হৃদয়ের কোনো রেকর্ড নেই। এটি একটি সামঞ্জস্যপূর্ণ রেকর্ডে একটি বিচ্ছিন্ন ফাঁক — চিন্তার কিছু নেই। আপনি যদি কোনো লক্ষণ অনুভব করে থাকেন, তাহলে পরবর্তী সাক্ষাতে আপনার ডাক্তারকে জানানো উচিত।",
    aiNotWorn2: "নিয়মিত পরিধান আমাদের আপনার জন্য আরও সঠিক ব্যক্তিগত বেসলাইন তৈরি করতে সাহায্য করে। আংশিক দিনগুলোও অর্থবহ ডেটা অবদান রাখে।",
    alert1: "১টি সতর্কতা",
    aiPartialFn: (h: number) => `এই দিনে আমাদের কাছে প্রায় ${toBengaliNum(h)} ঘণ্টার ডেটা আছে। এই সময়ে আপনার হৃদয় স্বাভাবিক ছন্দ দেখিয়েছে। বাকি সময়ের জন্য আমাদের কোনো ডেটা নেই, তাই আমাদের মূল্যায়ন শুধুমাত্র এই সময়কালের জন্য।`,
    wornFn: (h: number, m: number) => `পরিধান ${toBengaliNum(h)} ঘ ${toBengaliNum(m)} মি`,
    partialFn: (h: number, m: number) => `আংশিক — ${toBengaliNum(h)} ঘ ${toBengaliNum(m)} মি`,
    evtShirtConnected: "কার্ডিশার্ট সংযুক্ত", evtCheckin: "চেক-ইন: ভালো লাগছে",
    evtMedLogged: "ওষুধ লগ: মেটোপ্রোলল ২৫ মিগ্রা", evtIrregular: "অনিয়মিত ছন্দ — ৪০ সেকেন্ড",
    evtBreathingNormal: "শ্বাস হার: ১৬ BPM — স্বাভাবিক", evtStrainElevated: "স্ট্রেইন লেভেল বৃদ্ধি — সর্বোচ্চ ৪২%",
    evtTWaveInversion: "T তরঙ্গ বি��রীতকরণ — লিড III", evtSTDeviation: "ST বিচ্যুতি সনাক্ত — +০.৮ mV",
    evtStressLow: "স্ট্রেস ইনডেক্স: ২৪/১০০ — কম",
    evtAISummary: "AI সারাংশ তৈরি হয়েছে", evtFatigue: "লক্ষণ লগ: হালকা ক্লান্তি",
    evtViewDetails: "বিস্তারিত দেখুন", evtEditNote: "নোট সম্পাদনা", evtViewECG: "ECG ক্লিপ দেখুন", evtView: "দেখুন",
  },
};

// Convert Sunday-start to Monday-start
function getMondayStart(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function CardiacDiaryScreen() {
  const tk = useTokens();
  const { theme } = useTheme();
  const d = theme === "dark";

  // Brief-specified semantic colors with dark mode support
  const c = {
    textPrimary: d ? "#F0F2FF" : "#0D0F1A",
    textSecondary: d ? "#8890B8" : "#6B7499",
    textMuted: d ? "#4A5070" : "#9AA0B8",
    notWornBg: d ? "#2A2D3E" : "#EEF0F5",
    notWornText: d ? "#6B7280" : "#9AA0B8",
    futureDateColor: d ? "#4A5070" : "#C2C8D6",
    cardBg: d ? "#141629" : "#FFFFFF",
    surfaceBg: d ? "#1A1D35" : "#F7F8FC",
    borderColor: d ? "rgba(100,120,200,0.15)" : "rgba(0,0,0,0.08)",
    pageBg: d ? "#0D0F1A" : "#FFFFFF",
    selectedBorder: d ? "#F0F2FF" : "#0D0F1A",
    chipBg: d ? "#1A1D35" : "#F3F4F6",
    inputBg: d ? "#1A1D35" : "#F9FAFB",
    shadow: d ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
    refLine: d ? "rgba(100,120,200,0.15)" : "#C2C8D6",
    poincareDot: d ? "rgba(232,48,74,0.5)" : "rgba(232,48,74,0.4)",
    poincareAxis: d ? "rgba(100,120,200,0.08)" : "rgba(0,0,0,0.05)",
  };

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showDeviceEvents, setShowDeviceEvents] = useState(false);
  const [hrvExplainOpen, setHrvExplainOpen] = useState(false);

  // Medication Log state
  type MedSlot = "morning" | "noon" | "evening";
  interface MedEntry { id: string; name: string; dosage: string; time: string; slots: Record<MedSlot, boolean>; }
  const [medications, setMedications] = useState<MedEntry[]>([
    { id: "m1", name: "Metoprolol", dosage: "25mg", time: "8:00 AM", slots: { morning: true, noon: false, evening: false } },
    { id: "m2", name: "Aspirin", dosage: "75mg", time: "8:00 AM", slots: { morning: true, noon: false, evening: false } },
    { id: "m3", name: "Atorvastatin", dosage: "10mg", time: "9:00 PM", slots: { morning: false, noon: false, evening: true } },
  ]);
  const [medEditMode, setMedEditMode] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedTime, setNewMedTime] = useState("8:00 AM");
  const [editMedName, setEditMedName] = useState("");
  const [editMedDosage, setEditMedDosage] = useState("");
  const [editMedTime, setEditMedTime] = useState("");

  const toggleMedSlot = (id: string, slot: MedSlot) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, slots: { ...m.slots, [slot]: !m.slots[slot] } } : m));
  };
  const addMedication = () => {
    if (!newMedName.trim()) return;
    setMedications(prev => [...prev, { id: `m${Date.now()}`, name: newMedName.trim(), dosage: newMedDosage.trim() || "—", time: newMedTime, slots: { morning: false, noon: false, evening: false } }]);
    setNewMedName(""); setNewMedDosage(""); setNewMedTime("8:00 AM"); setShowAddMed(false);
  };
  const deleteMedication = (id: string) => setMedications(prev => prev.filter(m => m.id !== id));
  const startEditMed = (med: MedEntry) => {
    setEditingMedId(med.id); setEditMedName(med.name); setEditMedDosage(med.dosage); setEditMedTime(med.time);
  };
  const saveEditMed = () => {
    if (!editingMedId) return;
    setMedications(prev => prev.map(m => m.id === editingMedId ? { ...m, name: editMedName, dosage: editMedDosage, time: editMedTime } : m));
    setEditingMedId(null);
  };

  const monthData = useMemo(() => generateMonthData(currentYear, currentMonth), [currentYear, currentMonth]);
  const selected = monthData.find((dd) => dd.day === selectedDay);

  const firstDayOffset = getMondayStart(currentYear, currentMonth);
  const wornDays = monthData.filter((dd) => dd.wearing === "full" || dd.wearing === "partial").length;
  const totalPastDays = monthData.filter((dd) => dd.wearing !== "future").length;
  const alertDays = monthData.filter((dd) => dd.hasAlert).length;
  const scoredDays = monthData.filter((dd) => dd.wearing !== "none" && dd.wearing !== "future");
  const avgScore = scoredDays.length ? Math.round(scoredDays.reduce((a, dd) => a + dd.score, 0) / scoredDays.length) : 0;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };
  const goToday = () => { 
    const today = new Date();
    setCurrentMonth(today.getMonth()); 
    setCurrentYear(today.getFullYear()); 
    setSelectedDay(today.getDate()); 
  };

  const isToday = (day: number) => {
    const today = new Date();
    return currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate();
  };

  const navigateDay = (dir: -1 | 1) => {
    let next = selectedDay + dir;
    if (next >= 1 && next <= monthData.length && monthData[next - 1]?.wearing !== "future") setSelectedDay(next);
  };

  // Locale
  const L = t[lang];
  const bn = lang === "bn";

  // Cardiac events (non-device)
  const events = getEvents(L);
  const cardiacEvents = events.filter((e) => e.type !== "device");
  const deviceEvents = events.filter((e) => e.type === "device");
  const hasCardiacEvents = cardiacEvents.length > 0;

  return (
    <div className="flex h-full" style={{ background: c.pageBg, fontFamily: "Syne, sans-serif" }}>

      {/* ============ LEFT PANEL — Calendar (360px) ============ */}
      <div className="w-[360px] flex-shrink-0 flex flex-col h-full overflow-y-auto hide-scrollbar hidden md:flex" style={{ background: c.cardBg, borderRight: `1px solid ${c.borderColor}` }}>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.borderColor}` }}>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: c.textSecondary }}><ChevronLeft size={16} /></button>
          <span style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500 }}>{bn ? monthNamesBn[currentMonth] : monthNames[currentMonth]} {bn ? toBengaliNum(currentYear) : currentYear}</span>
          <div className="flex items-center gap-2">
            <button onClick={goToday} style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 12 }}>{L.today}</button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: c.textSecondary }}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="px-4 pt-4 pb-2">
          {/* Day headers — Monday-start */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {(bn ? dayHeadersBn : dayHeaders).map((dh, i) => (
              <div key={`dh-${i}`} className="text-center" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{dh}</div>
            ))}
          </div>
          {/* Day tiles */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`pad-${i}`} />)}
            {monthData.map((dd) => {
              const isS = dd.day === selectedDay;
              const isT = isToday(dd.day);
              const hColor = getHealthColor(dd.score);

              // Tile background
              let tileBg = "transparent";
              let textColor = c.futureDateColor;
              if (dd.wearing === "full") {
                tileBg = hColor;
                textColor = "#FFFFFF";
              } else if (dd.wearing === "partial") {
                // 45% opacity of health color
                tileBg = `${hColor}73`; // ~45% hex opacity
                textColor = hColor;
              } else if (dd.wearing === "none") {
                tileBg = c.notWornBg;
                textColor = c.notWornText;
              }
              // future: transparent bg, muted text — already set as defaults

              // Border: today = red ring, selected = dark ring, else none
              let borderW = 0;
              let borderC = "transparent";
              if (isT) { borderW = 2; borderC = "#E8304A"; }
              else if (isS) { borderW = 2; borderC = c.selectedBorder; }

              return (
                <button
                  key={dd.day}
                  onClick={() => dd.wearing !== "future" && setSelectedDay(dd.day)}
                  className="relative w-10 h-10 rounded-md flex items-center justify-center transition-all"
                  style={{
                    background: tileBg,
                    border: borderW ? `${borderW}px solid ${borderC}` : "none",
                    cursor: dd.wearing === "future" ? "default" : "pointer",
                  }}
                >
                  <span style={{ color: textColor, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{bn ? toBengaliNum(dd.day) : dd.day}</span>
                  {/* Alert dot  top-right, 6px */}
                  {dd.hasAlert && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#E8304A" }} />}
                  {/* Symptom dot — top-left, orange */}
                  {dd.hasSymptom && <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#F5A623" }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend — four states */}
        <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: `1px solid ${c.borderColor}` }}>
          {[
            { label: L.full, bg: "#27C28A" },
            { label: L.partial, bg: "#27C28A73" },
            { label: L.notWorn, bg: c.notWornBg },
            { label: L.future, bg: "transparent", border: `1px dashed ${c.textMuted}` },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded" style={{ background: l.bg, border: l.border || "none" }} />
              <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Streak Tracker */}
        <div className="px-4 py-4" style={{ borderTop: `1px solid ${c.borderColor}` }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{L.currentStreak}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={20} style={{ color: "#E8304A" }} />
            <span style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 28 }}>{bn ? toBengaliNum(14) : 14}</span>
            <span style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.days}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Trophy size={13} style={{ color: c.textSecondary }} />
            <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 13 }}>{L.personalBest} — {bn ? toBengaliNum(23) : 23} {L.days}</span>
          </div>
        </div>

        {/* Month Summary Strip */}
        <div className="grid grid-cols-4 gap-2 px-4 py-3" style={{ borderTop: `1px solid ${c.borderColor}` }}>
          {[
            { label: L.daysWorn, value: bn ? toBengaliNum(wornDays) : wornDays.toString(), sub: `${L.of} ${bn ? toBengaliNum(totalPastDays) : totalPastDays}` },
            { label: L.alerts, value: bn ? toBengaliNum(alertDays) : alertDays.toString(), sub: L.events },
            { label: L.avgScore, value: bn ? toBengaliNum(avgScore) : avgScore.toString(), sub: L.health },
            { label: L.hrvTrend, value: "↑", sub: L.improving },
          ].map((m) => (
            <div key={m.label} className="text-center p-2 rounded-lg" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}`, borderRadius: 8 }}>
              <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{m.label}</span>
              <div style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 20, marginTop: 2 }}>{m.value}</div>
              <span style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 9 }}>{m.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============ RIGHT PANEL — Day Detail ============ */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar" style={{ background: c.pageBg }}>
        {selected ? (
          <div className="max-w-[720px] mx-auto w-full px-8 pt-7 pb-8" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Day Header */}
            <div>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 28, lineHeight: 1.2 }}>
                    {bn
                      ? `${toBengaliNum(selectedDay)} ${monthNamesBn[currentMonth]} ${toBengaliNum(currentYear)}`
                      : new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  </h1>
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14, marginTop: 2, display: "block" }}>
                    {bn
                      ? weekdaysBn[new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("en-US", { weekday: "long" })]
                      : new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("en-US", { weekday: "long" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 rounded-full" style={{
                    background: selected.wearing === "full" ? "rgba(39,194,138,0.15)" : selected.wearing === "partial" ? "rgba(245,166,35,0.15)" : d ? "rgba(100,120,200,0.1)" : "rgba(0,0,0,0.05)",
                    color: selected.wearing === "full" ? "#27C28A" : selected.wearing === "partial" ? "#F5A623" : c.textMuted,
                    fontFamily: "DM Mono, monospace", fontSize: 11,
                  }}>
                    {selected.wearing === "full" ? L.wornFn(selected.wearHours, selected.wearMinutes) : selected.wearing === "partial" ? L.partialFn(selected.wearHours, selected.wearMinutes) : L.notWorn}
                  </span>
                  {selected.hasAlert && (
                    <span className="px-2.5 py-1 rounded-full" style={{ background: "rgba(232,48,74,0.12)", color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 10 }}>{L.alert1}</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Narrative */}
            {selected.wearing !== "none" ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} style={{ color: "#E8304A" }} />
                    <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{L.cardishirtAI}</span>
                    {/* Confidence dots */}
                    <div className="flex gap-0.5 ml-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-1 h-1 rounded-full" style={{ background: i <= 4 ? "#E8304A" : c.borderColor }} />
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setLang(lang === "en" ? "bn" : "en")} className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: c.chipBg, color: c.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 10 }}>
                    <Globe size={10} /> {bn ? "Read in English" : "বাংলায় পড়ুন"}
                  </button>
                </div>
                <p style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 16, lineHeight: 1.7 }}>
                  {selected.hasAlert
                    ? L.aiAlert
                    : selected.wearing === "partial"
                    ? L.aiPartialFn(selected.wearHours)
                    : L.aiGood
                  }
                </p>
              </div>
            ) : (
              /* Not-worn day — simplified state */
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shirt size={18} style={{ color: c.textMuted }} />
                  <span style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.noDataDay}</span>
                </div>
                <p style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 16, lineHeight: 1.7 }}>
                  {L.aiNotWorn}
                </p>
                <p style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
                  {L.aiNotWorn2}
                </p>
                <button className="flex items-center gap-1.5 mt-4" style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
                  <Edit3 size={13} /> {L.logNote}
                </button>
              </div>
            )}

            {/* 24-Hour Heart Rate Chart */}
            {selected.wearing !== "none" && (
              <div className="rounded-xl p-5" style={{ background: c.cardBg, boxShadow: c.shadow, border: `1px solid ${c.borderColor}` }}>
                <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 12, display: "block" }}>{L.hrChart}</span>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hrData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="diaryHrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c.textPrimary} stopOpacity={0.08} />
                          <stop offset="100%" stopColor={c.textPrimary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 9, fill: c.textMuted, fontFamily: "DM Mono, monospace" }}
                        tickLine={false} axisLine={false}
                        ticks={["06:00", "12:00", "18:00"]}
                      />
                      <YAxis tick={{ fontSize: 9, fill: c.textMuted, fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} domain={[40, 110]} />
                      <Tooltip
                        contentStyle={{ background: c.cardBg, borderRadius: 8, border: `1px solid ${c.borderColor}`, fontFamily: "DM Mono, monospace", fontSize: 11, color: c.textPrimary }}
                        labelStyle={{ color: c.textSecondary }}
                        formatter={(v: number) => [`${Math.round(v)} BPM`, "Heart Rate"]}
                      />
                      <ReferenceLine y={82} stroke={c.refLine} strokeWidth={0.5} strokeDasharray="4 4" label={{ value: "82", position: "right", fontSize: 8, fill: c.textMuted }} />
                      <ReferenceLine y={56} stroke={c.refLine} strokeWidth={0.5} strokeDasharray="4 4" label={{ value: "56", position: "right", fontSize: 8, fill: c.textMuted }} />
                      <ReferenceLine y={95} stroke={c.refLine} strokeWidth={0.5} strokeDasharray="4 4" label={{ value: "95", position: "right", fontSize: 8, fill: c.textMuted }} />
                      <Area type="monotone" dataKey="hr" stroke={c.textPrimary} strokeWidth={1.5} fill="url(#diaryHrGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Event icons along bottom */}
                <div className="flex gap-3 mt-3">
                  {[
                    { time: "9:00 AM", icon: Pill, label: L.medication, color: "#5B8AF0" },
                    { time: "2:15 PM", icon: AlertTriangle, label: L.irregular, color: "#E8304A" },
                    { time: "6:00 PM", icon: User, label: L.fatigue, color: "#F5A623" },
                  ].map((e) => (
                    <div key={e.time} className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: c.chipBg, fontFamily: "DM Mono, monospace", fontSize: 9, color: c.textSecondary }}>
                      <e.icon size={10} style={{ color: e.color }} /> {bn ? toBengaliNum(e.time) : e.time} — {e.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HRV Summary Row */}
            {selected.wearing !== "none" && (
              <div className="grid grid-cols-2 gap-4">
                {/* RMSSD */}
                <div className="rounded-xl p-5" style={{ background: c.cardBg, boxShadow: c.shadow, border: `1px solid ${c.borderColor}` }}>
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{L.rmssd}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 32 }}>{bn ? toBengaliNum(44) : 44}</span>
                    <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>ms</span>
                  </div>
                  <span style={{ color: "#27C28A", fontFamily: "Syne, sans-serif", fontSize: 12, marginTop: 6, display: "block" }}>{bn ? `${toBengaliNum(6)}ms ${L.aboveAvg}` : `6ms ${L.aboveAvg}`}</span>
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, marginTop: 2, display: "block" }}>{L.goodVariability}</span>
                </div>
                {/* Poincaré Plot */}
                <div className="rounded-xl p-5" style={{ background: c.cardBg, boxShadow: c.shadow, border: `1px solid ${c.borderColor}` }}>
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{L.poincare}</span>
                  <svg width="100%" height="80" viewBox="0 0 120 80" className="mt-2">
                    <line x1="10" y1="70" x2="110" y2="70" stroke={c.poincareAxis} strokeWidth="0.5" />
                    <line x1="10" y1="70" x2="10" y2="5" stroke={c.poincareAxis} strokeWidth="0.5" />
                    <line x1="10" y1="70" x2="110" y2="10" stroke={c.poincareAxis} strokeWidth="0.5" strokeDasharray="4 2" />
                    {Array.from({ length: 60 }).map((_, i) => {
                      const cx = 30 + Math.sin(i * 0.4) * 15 + (i % 7) * 3;
                      const cy = 50 - Math.cos(i * 0.3) * 12 - (i % 5) * 2;
                      return <circle key={i} cx={cx} cy={cy} r={1.5} fill={c.poincareDot} />;
                    })}
                  </svg>
                  <button onClick={() => setHrvExplainOpen(!hrvExplainOpen)} style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                    {L.whatMean}
                  </button>
                  {hrvExplainOpen && (
                    <p style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, lineHeight: 1.5, marginTop: 8 }}>
                      {L.poincareExplain}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Events Timeline */}
            {selected.wearing !== "none" && (
              <div className="rounded-xl p-5" style={{ background: c.cardBg, boxShadow: c.shadow, border: `1px solid ${c.borderColor}` }}>
                <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14, marginBottom: 12, display: "block" }}>{L.eventsTimeline}</span>
                {hasCardiacEvents ? (
                  <div className="space-y-1">
                    {cardiacEvents.map((e, i) => (
                      <div key={`ce-${i}`} className="flex items-center gap-3 py-2.5">
                        <e.icon size={16} style={{ color: e.color, flexShrink: 0 }} />
                        <span style={{ color: c.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 68, flexShrink: 0 }}>{bn ? toBengaliNum(e.time) : e.time}</span>
                        <span className="flex-1" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{e.text}</span>
                        <button style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 13, whiteSpace: "nowrap" }}>{e.action}</button>
                      </div>
                    ))}
                    {/* Device events toggle */}
                    {deviceEvents.length > 0 && (
                      <>
                        <button onClick={() => setShowDeviceEvents(!showDeviceEvents)} className="flex items-center gap-1 mt-2 py-1" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                          {showDeviceEvents ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showDeviceEvents ? L.hideDevice : L.showDevice} {L.deviceEvents} ({bn ? toBengaliNum(deviceEvents.length) : deviceEvents.length})
                        </button>
                        {showDeviceEvents && deviceEvents.map((e, i) => (
                          <div key={`de-${i}`} className="flex items-center gap-3 py-2.5">
                            <e.icon size={16} style={{ color: e.color, flexShrink: 0 }} />
                            <span style={{ color: c.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 68, flexShrink: 0 }}>{bn ? toBengaliNum(e.time) : e.time}</span>
                            <span className="flex-1" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{e.text}</span>
                            <button style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 13, whiteSpace: "nowrap" }}>{e.action}</button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <CheckCircle size={16} style={{ color: "#27C28A" }} />
                    <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.noCardiacEvents}</span>
                  </div>
                )}
              </div>
            )}

            {/* ════════ Medication Log ════════ */}
            <div className="rounded-xl" style={{ background: c.cardBg, boxShadow: c.shadow, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.borderColor }}>
                <div className="flex items-center gap-2">
                  <Pill size={16} style={{ color: "#5B8AF0" }} />
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.medicationLog}</span>
                  <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.chipBg, fontFamily: "DM Mono, monospace", fontSize: 10, color: c.textMuted }}>{medications.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setMedEditMode(!medEditMode); setEditingMedId(null); setShowAddMed(false); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{
                      background: medEditMode ? "rgba(232,48,74,0.1)" : "transparent",
                      color: medEditMode ? "#E8304A" : c.textSecondary,
                      fontFamily: "Syne, sans-serif", fontSize: 12,
                      borderWidth: 1, borderStyle: "solid", borderColor: medEditMode ? "rgba(232,48,74,0.2)" : c.borderColor,
                    }}>
                    {medEditMode ? <><Check size={12} /> {L.done}</> : <><Edit3 size={12} /> {L.edit}</>}
                  </button>
                  {medEditMode && (
                    <button onClick={() => setShowAddMed(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                      style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                      <Plus size={12} /> {L.add}
                    </button>
                  )}
                </div>
              </div>

              {/* Medication rows */}
              <div className="px-5 py-3 space-y-1">
                {medications.map((med) => (
                  <div key={med.id}>
                    {editingMedId === med.id ? (
                      /* Inline edit form */
                      <div className="py-3 space-y-3 rounded-lg px-3 -mx-3" style={{ background: c.surfaceBg }}>
                        <div className="grid grid-cols-3 gap-2">
                          <input value={editMedName} onChange={e => setEditMedName(e.target.value)} placeholder="Name"
                            className="px-3 py-2 rounded-lg outline-none" style={{ background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.textPrimary }} />
                          <input value={editMedDosage} onChange={e => setEditMedDosage(e.target.value)} placeholder="Dosage"
                            className="px-3 py-2 rounded-lg outline-none" style={{ background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor, fontFamily: "DM Mono, monospace", fontSize: 13, color: c.textPrimary }} />
                          <input value={editMedTime} onChange={e => setEditMedTime(e.target.value)} placeholder="Time"
                            className="px-3 py-2 rounded-lg outline-none" style={{ background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor, fontFamily: "DM Mono, monospace", fontSize: 13, color: c.textPrimary }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={saveEditMed} className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                            <Check size={12} /> {L.save}
                          </button>
                          <button onClick={() => setEditingMedId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: c.chipBg, color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                            <X size={12} /> {L.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal row */
                      <div className="flex items-center gap-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{med.name}</span>
                            <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{med.dosage}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} style={{ color: c.textMuted }} />
                            <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{bn ? toBengaliNum(med.time) : med.time}</span>
                          </div>
                        </div>
                        {/* Slot toggles */}
                        <div className="flex gap-1.5">
                          {(["morning", "noon", "evening"] as const).map(slot => (
                            <button key={slot} onClick={() => toggleMedSlot(med.id, slot)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{
                                background: med.slots[slot] ? "rgba(39,194,138,0.15)" : c.chipBg,
                                borderWidth: 1, borderStyle: "solid",
                                borderColor: med.slots[slot] ? "rgba(39,194,138,0.35)" : c.borderColor,
                              }} title={slot.charAt(0).toUpperCase() + slot.slice(1)}>
                              {med.slots[slot]
                                ? <Check size={13} style={{ color: "#27C28A" }} />
                                : <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>{bn ? (slot === "morning" ? "স" : slot === "noon" ? "দু" : "সন্") : slot[0].toUpperCase()}</span>}
                            </button>
                          ))}
                        </div>
                        {/* Edit/Delete buttons in edit mode */}
                        {medEditMode && (
                          <div className="flex items-center gap-1 ml-1">
                            <button onClick={() => startEditMed(med)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "#5B8AF0" }}><Edit3 size={13} /></button>
                            <button onClick={() => deleteMedication(med.id)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "#E8304A" }}><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty state */}
                {medications.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <Pill size={20} style={{ color: c.textMuted }} />
                    <span style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 13 }}>{L.noMedsLogged}</span>
                    <button onClick={() => { setMedEditMode(true); setShowAddMed(true); }}
                      className="flex items-center gap-1 mt-1 px-3 py-1.5 rounded-lg" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                      <Plus size={12} /> {L.addMedication}
                    </button>
                  </div>
                )}

                {/* Add medication form */}
                {showAddMed && (
                  <div className="py-3 space-y-3 rounded-lg px-3 -mx-3 mt-2" style={{ background: c.surfaceBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor }}>
                    <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{L.addNewMed}</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={newMedName} onChange={e => setNewMedName(e.target.value)} placeholder={L.namePlaceholder}
                        className="px-3 py-2 rounded-lg outline-none" style={{ background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.textPrimary }} />
                      <input value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} placeholder={L.dosagePlaceholder}
                        className="px-3 py-2 rounded-lg outline-none" style={{ background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor, fontFamily: "DM Mono, monospace", fontSize: 13, color: c.textPrimary }} />
                      <input value={newMedTime} onChange={e => setNewMedTime(e.target.value)} placeholder={L.timePlaceholder}
                        className="px-3 py-2 rounded-lg outline-none" style={{ background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor, fontFamily: "DM Mono, monospace", fontSize: 13, color: c.textPrimary }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={addMedication} className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                        style={{ background: newMedName.trim() ? "#E8304A" : c.chipBg, color: newMedName.trim() ? "#fff" : c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                        <Plus size={12} /> {L.add}
                      </button>
                      <button onClick={() => { setShowAddMed(false); setNewMedName(""); setNewMedDosage(""); setNewMedTime("8:00 AM"); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: c.chipBg, color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                        {L.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Slot legend */}
              <div className="flex items-center gap-4 px-5 py-3" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: c.borderColor }}>
                {[
                  { label: L.morning, letter: bn ? "স" : "M" },
                  { label: L.noon, letter: bn ? "দু" : "N" },
                  { label: L.evening, letter: bn ? "সন্" : "E" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: c.chipBg, borderWidth: 1, borderStyle: "solid", borderColor: c.borderColor }}>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 8, color: c.textMuted }}>{s.letter}</span>
                    </div>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.textMuted }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Notes — collapsible */}
            <div className="rounded-xl" style={{ background: c.cardBg, boxShadow: c.shadow, border: `1px solid ${c.borderColor}` }}>
              <button onClick={() => setNotesOpen(!notesOpen)} className="w-full flex items-center justify-between px-5 py-4">
                <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.notes}</span>
                {notesOpen ? <ChevronUp size={16} style={{ color: c.textMuted }} /> : <ChevronDown size={16} style={{ color: c.textMuted }} />}
              </button>
              {notesOpen && (
                <div className="px-5 pb-5 space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={L.addNote}
                    className="w-full p-3 rounded-lg outline-none resize-none"
                    rows={2}
                    style={{ background: c.inputBg, color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, border: `1px solid ${c.borderColor}` }}
                  />
                  {noteText && (
                    <button className="px-4 py-1.5 rounded-lg" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}>{L.saveNote}</button>
                  )}
                </div>
              )}
            </div>

            {/* Day Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => navigateDay(-1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{ background: c.chipBg, color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                <ArrowLeft size={14} /> {L.prevDay}
              </button>
              <button onClick={() => navigateDay(1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{ background: c.chipBg, color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                {L.nextDay} <ArrowRight size={14} />
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.selectDay}</p>
          </div>
        )}
      </div>
    </div>
  );
}