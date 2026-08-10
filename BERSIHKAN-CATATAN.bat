@echo off
rem BERSIHKAN-CATATAN.bat
rem Merapikan semua file catatan versi (CATATAN-v*.txt, CARA-PASANG-*.txt,
rem database.rules.json) ke dalam satu folder _CATATAN agar folder proyek
rem tidak penuh. Aman dijalankan berkali-kali.
cd /d "%~dp0"
if not exist "_CATATAN" mkdir "_CATATAN"
set n=0
for %%f in (CATATAN-v*.txt) do (
  if exist "%%f" (
    move /y "%%f" "_CATATAN\" >nul
    set /a n+=1
  )
)
for %%f in (CARA-PASANG-*.txt) do (
  if exist "%%f" (
    move /y "%%f" "_CATATAN\" >nul
    set /a n+=1
  )
)
if exist "database.rules.json" (
  move /y "database.rules.json" "_CATATAN\" >nul
  set /a n+=1
)
echo.
echo Selesai. %n% file catatan dipindah ke folder _CATATAN.
echo Folder proyek sekarang rapi. Jendela ini bisa ditutup.
echo.
pause
