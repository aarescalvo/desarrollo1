@echo off
setlocal enabledelayedexpansion
title TrazaSole - Backup Sistema
cd /d "%~dp0.."

echo ========================================
echo   TRAZASOLE - Backup del Sistema
echo ========================================
echo.

if not exist "backups\sistema" mkdir "backups\sistema"

REM Obtener version
for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json') do (
    set VERSION=%%a
    set VERSION=!VERSION:"=!
)

REM Obtener fecha y hora
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set DT=%%a
set TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%
set BACKUP_NAME=trazasole_v%VERSION%_%TIMESTAMP%

echo [INFO] Version: %VERSION%
echo [INFO] Creando backup: %BACKUP_NAME%.zip
echo.

powershell -Command "& { ^
    $items = Get-ChildItem -Path '.' -Exclude 'backups','node_modules','.next','.git','servidor.log' | ForEach-Object { $_.FullName }; ^
    Compress-Archive -Path $items -DestinationPath 'backups\sistema\%BACKUP_NAME%.zip' -Force; ^
}"

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo crear el backup
    pause
    exit /b 1
)

echo [OK] Backup creado: backups\sistema\%BACKUP_NAME%.zip
echo.

REM Mantener ultimos 50
echo [INFO] Limpiando backups antiguos...
set COUNT=0
for /f "delims=" %%f in ('dir /b /o-d "backups\sistema\*.zip" 2^>nul') do (
    set /a COUNT+=1
    if !COUNT! gtr 50 (
        del "backups\sistema\%%f" 2>nul
        echo [ELIMINADO] %%f
    )
)

echo.
echo Backup completado.
echo.
pause
