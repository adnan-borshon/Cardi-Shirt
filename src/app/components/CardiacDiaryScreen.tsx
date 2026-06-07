import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Flame, Trophy,
  Heart, Shirt, User, Sparkles, Edit3, Pill, AlertTriangle,
  CheckCircle, ArrowLeft, ArrowRight, Plus, Trash2, X, Check, Clock,
  Wind, Gauge, Brain, TrendingUp, TrendingDown
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTokens, useTheme } from "./ThemeContext";
import { API_URL } from "./useBackend";

// --- Types & Data Structures ---
interface DayData {
  day: number;
  wearing: "full" | "partial" | "none" | "future";
  score: number;
  wearHours: number;
  wearMinutes: number;
  hasAlert: boolean;
  hasSymptom: boolean;
  avgBpm?: number;
  avgTemp?: number;
  avgSpo2?: number;
}

const L = {
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
  namePlaceholder: "Name (e.g. Metoprolol)", dosagePlaceholder: "Dosage (e.g. 10mg)", timePlaceholder: "Time (e.g. 8:00 AM)",
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
};

const hrData = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, "0")}:00`,
  hr: h < 6 ? 54 + Math.random() * 8 : h < 9 ? 62 + Math.random() * 12 : h < 17 ? 70 + Math.random() * 15 : h < 21 ? 68 + Math.random() * 10 : 58 + Math.random() * 8,
  worn: !(h >= 0 && h <= 3),
}));

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayHeaders = ["M", "T", "W", "T", "F", "S", "S"];

function getHealthColor(score: number): string {
  if (score >= 75) return "#27C28A";
  if (score >= 40) return "#F5A623";
  return "#E8304A";
}

function getMondayStart(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function EventIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, any> = {
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Flame, Trophy, Heart, Shirt, User, Sparkles, Edit3, Pill, AlertTriangle,
    CheckCircle, ArrowLeft, ArrowRight, Plus, Trash2, X, Check, Clock, Wind, Gauge, Brain, TrendingUp, TrendingDown
  };
  const IconComponent = icons[name] || AlertTriangle;
  return <IconComponent size={16} style={{ color, flexShrink: 0 }} />;
}

function EcgWaveformPlayer({ type }: { type: "normal" | "irregular" | "anomalous" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let x = 0;
    const width = canvas.width;
    const height = canvas.height;
    const points: number[] = [];
    
    const ecgCycle: number[] = [];
    const cycleLen = 100;
    for (let i = 0; i < cycleLen; i++) {
      let val = 0;
      if (i >= 10 && i <= 20) {
        val = Math.sin((i - 10) * Math.PI / 10) * 4;
      } else if (i === 28) {
        val = -3;
      } else if (i >= 29 && i <= 32) {
        val = 25 * Math.sin((i - 29) * Math.PI / 3);
      } else if (i === 33) {
        val = -6;
      } else if (i >= 45 && i <= 60) {
        const multiplier = type === "irregular" ? -6 : 6;
        val = Math.sin((i - 45) * Math.PI / 15) * multiplier;
      }
      
      if (type === "irregular" && i > 60) {
        val += Math.sin(i * 0.5) * 1.5;
      }
      ecgCycle.push(val);
    }

    for (let i = 0; i < width; i++) {
      points.push(height / 2);
    }

    const draw = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(232, 48, 74, 0.05)";
      ctx.lineWidth = 0.5;
      const gridSize = 10;
      for (let i = 0; i < width; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      ctx.strokeStyle = "rgba(232, 48, 74, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += gridSize * 5) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += gridSize * 5) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      points.shift();
      const cycleIdx = x % cycleLen;
      let ecgVal = ecgCycle[cycleIdx];
      
      if (type === "irregular" && Math.random() < 0.05) {
        x += Math.floor(Math.random() * 3);
      }
      
      const nextY = height / 2 - ecgVal * 1.5;
      points.push(nextY);
      x++;

      ctx.strokeStyle = "#E8304A";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, points[0]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(i, points[i]);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={180}
      style={{ width: "100%", height: 180 }}
      className="bg-[#FCF8F8] dark:bg-[#120A0B] rounded-lg border border-red-500/10"
    />
  );
}

export function CardiacDiaryScreen() {
  const tk = useTokens();
  const { theme } = useTheme();
  const d = theme === "dark" || theme === "ocean";

  const c = {
    textPrimary: tk.textPrimary,
    textSecondary: tk.textSecondary,
    textMuted: tk.textMuted,
    notWornBg: d ? "#2A2D3E" : "#EEF0F5",
    notWornText: tk.textMuted,
    futureDateColor: d ? "#4A5070" : "#C2C8D6",
    cardBg: tk.cardBg,
    surfaceBg: tk.cardElevated,
    borderColor: tk.cardBorder,
    pageBg: tk.pageBg,
    selectedBorder: tk.textPrimary,
    chipBg: tk.chipBg,
    inputBg: tk.inputBg,
    shadow: tk.shadow,
    refLine: tk.ecgGrid,
    poincareDot: tk.cardiacRedGlow,
    poincareAxis: tk.borderSubtle,
  };

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [showDeviceEvents, setShowDeviceEvents] = useState(false);
  const [hrvExplainOpen, setHrvExplainOpen] = useState(false);
  const [apiData, setApiData] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam) {
      const parts = dateParam.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setCurrentYear(y);
          setCurrentMonth(m);
          setSelectedDay(d);
        }
      }
    }
  }, []);

  const selectedDateStr = useMemo(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  }, [currentYear, currentMonth, selectedDay]);

  const [notesByDate, setNotesByDate] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("cardishirt_diary_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("cardishirt_diary_notes", JSON.stringify(notesByDate));
  }, [notesByDate]);

  useEffect(() => {
    setNoteText(notesByDate[selectedDateStr] || "");
    setNoteSaved(false);
  }, [selectedDateStr, notesByDate]);

  const saveNote = () => {
    setNotesByDate(prev => ({
      ...prev,
      [selectedDateStr]: noteText
    }));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/diary/summary`)
      .then((r) => r.json())
      .then((data) => setApiData(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Error loading diary summaries:", e));
  }, []);

  type MedSlot = "morning" | "noon" | "evening";
  interface MedEntry { id: string; name: string; dosage: string; time: string; }
  const [medications, setMedications] = useState<MedEntry[]>([
    { id: "m1", name: "Metoprolol", dosage: "25mg", time: "8:00 AM" },
    { id: "m2", name: "Aspirin", dosage: "75mg", time: "8:00 AM" },
    { id: "m3", name: "Atorvastatin", dosage: "10mg", time: "9:00 PM" },
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

  const [medAdherenceByDate, setMedAdherenceByDate] = useState<Record<string, Record<string, Record<MedSlot, boolean>>>>(() => {
    try {
      const saved = localStorage.getItem("cardishirt_diary_meds");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("cardishirt_diary_meds", JSON.stringify(medAdherenceByDate));
  }, [medAdherenceByDate]);

  const toggleMedSlot = (id: string, slot: MedSlot) => {
    setMedAdherenceByDate(prev => {
      const dayAdherence = prev[selectedDateStr] || {};
      const medAdherence = dayAdherence[id] || { morning: false, noon: false, evening: false };
      return {
        ...prev,
        [selectedDateStr]: {
          ...dayAdherence,
          [id]: {
            ...medAdherence,
            [slot]: !medAdherence[slot]
          }
        }
      };
    });
  };

  const isSlotChecked = (medId: string, slot: MedSlot) => {
    return medAdherenceByDate[selectedDateStr]?.[medId]?.[slot] || false;
  };

  const addMedication = () => {
    if (!newMedName.trim()) return;
    setMedications(prev => [...prev, { id: `m${Date.now()}`, name: newMedName.trim(), dosage: newMedDosage.trim() || "—", time: newMedTime }]);
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

  // Custom events persistent state
  const [customEventsByDate, setCustomEventsByDate] = useState<Record<string, Array<{
    id: string;
    time: string;
    iconName: string;
    color: string;
    text: string;
    action: string;
    type: "patient" | "device" | "cardiac";
    isCustom?: boolean;
  }>>> (() => {
    try {
      const saved = localStorage.getItem("cardishirt_diary_events");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("cardishirt_diary_events", JSON.stringify(customEventsByDate));
  }, [customEventsByDate]);

  // Event description and time overrides persistent state
  const [eventOverridesByDate, setEventOverridesByDate] = useState<Record<string, Record<string, { text: string; time: string }>>> (() => {
    try {
      const saved = localStorage.getItem("cardishirt_diary_event_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("cardishirt_diary_event_overrides", JSON.stringify(eventOverridesByDate));
  }, [eventOverridesByDate]);

  // Edit Event Modal state variables
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editEventText, setEditEventText] = useState("");
  const [editEventTime, setEditEventTime] = useState("");

  const handleSaveEventOverride = () => {
    if (!editingEvent) return;
    setEventOverridesByDate(prev => {
      const dayOverrides = prev[selectedDateStr] || {};
      return {
        ...prev,
        [selectedDateStr]: {
          ...dayOverrides,
          [editingEvent.id]: {
            text: editEventText,
            time: editEventTime
          }
        }
      };
    });
    setEditEventModalOpen(false);
    setEditingEvent(null);
  };

  // Dialog / Modal state variables
  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [symptomName, setSymptomName] = useState("");
  const [symptomTime, setSymptomTime] = useState("");
  const [symptomNotes, setSymptomNotes] = useState("");

  const [selectedEventDetails, setSelectedEventDetails] = useState<any>(null);
  const [ecgPlayerOpen, setEcgPlayerOpen] = useState(false);
  const [ecgPlayerType, setEcgPlayerType] = useState<"normal" | "irregular" | "anomalous">("normal");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const openSymptomModal = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    setSymptomName("");
    setSymptomTime(`${hours}:${minutes} ${ampm}`);
    setSymptomNotes("");
    setSymptomModalOpen(true);
  };

  const logSymptom = (name: string, time: string, notes: string) => {
    const newEvent = {
      id: `symptom-${Date.now()}`,
      time,
      iconName: "AlertTriangle",
      color: "#F5A623",
      text: `Symptom logged: ${name}${notes ? ` (${notes})` : ""}`,
      action: "Edit note",
      type: "patient" as const,
      isCustom: true
    };
    
    setCustomEventsByDate(prev => {
      const list = prev[selectedDateStr] || [];
      return {
        ...prev,
        [selectedDateStr]: [...list, newEvent]
      };
    });
  };

  const handleSaveSymptom = () => {
    if (!symptomName.trim()) return;
    logSymptom(symptomName, symptomTime, symptomNotes);
    setSymptomModalOpen(false);
  };

  const deleteCustomEvent = (eventId: string) => {
    setCustomEventsByDate(prev => {
      const list = prev[selectedDateStr] || [];
      return {
        ...prev,
        [selectedDateStr]: list.filter(e => e.id !== eventId)
      };
    });
  };

  const handleActionClick = (event: any) => {
    if (event.action === L.evtViewECG) {
      if (event.text.toLowerCase().includes("irregular") || event.text.toLowerCase().includes("t wave") || event.text.toLowerCase().includes("st deviation")) {
        setEcgPlayerType("irregular");
      } else {
        setEcgPlayerType("normal");
      }
      setSelectedEventDetails(event);
      setEcgPlayerOpen(true);
    } else if (event.action === L.evtEditNote) {
      setEditingEvent(event);
      setEditEventText(event.text);
      setEditEventTime(event.time);
      setEditEventModalOpen(true);
    } else if (event.action === L.evtViewDetails || event.action === L.evtView) {
      setSelectedEventDetails(event);
      setDetailsModalOpen(true);
    }
  };

  // Compile calendar: merge SQLite server data and fallback mockup generator
  const monthData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data: DayData[] = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      if (date > today) {
        data.push({ day: d, wearing: "future", score: 0, wearHours: 0, wearMinutes: 0, hasAlert: false, hasSymptom: false });
        continue;
      }
      
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRec = apiData.find((x) => x.day === dateStr);
      const hasCustomSymptom = customEventsByDate[dateStr]?.some(e => e.type === "patient" && e.text.toLowerCase().includes("symptom")) || false;

      if (dayRec) {
        // Real active database record present
        data.push({
          day: d,
          wearing: "full",
          score: dayRec.avgBpm < 100 ? 92 : 55,
          wearHours: 24,
          wearMinutes: 0,
          hasAlert: dayRec.avgBpm > 100 || dayRec.avgSpo2 < 90,
          hasSymptom: hasCustomSymptom,
          avgBpm: dayRec.avgBpm,
          avgTemp: dayRec.avgTemp,
          avgSpo2: dayRec.avgSpo2
        });
      } else {
        // Fallback: Populate details from seed generator so calendar displays realistic history
        const seed = (d * 7 + currentMonth * 13) % 10;
        const wearing: DayData["wearing"] = seed < 1 ? "none" : seed < 3 ? "partial" : "full";
        const score = wearing === "none" ? 0 : 40 + (seed * 6);
        data.push({
          day: d,
          wearing,
          score,
          wearHours: wearing === "full" ? 8 + (seed % 4) : wearing === "partial" ? 3 + (seed % 4) : 0,
          wearMinutes: wearing === "none" ? 0 : (seed * 7) % 60,
          hasAlert: d === 3 || d === 15,
          hasSymptom: d === 10 || d === 25 || hasCustomSymptom,
        });
      }
    }
    return data;
  }, [currentYear, currentMonth, apiData, customEventsByDate]);

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
    const next = selectedDay + dir;
    if (next >= 1 && next <= monthData.length && monthData[next - 1]?.wearing !== "future") {
      setSelectedDay(next);
    }
  };

  // Compile timeline events per-day dynamically
  const dayEvents = useMemo(() => {
    const isWorn = selected && selected.wearing !== "none";
    const overrides = eventOverridesByDate[selectedDateStr] || {};

    let baseEvents = isWorn ? [
      { id: "e1", time: overrides["e1"]?.time || "7:14 AM", iconName: "Shirt", color: "#9AA0B8", text: overrides["e1"]?.text || L.evtShirtConnected, action: L.evtViewDetails, type: "device" as const },
      { id: "e2", time: overrides["e2"]?.time || "8:30 AM", iconName: "User", color: "#5B8AF0", text: overrides["e2"]?.text || L.evtCheckin, action: L.evtEditNote, type: "patient" as const },
      { id: "e3", time: overrides["e3"]?.time || "9:00 AM", iconName: "Pill", color: "#5B8AF0", text: overrides["e3"]?.text || L.evtMedLogged, action: L.evtEditNote, type: "patient" as const },
      { id: "e4", time: overrides["e4"]?.time || "11:45 AM", iconName: "Wind", color: "#27C28A", text: overrides["e4"]?.text || L.evtBreathingNormal, action: L.evtView, type: "cardiac" as const },
      { id: "e5", time: overrides["e5"]?.time || "1:30 PM", iconName: "Gauge", color: "#F5A623", text: overrides["e5"]?.text || L.evtStrainElevated, action: L.evtView, type: "cardiac" as const },
      { id: "e6", time: overrides["e6"]?.time || "2:15 PM", iconName: "Heart", color: "#E8304A", text: overrides["e6"]?.text || L.evtIrregular, action: L.evtViewECG, type: "cardiac" as const },
      { id: "e7", time: overrides["e7"]?.time || "2:18 PM", iconName: "TrendingDown", color: "#E8304A", text: overrides["e7"]?.text || L.evtTWaveInversion, action: L.evtViewECG, type: "cardiac" as const },
      { id: "e8", time: overrides["e8"]?.time || "2:22 PM", iconName: "TrendingUp", color: "#E8304A", text: overrides["e8"]?.text || L.evtSTDeviation, action: L.evtViewECG, type: "cardiac" as const },
      { id: "e9", time: overrides["e9"]?.time || "3:15 PM", iconName: "Brain", color: "#27C28A", text: overrides["e9"]?.text || L.evtStressLow, action: L.evtView, type: "cardiac" as const },
      { id: "e10", time: overrides["e10"]?.time || "3:42 PM", iconName: "Sparkles", color: "#F5A623", text: overrides["e10"]?.text || L.evtAISummary, action: L.evtView, type: "cardiac" as const },
      { id: "e11", time: overrides["e11"]?.time || "6:00 PM", iconName: "User", color: "#5B8AF0", text: overrides["e11"]?.text || L.evtFatigue, action: L.evtEditNote, type: "patient" as const },
    ] : [];

    // Filter out if not alerts day (selected day hasAlert must be true for alert/cardiac red events)
    if (selected && !selected.hasAlert) {
      baseEvents = baseEvents.filter(e => e.color !== "#E8304A");
    }

    const custom = (customEventsByDate[selectedDateStr] || []).map(evt => {
      const o = overrides[evt.id];
      if (o) {
        return {
          ...evt,
          time: o.time,
          text: o.text
        };
      }
      return evt;
    });
    
    const combined = [...baseEvents, ...custom];

    const parseTimeToMinutes = (tStr: string) => {
      const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };

    return combined.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }, [selected, selectedDateStr, customEventsByDate, eventOverridesByDate]);

  const cardiacEvents = dayEvents.filter((e) => e.type !== "device");
  const deviceEvents = dayEvents.filter((e) => e.type === "device");
  const hasCardiacEvents = cardiacEvents.length > 0;


  return (
    <div className="flex h-full" style={{ background: c.pageBg, fontFamily: "Syne, sans-serif" }}>

      {/* ============ LEFT PANEL — Calendar (360px) ============ */}
      <div className="w-[360px] flex-shrink-0 flex flex-col h-full overflow-y-auto hide-scrollbar hidden md:flex" style={{ background: c.cardBg, borderRight: `1px solid ${c.borderColor}` }}>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.borderColor}` }}>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: c.textSecondary }}><ChevronLeft size={16} /></button>
          <span style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500 }}>{monthNames[currentMonth]} {currentYear}</span>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="hover:underline" style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 12 }}>{L.today}</button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: c.textSecondary }}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="px-4 pt-4 pb-2">
          {/* Day headers — Monday-start */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayHeaders.map((dh, i) => (
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
                tileBg = `${hColor}73`; // ~45% hex opacity
                textColor = hColor;
              } else if (dd.wearing === "none") {
                tileBg = c.notWornBg;
                textColor = c.notWornText;
              }

              // Border ring calculations
              let borderW = 0;
              let borderC = "transparent";
              if (isT) { borderW = 2; borderC = "#E8304A"; }
              else if (isS) { borderW = 2; borderC = c.selectedBorder; }

              return (
                <button
                  key={dd.day}
                  onClick={() => dd.wearing !== "future" && setSelectedDay(dd.day)}
                  className="relative w-10 h-10 rounded-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: tileBg,
                    border: borderW ? `${borderW}px solid ${borderC}` : "none",
                    cursor: dd.wearing === "future" ? "default" : "pointer",
                  }}
                >
                  <span style={{ color: textColor, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{dd.day}</span>
                  {/* Alert dot top-right */}
                  {dd.hasAlert && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#E8304A" }} />}
                  {/* Symptom dot top-left */}
                  {dd.hasSymptom && <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#F5A623" }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" style={{ borderTop: `1px solid ${c.borderColor}` }}>
          {[
            { label: L.full, bg: "#27C28A" },
            { label: L.partial, bg: "#27C28A73" },
            { label: L.notWorn, bg: c.notWornBg },
            { label: L.future, bg: "transparent", border: `1px dashed ${c.textMuted}` },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded" style={{ background: l.bg, border: l.border || "none" }} />
              <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Streak Tracker */}
        <div className="px-4 py-4" style={{ borderTop: `1px solid ${c.borderColor}` }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{L.currentStreak}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <Flame size={20} style={{ color: "#E8304A" }} />
            <span style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 28, fontWeight: 500 }}>14</span>
            <span style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.days}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Trophy size={13} style={{ color: c.textSecondary }} />
            <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 13 }}>{L.personalBest} — 23 {L.days}</span>
          </div>
        </div>

        {/* Month Summary Strip */}
        <div className="grid grid-cols-4 gap-2 px-4 py-3" style={{ borderTop: `1px solid ${c.borderColor}` }}>
          {[
            { label: L.daysWorn, value: wornDays.toString(), sub: `${L.of} ${totalPastDays}` },
            { label: L.alerts, value: alertDays.toString(), sub: L.events },
            { label: L.avgScore, value: avgScore.toString(), sub: L.health },
            { label: L.hrvTrend, value: "↑", sub: L.improving },
          ].map((m) => (
            <div key={m.label} className="text-center p-2 rounded-lg" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}` }}>
              <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 10, display: "block" }}>{m.label}</span>
              <div style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 18, fontWeight: 500, marginTop: 2 }}>{m.value}</div>
              <span style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 9, display: "block" }}>{m.sub}</span>
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
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 28, lineHeight: 1.2 }}>
                    {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  </h1>
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14, marginTop: 2, display: "block" }}>
                    {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("en-US", { weekday: "long" })}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
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
                  {selected.wearing !== "none" && (
                    <button
                      onClick={openSymptomModal}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:opacity-90 active:scale-95 transition-all text-white font-medium"
                      style={{
                        background: "#F5A623",
                        fontFamily: "Syne, sans-serif",
                        fontSize: 11,
                        boxShadow: "0 2px 5px rgba(245, 166, 35, 0.2)"
                      }}
                    >
                      <Plus size={12} /> Log Symptom
                    </button>
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
                    <div className="flex gap-0.5 ml-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-1 h-1 rounded-full" style={{ background: i <= 4 ? "#E8304A" : c.borderColor }} />
                      ))}
                    </div>
                  </div>
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
              /* Not worn day narrative */
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
                <button
                  onClick={() => setNotesOpen(true)}
                  className="flex items-center gap-1.5 mt-4 hover:opacity-80"
                  style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 13 }}
                >
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
                {/* Event timeline markers */}
                <div className="flex flex-wrap gap-2.5 mt-3">
                  {dayEvents
                    .filter(e => e.type === "patient" || e.color === "#E8304A" || e.iconName === "Pill" || e.iconName === "AlertTriangle")
                    .map((e, idx) => (
                      <div key={`cm-${idx}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: c.chipBg, fontFamily: "DM Mono, monospace", fontSize: 9, color: c.textSecondary }}>
                        <EventIcon name={e.iconName} color={e.color} /> {e.time} — {e.text.replace("Symptom logged: ", "").replace("Medication logged: ", "")}
                      </div>
                    ))}
                  {!dayEvents.some(e => e.type === "patient" || e.color === "#E8304A" || e.iconName === "Pill" || e.iconName === "AlertTriangle") && (
                    <span style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 10 }}>No markers for this day</span>
                  )}
                </div>
              </div>
            )}

            {/* HRV Summary Row */}
            {selected.wearing !== "none" && (
              <div className="grid grid-cols-2 gap-4">
                {/* RMSSD Card */}
                <div className="rounded-xl p-5" style={{ background: c.cardBg, boxShadow: c.shadow, border: `1px solid ${c.borderColor}` }}>
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{L.rmssd}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 32, fontWeight: 500 }}>44</span>
                    <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>ms</span>
                  </div>
                  <span style={{ color: "#27C28A", fontFamily: "Syne, sans-serif", fontSize: 12, marginTop: 6, display: "block" }}>{`6ms ${L.aboveAvg}`}</span>
                  <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, marginTop: 2, display: "block" }}>{L.goodVariability}</span>
                </div>
                
                {/* Poincaré Plot SVG */}
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
                  <button onClick={() => setHrvExplainOpen(!hrvExplainOpen)} className="mt-2 text-xs font-semibold hover:underline block" style={{ color: "#E8304A", fontFamily: "Syne, sans-serif" }}>
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
                        <EventIcon name={e.iconName} color={e.color} />
                        <span style={{ color: c.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 68, flexShrink: 0 }}>{e.time}</span>
                        <span className="flex-1" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{e.text}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleActionClick(e)} className="hover:underline text-left" style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 13, whiteSpace: "nowrap" }}>{e.action}</button>
                          {e.isCustom && (
                            <button onClick={() => deleteCustomEvent(e.id)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: c.textMuted }} title="Delete event">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Device events toggle */}
                    {deviceEvents.length > 0 && (
                      <>
                        <button onClick={() => setShowDeviceEvents(!showDeviceEvents)} className="flex items-center gap-1 mt-2 py-1 hover:opacity-80" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                          {showDeviceEvents ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showDeviceEvents ? L.hideDevice : L.showDevice} {L.deviceEvents} ({deviceEvents.length})
                        </button>
                        {showDeviceEvents && deviceEvents.map((e, i) => (
                          <div key={`de-${i}`} className="flex items-center gap-3 py-2.5">
                            <EventIcon name={e.iconName} color={e.color} />
                            <span style={{ color: c.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 68, flexShrink: 0 }}>{e.time}</span>
                            <span className="flex-1" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{e.text}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleActionClick(e)} className="hover:underline text-left" style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 13, whiteSpace: "nowrap" }}>{e.action}</button>
                              {e.isCustom && (
                                <button onClick={() => deleteCustomEvent(e.id)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: c.textMuted }} title="Delete event">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:opacity-80" style={{
                      background: medEditMode ? "rgba(232,48,74,0.1)" : "transparent",
                      color: medEditMode ? "#E8304A" : c.textSecondary,
                      fontFamily: "Syne, sans-serif", fontSize: 12,
                      borderWidth: 1, borderStyle: "solid", borderColor: medEditMode ? "rgba(232,48,74,0.2)" : c.borderColor,
                    }}>
                    {medEditMode ? <><Check size={12} /> {L.done}</> : <><Edit3 size={12} /> {L.edit}</>}
                  </button>
                  {medEditMode && (
                    <button onClick={() => setShowAddMed(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:opacity-90"
                      style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                      <Plus size={12} /> {L.add}
                    </button>
                  )}
                </div>
              </div>

              {/* Medication list */}
              <div className="px-5 py-3 space-y-1">
                {medications.map((med) => (
                  <div key={med.id}>
                    {editingMedId === med.id ? (
                      /* Inline editing form */
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
                          <button onClick={saveEditMed} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:opacity-90" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                            <Check size={12} /> {L.save}
                          </button>
                          <button onClick={() => setEditingMedId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10" style={{ background: c.chipBg, color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                            <X size={12} /> {L.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Row */
                      <div className="flex items-center gap-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{med.name}</span>
                            <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{med.dosage}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} style={{ color: c.textMuted }} />
                            <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{med.time}</span>
                          </div>
                        </div>
                        {/* Interactive checkboxes */}
                        <div className="flex gap-1.5">
                          {(["morning", "noon", "evening"] as const).map(slot => {
                            const checked = isSlotChecked(med.id, slot);
                            return (
                              <button key={slot} onClick={() => toggleMedSlot(med.id, slot)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:scale-105"
                                style={{
                                  background: checked ? "rgba(39,194,138,0.15)" : c.chipBg,
                                  borderWidth: 1, borderStyle: "solid",
                                  borderColor: checked ? "rgba(39,194,138,0.35)" : c.borderColor,
                                }} title={slot.charAt(0).toUpperCase() + slot.slice(1)}>
                                {checked
                                  ? <Check size={13} style={{ color: "#27C28A" }} />
                                  : <span style={{ color: c.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>{slot[0].toUpperCase()}</span>}
                              </button>
                            );
                          })}
                        </div>
                        {/* Edit controls */}
                        {medEditMode && (
                          <div className="flex items-center gap-1 ml-1 animate-fade-in">
                            <button onClick={() => startEditMed(med)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "#5B8AF0" }}><Edit3 size={13} /></button>
                            <button onClick={() => deleteMedication(med.id)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "#E8304A" }}><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty medication log */}
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

                {/* Form to add a new medication */}
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
                      <button onClick={addMedication} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:opacity-90"
                        style={{ background: newMedName.trim() ? "#E8304A" : c.chipBg, color: newMedName.trim() ? "#fff" : c.textMuted, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                        <Plus size={12} /> {L.add}
                      </button>
                      <button onClick={() => { setShowAddMed(false); setNewMedName(""); setNewMedDosage(""); setNewMedTime("8:00 AM"); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10" style={{ background: c.chipBg, color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                        {L.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Slot Legend Footer */}
              <div className="flex items-center gap-4 px-5 py-3" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: c.borderColor }}>
                {[
                  { label: L.morning, letter: "M" },
                  { label: L.noon, letter: "N" },
                  { label: L.evening, letter: "E" },
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

            {/* Daily Doctor Notes */}
            <div className="rounded-xl" style={{ background: c.cardBg, boxShadow: c.shadow, border: `1px solid ${c.borderColor}` }}>
              <button onClick={() => setNotesOpen(!notesOpen)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-xl">
                <span style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{L.notes}</span>
                {notesOpen ? <ChevronUp size={16} style={{ color: c.textMuted }} /> : <ChevronDown size={16} style={{ color: c.textMuted }} />}
              </button>
              {notesOpen && (
                <div className="px-5 pb-5 space-y-3 animate-slide-down">
                  <textarea
                    id="daily-note-textarea"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={L.addNote}
                    className="w-full p-3 rounded-lg outline-none resize-none"
                    rows={2}
                    style={{ background: c.inputBg, color: c.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, border: `1px solid ${c.borderColor}` }}
                  />
                  {noteText && (
                    <button
                      onClick={saveNote}
                      className="px-4 py-1.5 rounded-lg hover:opacity-90 flex items-center gap-1.5"
                      style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}
                    >
                      {noteSaved ? <Check size={12} /> : null}
                      {noteSaved ? "Saved!" : L.saveNote}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Prev/Next Day Navigation Buttons */}
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

      {/* Modal Overlays */}
      {symptomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 animate-scale-up" style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold flex items-center gap-2" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif" }}>
                <AlertTriangle size={18} style={{ color: "#F5A623" }} /> Log a Symptom
              </span>
              <button onClick={() => setSymptomModalOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: c.textSecondary }}>
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Predefined Chips */}
              <div>
                <span className="text-xs font-semibold block mb-2" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>SELECT SYMPTOM</span>
                <div className="flex flex-wrap gap-2">
                  {["Chest tightness", "Shortness of breath", "Dizziness", "Mild fatigue", "Palpitations"].map((preset) => {
                    const isSel = symptomName === preset;
                    return (
                      <button
                        key={preset}
                        onClick={() => setSymptomName(preset)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isSel ? "#F5A623" : c.chipBg,
                          color: isSel ? "#fff" : c.textSecondary,
                          border: isSel ? "1px solid #F5A623" : `1px solid ${c.borderColor}`,
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Input */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>OR TYPE CUSTOM SYMPTOM</span>
                <input
                  type="text"
                  placeholder="Enter custom symptom..."
                  value={symptomName}
                  onChange={(e) => setSymptomName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl outline-none"
                  style={{ background: c.inputBg, border: `1px solid ${c.borderColor}`, color: c.textPrimary, fontSize: 13, fontFamily: "Syne, sans-serif" }}
                />
              </div>

              {/* Time selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>TIME</span>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={symptomTime}
                  onChange={(e) => setSymptomTime(e.target.value)}
                  className="px-3.5 py-2 rounded-xl outline-none"
                  style={{ background: c.inputBg, border: `1px solid ${c.borderColor}`, color: c.textPrimary, fontSize: 13, fontFamily: "DM Mono, monospace" }}
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>NOTES / CONTEXT (OPTIONAL)</span>
                <textarea
                  placeholder="e.g. Occurred while climbing stairs, lasted 2 minutes"
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  rows={2}
                  className="px-3.5 py-2 rounded-xl outline-none resize-none"
                  style={{ background: c.inputBg, border: `1px solid ${c.borderColor}`, color: c.textPrimary, fontSize: 13, fontFamily: "Syne, sans-serif" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end mt-2">
              <button onClick={() => setSymptomModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: c.textSecondary, background: c.chipBg, fontFamily: "Syne, sans-serif" }}>
                Cancel
              </button>
              <button
                disabled={!symptomName.trim()}
                onClick={handleSaveSymptom}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "#E8304A", fontFamily: "Syne, sans-serif" }}
              >
                Log Symptom
              </button>
            </div>
          </div>
        </div>
      )}

      {ecgPlayerOpen && selectedEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl p-6 flex flex-col gap-4" style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold flex items-center gap-2" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif" }}>
                <Heart size={18} style={{ color: "#E8304A" }} /> ECG Clip: {selectedEventDetails.text}
              </span>
              <button onClick={() => setEcgPlayerOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: c.textSecondary }}>
                <X size={16} />
              </button>
            </div>

            <div className="text-xs" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>
              Timestamp: <span className="font-semibold" style={{ fontFamily: "DM Mono, monospace" }}>{selectedEventDetails.time}</span> | Channel: Lead II | Sample Rate: 250 Hz
            </div>

            {/* ECG wave canvas player */}
            <EcgWaveformPlayer type={ecgPlayerType} />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}` }}>
                <span className="text-[10px] block" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif" }}>HEART RATE</span>
                <span className="text-lg font-semibold" style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace" }}>
                  {ecgPlayerType === "irregular" ? "88 BPM" : "64 BPM"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}` }}>
                <span className="text-[10px] block" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif" }}>RHYTHM TYPE</span>
                <span className="text-sm font-semibold" style={{ color: ecgPlayerType === "irregular" ? "#E8304A" : "#27C28A", fontFamily: "Syne, sans-serif" }}>
                  {ecgPlayerType === "irregular" ? "PVC / Irregular" : "Normal Sinus"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}` }}>
                <span className="text-[10px] block" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif" }}>STATUS</span>
                <span className="text-sm font-semibold" style={{ color: ecgPlayerType === "irregular" ? "#F5A623" : "#27C28A", fontFamily: "Syne, sans-serif" }}>
                  {ecgPlayerType === "irregular" ? "Mild Anomaly" : "Healthy"}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>
              {ecgPlayerType === "irregular"
                ? "The tracing shows isolated premature ventricular contractions (PVCs) lasting approximately 40 seconds. Baselines before and after are stable. Recorded automatically due to localized HR velocity changes."
                : "Continuous sinus rhythm observed with steady P-R intervals and normal T-wave morphology. No signs of conduction defects or ST-segment elevation."}
            </p>

            <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${c.borderColor}` }}>
              <div className="flex items-center gap-1.5">
                <Brain size={13} style={{ color: "#27C28A" }} />
                <span className="text-[11px]" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>Model confidence: 94.6%</span>
              </div>
              <button onClick={() => setEcgPlayerOpen(false)} className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: "#E8304A", fontFamily: "Syne, sans-serif" }}>
                Close Waveform
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsModalOpen && selectedEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 animate-scale-up" style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold flex items-center gap-2" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif" }}>
                Event Details
              </span>
              <button onClick={() => setDetailsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: c.textSecondary }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}` }}>
                <EventIcon name={selectedEventDetails.iconName} color={selectedEventDetails.color} />
                <div>
                  <span className="text-xs block" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif" }}>EVENT</span>
                  <span className="text-sm font-semibold" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif" }}>{selectedEventDetails.text}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-xl" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}` }}>
                  <span className="text-[10px] block" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif" }}>TIMESTAMP</span>
                  <span className="text-xs font-semibold" style={{ color: c.textPrimary, fontFamily: "DM Mono, monospace" }}>{selectedEventDetails.time}</span>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: c.surfaceBg, border: `1px solid ${c.borderColor}` }}>
                  <span className="text-[10px] block" style={{ color: c.textMuted, fontFamily: "Syne, sans-serif" }}>SEVERITY</span>
                  <span className="text-xs font-semibold" style={{
                    color: selectedEventDetails.color === "#E8304A" ? "#E8304A" : selectedEventDetails.color === "#F5A623" ? "#F5A623" : "#27C28A",
                    fontFamily: "Syne, sans-serif"
                  }}>
                    {selectedEventDetails.color === "#E8304A" ? "High Alert" : selectedEventDetails.color === "#F5A623" ? "Moderate Anomaly" : "Normal Information"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold block mb-1" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>DIAGNOSTIC INSIGHT</span>
                <p className="text-xs leading-relaxed" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>
                  {selectedEventDetails.text.includes("Strain") 
                    ? "Your physical exertion/strain index spiked. Typical baseline resting strain is <20%, while this event reached 42%. Your heart rate normalized rapidly afterwards, indicating a healthy cardiac recovery response."
                    : selectedEventDetails.text.includes("Breathing")
                    ? "Your respiratory rate was steady at 16 breaths per minute. This falls well within the ideal resting range of 12-20 BPM, indicating calm parasympathetic tone and stable respiratory function."
                    : selectedEventDetails.text.includes("Stress")
                    ? "Stress index measured 24/100, which correlates with optimal autonomic balance. Consistent low stress scores promote long-term cardiovascular health."
                    : selectedEventDetails.text.includes("connected")
                    ? "The CardiShirt smart textile detected a proper skin-to-sensor contact and established a Bluetooth Low Energy (BLE) link to the app, initiating telemetry recording."
                    : selectedEventDetails.text.includes("Check-in")
                    ? "Patient self-reported as 'feeling good' during the daily check-in prompt. No associated vitals abnormalities or discomfort were logged."
                    : "No acute action is required. This event has been archived and will be included in your weekly report summary for your healthcare provider."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end mt-2">
              <button onClick={() => setDetailsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "#E8304A", fontFamily: "Syne, sans-serif" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Note Modal */}
      {editEventModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={{ background: c.cardBg, border: `1px solid ${c.borderColor}`, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold flex items-center gap-2" style={{ color: c.textPrimary, fontFamily: "Syne, sans-serif" }}>
                <Edit3 size={18} style={{ color: "#E8304A" }} /> Edit Event Note
              </span>
              <button onClick={() => setEditEventModalOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: c.textSecondary }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>EVENT DESCRIPTION / NOTE</span>
                <textarea
                  value={editEventText}
                  onChange={(e) => setEditEventText(e.target.value)}
                  rows={3}
                  className="px-3.5 py-2 rounded-xl outline-none resize-none"
                  style={{ background: c.inputBg, border: `1px solid ${c.borderColor}`, color: c.textPrimary, fontSize: 13, fontFamily: "Syne, sans-serif" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold" style={{ color: c.textSecondary, fontFamily: "Syne, sans-serif" }}>EVENT TIME</span>
                <input
                  type="text"
                  value={editEventTime}
                  onChange={(e) => setEditEventTime(e.target.value)}
                  className="px-3.5 py-2 rounded-xl outline-none"
                  style={{ background: c.inputBg, border: `1px solid ${c.borderColor}`, color: c.textPrimary, fontSize: 13, fontFamily: "DM Mono, monospace" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end mt-2">
              <button onClick={() => setEditEventModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: c.textSecondary, background: c.chipBg, fontFamily: "Syne, sans-serif" }}>
                Cancel
              </button>
              <button
                onClick={handleSaveEventOverride}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#E8304A", fontFamily: "Syne, sans-serif" }}
              >
                Update Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}