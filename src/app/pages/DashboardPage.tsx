import {ShirtStatusBar} from "../components/ShirtStatusBar";
import {DailyCheckIn} from "../components/DailyCheckIn";
import {ECGCanvas} from "../components/ECGCanvas";
import {VitalsRow} from "../components/VitalsRow";
import {AISummaryCard} from "../components/AISummaryCard";

import {MapPanel} from "../components/MapPanel";
import {FamilyCircle} from "../components/FamilyCircle";
import {useLiveVitals} from "../components/useBackend";
import {AlertTriangle,X} from "lucide-react";

export function DashboardPage(){
const{sos,dismissSos}=useLiveVitals();
return(
<div className="h-full overflow-y-auto">
<div className="max-w-[960px] mx-auto px-4 md:px-6 py-4 space-y-4">
{/* SOS Banner */}
{sos&&(
<div className="rounded-xl p-4 flex items-center gap-3 animate-pulse" style={{background:"rgba(232,48,74,0.15)",border:"1.5px solid #E8304A"}}>
<AlertTriangle size={24} style={{color:"#E8304A",flexShrink:0}}/>
<div className="flex-1">
<div style={{fontFamily:"Syne, sans-serif",fontSize:15,fontWeight:600,color:"#E8304A"}}>🚨 EMERGENCY: {sos.reason}</div>
<div style={{fontFamily:"DM Mono, monospace",fontSize:12,color:"#E8304A",opacity:0.8}}>BPM: {sos.bpm} | Temp: {sos.temp}°C | {new Date(sos.timestamp).toLocaleTimeString()}</div>
</div>
<button onClick={dismissSos}><X size={18} style={{color:"#E8304A"}}/></button>
</div>
)}
<ShirtStatusBar/>
<DailyCheckIn/>
<AISummaryCard/>
<ECGCanvas/>
<VitalsRow/>

<MapPanel/>
<FamilyCircle/>
</div>
</div>
);
}
