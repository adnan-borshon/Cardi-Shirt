import { ShirtStatusBar } from "../components/ShirtStatusBar";
import { DailyCheckIn } from "../components/DailyCheckIn";
import { ECGCanvas } from "../components/ECGCanvas";
import { VitalsRow } from "../components/VitalsRow";
import { AISummaryCard } from "../components/AISummaryCard";
import { MapPanel } from "../components/MapPanel";
import { FamilyCircle } from "../components/FamilyCircle";
import { MedicationLog } from "../components/MedicationLog";

export function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[960px] mx-auto px-4 md:px-6 py-4 space-y-4">
        <ShirtStatusBar />
        <DailyCheckIn />
        <ECGCanvas />
        <VitalsRow />
        <AISummaryCard />
        <MapPanel />
        <FamilyCircle />
        <MedicationLog />
      </div>
    </div>
  );
}
