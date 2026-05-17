import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ECGRecordsPage } from "./pages/ECGRecordsPage";
import { CardiacDiaryPage } from "./pages/CardiacDiaryPage";
import { RiskTrendsPage } from "./pages/RiskTrendsPage";
import { FamilyCirclePage } from "./pages/FamilyCirclePage";
import { SettingsPage } from "./pages/SettingsPage";
import LandingPage from "./components/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/landing",
    Component: LandingPage,
  },
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "ecg-records", Component: ECGRecordsPage },
      { path: "cardiac-diary", Component: CardiacDiaryPage },
      { path: "risk", Component: RiskTrendsPage },
      { path: "family", Component: FamilyCirclePage },
      { path: "settings", Component: SettingsPage },
      { path: "*", Component: DashboardPage },
    ],
  },
]);
