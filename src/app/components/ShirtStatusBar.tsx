import {Wifi,WifiOff,Battery,Clock,Radio} from "lucide-react";
import {useTokens} from "./ThemeContext";
import {useLiveVitals} from "./useBackend";

export function ShirtStatusBar(){
const tk=useTokens();
const{connected,vitals}=useLiveVitals();
const synced=vitals?`Synced ${Math.round((Date.now()-new Date(vitals.timestamp).getTime())/1000)}s ago`:"Waiting for data...";

return(
<div
className="flex flex-wrap items-center gap-4 md:gap-6 px-4 py-2.5 rounded-xl mb-4 sticky top-0 z-10"
style={{background:tk.cardBg,borderBottom:`0.5px solid ${tk.cardBorder}`,boxShadow:tk.shadow}}
>
<div className="flex items-center gap-2">
<div className="relative">
{connected?<Wifi size={14} style={{color:tk.green}}/>:<WifiOff size={14} style={{color:"#E8304A"}}/>}
{connected&&<div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#27C28A] animate-pulse"/>}
</div>
<span style={{color:connected?tk.green:"#E8304A",fontFamily:"DM Mono, monospace",fontSize:12}}>{connected?"Connected":"Disconnected"}</span>
</div>
<div className="flex items-center gap-2">
<Radio size={14} style={{color:tk.textSecondary}}/>
<span style={{color:tk.textPrimary,fontFamily:"DM Mono, monospace",fontSize:12}}>3/3 leads active</span>
</div>
<div className="flex items-center gap-2">
<Battery size={14} style={{color:tk.textSecondary}}/>
<span style={{color:tk.textPrimary,fontFamily:"DM Mono, monospace",fontSize:12}}>72%</span>
</div>
<div className="flex items-center gap-2 ml-auto">
<Clock size={14} style={{color:tk.textMuted}}/>
<span style={{color:tk.textMuted,fontFamily:"DM Mono, monospace",fontSize:11}}>{synced}</span>
</div>
</div>
);
}