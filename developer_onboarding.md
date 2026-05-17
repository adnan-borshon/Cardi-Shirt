# CardiShirt Developer Onboarding & Architecture Summary

Welcome to the **CardiShirt** project! This document outlines the system architecture, recent backend and frontend integrations, and the core data workflows. It is designed to help new developers understand how the hardware, backend, and frontend communicate.

---

## 🏗 System Architecture Overview

The CardiShirt system is composed of three main layers:

1. **Hardware (ESP32 Wearable)**
   - Collects high-frequency biometric data (ECG, MAX30102 for Red/IR, MPU6050 for falls, DS18B20 for temp).
   - Sends batched data payloads to the backend every 2 seconds.
2. **Backend (Node.js + Express + SQLite)**
   - Receives batched data and performs custom JavaScript signal processing (calculating BPM and SpO2).
   - Manages a **3-Tier Event-Driven AI Architecture** to conserve API quotas and optimize performance.
   - Throttles database writes to prevent bloat while pushing real-time updates to the frontend via WebSockets.
3. **Frontend (React + Vite + Tailwind v4 + Recharts)**
   - A rich, highly interactive dashboard for patients and doctors.
   - Consumes real-time WebSockets for live charts and interfaces with REST APIs for historical data and AI chatbot interactions.

---

## 🔄 Core Workflows

### 1. Data Ingestion & Signal Processing Workflow
Instead of relying on heavy Python scripts, the backend performs signal processing natively:
- **Endpoint**: `POST /api/esp32/data`
- **Process**: 
  1. The ESP32 sends arrays of `ecg`, `ir`, and `red` values.
  2. The backend uses `calculateBPM` (local maxima peak detection) and `calculateSpO2` (AC/DC ratio estimation) in `signalProcessing.js`.
  3. The processed `bpm` and `spo2` metrics are immediately broadcasted to the React frontend via **Socket.io**.
  4. **Throttling**: To save disk I/O, the backend only executes a SQLite `INSERT` into the `realtime_vitals` table once every **60 seconds**.

### 2. Event-Driven AI & Emergency Workflow
To ensure cost-effectiveness, the Gemini AI and Twilio APIs are only triggered under specific conditions:
- **Anomaly Trigger (Emergency SOS)**: If the backend detects `fall_detected === true`, `bpm > 120`, or `bpm < 50`, it immediately fires a Twilio SMS to the emergency contact and sends the ECG array to Gemini for clinical analysis.
- **Scheduled Trigger (Cron Jobs)**: Twice daily (at 08:00 and 20:00), a `node-cron` job fetches the last 12 hours of vitals, calculates averages, and asks Gemini to write a human-readable health narrative. This is saved to the `daily_summaries` table.
- **On-Demand Trigger (Chatbot)**: When a user queries the AI via `POST /api/chat`, the backend fetches the 5 most recent live vitals to give the AI immediate medical context before responding.

### 3. Frontend Persistence & Interactivity
- **State Management**: Important user states (like toggle settings, alert thresholds, and checked medications) are persisted using custom `useLocalStorage` hooks. This ensures data isn't lost during page navigation.
- **AI Chat Integration**: The `AIChat.tsx` component connects directly to the backend chatbot API. It sends the user's message, and the backend injects the live vital context before talking to Gemini.

---

## 📂 Key Files & Directory Structure

- `backend/server.js`: The heart of the backend. Contains Express routing, WebSocket initialization, Twilio integration, Gemini setup, and the Cron jobs.
- `backend/db.js`: Configures the SQLite database using `sql.js` (an in-memory database that periodically flushes to `cardishirt.db` on disk to avoid native compilation issues).
- `backend/signalProcessing.js`: Contains the compact, zero-dependency math functions for extracting BPM and SpO2 from raw arrays.
- `src/app/components/AIChat.tsx`: The frontend React component that interfaces with the backend's `/api/chat` endpoint.
- `src/app/components/SettingsScreen.tsx`: Contains the user preferences, fully wired up with `localStorage` persistence.

---

## 🚀 Getting Started for New Developers

1. **Environment Variables**: 
   Ensure your `backend/.env` file contains the required keys:
   ```env
   PORT=4000
   GEMINI_API_KEY=your_gemini_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_FROM=+1234567890
   EMERGENCY_PHONE_TO=+0987654321
   ```
2. **Running the Backend**:
   Navigate to the `backend` folder and run:
   ```bash
   node server.js
   ```
   You should see logs indicating that SQLite, Gemini, and Twilio are all initialized and ready.

3. **Running the Frontend**:
   Navigate to the root directory and run the Vite dev server:
   ```bash
   npm run dev
   ```

4. **Testing the AI Locally**:
   You can easily test the chatbot without the frontend by running a simple curl or PowerShell command against the running backend:
   ```powershell
   $body='{"userMessage":"Is my heart rate normal?"}'; Invoke-RestMethod -Uri http://localhost:4000/api/chat -Method POST -Body $body -ContentType "application/json"
   ```

> [!TIP]
> **Code Style Note**: The original architect of this project explicitly requested that all backend logic (especially math and signal processing) be written compactly without extra spaces or line breaks (e.g., `if(a>b)return c;`). Please respect this stylistic choice when editing core backend files.
