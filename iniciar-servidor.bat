@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   TrazaSole v3.7.12 - Iniciando...
echo ========================================
echo.

cd /d C:\TrazaSole

echo Actualizando repositorio...
git fetch origin
git reset --hard origin/master

echo.
echo Limpiando cache...
if exist .next rd /s /q .next

echo.
echo Iniciando servidor (Webpack - sin Turbopack)...
set TURBOPACK=0
set NEXT_NO_TURBOPACK=1

bun run dev

pause
