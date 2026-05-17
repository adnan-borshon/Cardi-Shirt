import {Heart,TrendingUp,Activity,Shield,Wind,Gauge,Brain,AlertCircle,TrendingDown,Zap} from "lucide-react";
import {useTokens} from "./ThemeContext";
import {useLiveVitals} from "./useBackend";

export function VitalsRow(){
const tk=useTokens();
const{vitals}=useLiveVitals();

const v=vitals;
const bpm=v?Math.round(v.bpm):72;
const temp=v?v.temp.toFixed(1):"36.5";

const cards=[
{label:"Heart Rate",value:String(bpm),unit:"BPM",icon:Heart,accent:bpm>100?"#E8304A":bpm<50?"#F5A623":"#27C28A",trendLabel:v?"Live":"Stable",detail:v?`Updated ${new Date(v.timestamp).toLocaleTimeString()}`:"+0 from 10m ago"},
{label:"Body Temp",value:temp,unit:"°C",icon:Activity,accent:Number(temp)>37.5?"#E8304A":"#27C28A",trendLabel:Number(temp)>37.5?"Elevated":"Normal",detail:v?"From CardiShirt sensor":"Steady"},
{label:"AI Health Score",value:"87",unit:"/100",icon:Shield,accent:"#27C28A",trendLabel:"+3 from yesterday",detail:"Tap to expand"},
{label:"HRV",value:"42",unit:"ms",icon:Activity,accent:"#27C28A",trendLabel:"Good variability",detail:"Improving trend"},
{label:"Breathing Rate",value:"16",unit:"BPM",icon:Wind,accent:"#5B8AF0",trendLabel:"Normal",detail:"Calm & steady"},
{label:"T Wave Status",value:"Normal",unit:"",icon:TrendingUp,accent:"#27C28A",trendLabel:"No inversion",detail:"All leads upright"},
{label:"Strain Level",value:"Low",unit:"",icon:Gauge,accent:"#27C28A",trendLabel:"Minimal exertion",detail:"Below 30% max"},
{label:"Stress Index",value:"24",unit:"/100",icon:Brain,accent:"#27C28A",trendLabel:"Low stress",detail:"Well recovered"},
{label:"ST Segment",value:"+0.2",unit:"mV",icon:TrendingUp,accent:"#27C28A",trendLabel:"Normal range",detail:"No deviation"},
{label:"R-Peak Interval",value:"834",unit:"ms",icon:Zap,accent:"#5B8AF0",trendLabel:"Regular",detail:"Consistent timing"},
];

// If fall detected, inject alert card at top
if(v&&v.fall_detected){
cards.unshift({label:"⚠ FALL DETECTED",value:"SOS",unit:"",icon:AlertCircle,accent:"#E8304A",trendLabel:"Emergency triggered",detail:new Date(v.timestamp).toLocaleTimeString()});
}

return(
<div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
{cards.map((c)=>(
<div
key={c.label}
className="rounded-xl relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
style={{background:tk.cardBg,boxShadow:tk.shadow}}
>
<div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{background:c.accent}}/>
<div className="p-4">
<div className="flex items-center justify-between mb-2">
<span style={{color:tk.textSecondary,fontFamily:"Syne, sans-serif",fontSize:12}}>{c.label}</span>
<c.icon size={16} style={{color:c.accent}}/>
</div>
<div className="flex items-baseline gap-1">
<span style={{color:tk.textPrimary,fontFamily:"DM Mono, monospace",fontSize:28}}>{c.value}</span>
<span style={{color:tk.textSecondary,fontFamily:"DM Mono, monospace",fontSize:13}}>{c.unit}</span>
</div>
<div className="flex items-center gap-1.5 mt-2">
<div className="w-1.5 h-1.5 rounded-full" style={{background:c.accent}}/>
<span style={{color:c.accent,fontFamily:"DM Mono, monospace",fontSize:11}}>{c.trendLabel}</span>
</div>
<div style={{color:tk.textMuted,fontFamily:"DM Mono, monospace",fontSize:10,marginTop:4}}>{c.detail}</div>
</div>
</div>
))}
</div>
);
}