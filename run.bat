@echo off

start "Backend" cmd /c "npm run dev:backend"
start "Frontend" cmd /c "npm run dev:frontend"

exit