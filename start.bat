@echo off
echo Starting Brain Stroke Prediction System...
echo.

start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && python app.py"

timeout /t 5 /nobreak > nul

start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
pause > nul
