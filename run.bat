@echo off
echo Starting CardiShirt System...

echo Starting Python DSP Microservice in a new window...
start "CardiShirt Python DSP" cmd /k "cd backend && python dsp_service.py"

echo Starting Node.js Backend Server in a new window...
start "CardiShirt Node Server" cmd /k "cd backend && node server.js"

echo Starting Vite Frontend in a new window...
start "CardiShirt Vite Frontend" cmd /k "npm run dev"

echo All processes launched. You can close this window.
pause
