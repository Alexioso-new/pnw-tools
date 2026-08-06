@echo off
chcp 65001 >nul
title HOSANA YOUTH TOOLS - Server Lokal
cd /d "%~dp0"

echo.
echo   ============================================
echo    HOSANA YOUTH TOOLS - SERVER LOKAL
echo   ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   ! Node.js belum terpasang di laptop ini.
  echo.
  echo     Unduh dulu di https://nodejs.org  ^(pilih versi LTS^),
  echo     pasang, lalu jalankan berkas ini lagi.
  echo.
  pause
  exit /b 1
)

if not exist "pnw-server.js" (
  echo   ! Berkas pnw-server.js tidak ada di folder ini.
  echo     Pastikan berkas .bat ini berada di dalam folder C:\pnw-tools
  echo.
  pause
  exit /b 1
)

echo   Menyalakan server...
echo   Biarkan jendela ini TERBUKA selama ibadah berlangsung.
echo.

node pnw-server.js %1

echo.
echo   Server berhenti.
pause
