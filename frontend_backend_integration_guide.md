# CardiShirt - Project Documentation & Backend Integration Guide

This document outlines the frontend architecture, features, and the necessary data models required for connecting the CardiShirt React application to a database and backend in the future. It is based on a comprehensive review of the `src` and `guideline` folders.

## 1. Tech Stack & Frontend Architecture
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS v4, Vanilla CSS (`theme.css`, `index.css`), Dark/Light mode support via custom `ThemeContext`.
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Data Visualization:** Recharts (Line, Bar, Area, Pie charts)
- **UI Primitives:** Radix UI (Dialogs, Tabs, Select, etc.)
- **Maps:** Leaflet / React-Leaflet
- **Animations:** Framer Motion (`motion`)
- **Internationalization (i18n):** Multi-language support integrated directly in components (English `en` and Bengali `bn`), including Bengali numeral conversion.

## 2. App Structure & Routing (`routes.tsx`)
- `/landing`: Marketing / Landing page.
- `/` (Dashboard): Main overview and real-time live status.
- `/ecg-records`: Historical ECG data viewer with playback and AI analysis.
- `/cardiac-diary`: Calendar view for daily health scores, medications, and hourly HR tracking.
- `/risk`: Long-term trends (7d/30d/90d/1y) and risk factor analysis.
- `/family`: Caregiver access control, emergency contacts, and dispatch simulation.
- `/settings`: User preferences and app settings.

---

## 3. Core Features & Required Backend Data Models

To make this frontend fully dynamic, the backend must support the following entities and data structures (currently mocked in the UI).

### 3.1. Real-Time Vitals (Dashboard)
The dashboard (`DashboardPage.tsx`, `VitalsRow.tsx`) requires a WebSocket or frequent polling endpoint to supply real-time or near-real-time data from the shirt.
**Required Fields:**
- `heart_rate` (BPM)
- `hrv` (ms)
- `breathing_rate` (BPM)
- `t_wave_status` (e.g., "Normal", "Inverted")
- `st_segment` (mV)
- `strain_level` (%, e.g., "Low")
- `stress_index` (0-100)
- `r_peak_interval` (ms)
- `ai_health_score` (0-100)
- Device Status: `battery_level`, `connection_status`, `lead_status`.

### 3.2. ECG Sessions (`ECGRecordsScreen.tsx`)
Stores recorded ECG data. Supports different leads (I, II, III).
**Required Fields:**
- `session_id`, `patient_id`
- `timestamp`, `dateGroup`, `duration`
- `type`: `continuous` | `manual` | `alert` | `doctor`
- `hr_range`: (e.g., "68–94 BPM")
- `ai_status`: `normal` | `anomaly` | `alert`
- `ai_summary_text`: Generative AI summary of the session.
- `waveform_data`: High-frequency arrays of voltage points for drawing the canvas ECG (Lead I, II, III).
- `detected_events`: Array of objects containing:
  - `time`, `type` (e.g., "Irregular rhythm"), `duration`, `confidence` (1-5), `description`, `is_alert` (boolean).
- `doctor_note` & `patient_note`.
- `shared_status` (boolean).

### 3.3. Cardiac Diary (`CardiacDiaryScreen.tsx`)
A calendar-based log of the patient's daily activity, health score, and medication compliance.
**Required Fields:**
- **Monthly Summary / Daily Stats:**
  - `date`
  - `wearing_status`: `full` | `partial` | `none`
  - `wear_hours`, `wear_minutes`
  - `daily_score` (0-100)
  - Booleans: `has_alert`, `has_symptom`
- **Detailed Daily View:**
  - `hourly_hr_data`: Array of 24 items mapping hour to avg HR (`{ hour: "08:00", hr: 72, worn: true }`).
  - `hrv_rmssd` (ms) & Poincaré plot data points.
  - `events_timeline`: Array of mixed events (device connected, medications logged, cardiac alerts, patient symptoms).
  - `ai_daily_narrative`: Text summary of the day.

### 3.4. Medication Log
Tied to the Cardiac Diary, tracking daily adherence.
**Required Fields:**
- `medication_id`
- `name` (e.g., "Metoprolol")
- `dosage` (e.g., "25mg")
- `scheduled_time`
- `compliance_slots`: Boolean flags for `{ morning, noon, evening }`.

### 3.5. Risk Trends & Analysis (`RiskTrendsScreen.tsx`)
Aggregates long-term data for risk assessment.
**Required Fields:**
- `current_risk_score` (0-100)
- `trend_data`: Time-series arrays (7d, 30d, 90d, 1y) for Health Score, HR, HRV, and Rhythm Stability.
- `risk_factors`: Array of variables affecting the score:
  - `name` (e.g., "Resting Heart Rate")
  - `contribution` (integer, e.g., +6 or -4)
  - `status`: `positive` | `negative` | `neutral`
  - `description` & `detailed_analysis`
  - `sparkline_data`: Array of recent values for mini-charts.
- `alert_history`: Log of past anomalies/alerts.

### 3.6. Family Circle & Emergency Dispatch (`FamilyCircleScreen.tsx`)
Manages secondary users (caregivers/family) and automated emergency responses.
**Required Fields:**
- **Family Member Profile:**
  - `member_id`, `name`, `relationship`, `phone`, `email`
  - `status`: `active` | `recent` | `inactive` | `pending`
  - `notification_level`: `all` | `critical` | `daily` | `off`
  - `is_emergency_contact` (boolean), `emergency_priority` (integer)
  - `permissions`: JSON object `{ ecg: bool, diary: bool, alerts: bool, dashboard: bool }`
- **Emergency Integration:**
  - The frontend has an `AlertSimulationModal` with a countdown to dispatch. The backend will need endpoints to:
    - Trigger SMS/Calls to emergency contacts.
    - Interface with external ambulance dispatch APIs.
    - Broadcast live location tracking updates during an active emergency.

---



