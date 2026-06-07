import {Sparkles,ArrowRight,Loader2} from "lucide-react";
import {useTokens} from "./ThemeContext";
import {useDailySummaries} from "./useBackend";

const FALLBACK_SUMMARY="Gathering enough data to generate your first AI summary. Please wait until the next summary cycle (08:00 or 20:00).";

function parseInlineStyles(text: string, tk: any) {
  if (!text) return "";
  const parts = text.split("**");
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return (
        <strong key={idx} style={{ color: tk.textPrimary, fontWeight: 700 }}>
          {part}
        </strong>
      );
    }
    return part;
  });
}

export function AISummaryCard(){
const tk=useTokens();
const{summaries,loading}=useDailySummaries();

const latest=summaries.length>0?summaries[0]:null;
const summary=latest&&latest.summary?latest.summary:FALLBACK_SUMMARY;
const time=latest?new Date(latest.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"Waiting for data...";
const isLive=!!latest?.summary;

return(
<div
className="rounded-xl p-5 relative overflow-hidden"
style={{background:tk.cardBg,border:`0.5px solid ${tk.cardBorder}`,boxShadow:tk.shadow}}
>
<div className="flex items-center gap-2 mb-3">
<Sparkles size={16} style={{color:tk.amber}}/>
<span style={{color:tk.amber,fontFamily:"Syne, sans-serif",fontSize:12}}>
{loading?"Loading AI Summary...":"Today's AI Summary"}
</span>
<span style={{color:tk.textMuted,fontFamily:"DM Mono, monospace",fontSize:10,marginLeft:"auto"}}>{time}</span>
</div>
{loading?(
<div className="flex items-center gap-2 py-4">
<Loader2 size={16} className="animate-spin" style={{color:tk.textMuted}}/>
<span style={{color:tk.textMuted,fontFamily:"Syne, sans-serif",fontSize:13}}>Fetching AI analysis...</span>
</div>
):(
<p style={{color:tk.textPrimary,fontFamily:"'DM Serif Display', serif",fontSize:15,lineHeight:1.65}}>
{parseInlineStyles(summary, tk)}
</p>
)}
<div className="flex items-center justify-between mt-4 flex-wrap gap-2">
<div className="flex items-center gap-2">
<div className="px-2 py-0.5 rounded-full" style={{background:"rgba(232,48,74,0.1)",fontFamily:"DM Mono, monospace",fontSize:10,color:"#E8304A"}}>
{isLive?"Gemini AI":"CardiShirt AI v2.1"}
</div>
<div className="px-2 py-0.5 rounded-full" style={{background:"rgba(39,194,138,0.1)",fontFamily:"DM Mono, monospace",fontSize:10,color:"#27C28A"}}>
{isLive?"Live analysis":"96% confidence"}
</div>
</div>
<button className="flex items-center gap-1 hover:gap-2 transition-all" style={{color:tk.textSecondary,fontFamily:"Syne, sans-serif",fontSize:12}}>
See full diary entry <ArrowRight size={14}/>
</button>
</div>
</div>
);
}