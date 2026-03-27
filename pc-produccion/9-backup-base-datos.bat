@echo off
setlocal enabledelayedexpansion
title TrazaSole - Backup Base de Datos
cd /d "%~dp0.."

echo ========================================
echo   TRAZASOLE - Backup Base de Datos
echo ========================================
echo.

if not exist "backups\database" mkdir "backups\database"

REM Obtener version
for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json') do (
    set VERSION=%%a
    set VERSION=!VERSION:"=!
)

REM Obtener fecha y hora
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set DT=%%a
set TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%
set BACKUP_NAME=db_v%VERSION%_%TIMESTAMP%

echo [INFO] Version: %VERSION%
echo.

if exist "prisma\dev.db" (
    echo [INFO] Base de datos: SQLite
    copy "prisma\dev.db" "backups\database\%BACKUP_NAME%.db" >nul
    echo [OK] Backup: backups\database\%BACKUP_NAME%.db
) else if exist ".env" (
    echo [INFO] Base de datos: PostgreSQL
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="DATABASE_URL" set DB_URL=%%b
    )
    pg_dump "%DB_URL%" > "backups\database\%BACKUP_NAME%.sql" 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Verifique pg_dump en PATH
        pause
        exit /b 1
    )
    echo [OK] Backup: backups\database\%BACKUP_NAME%.sql
) else (
    echo [ERROR] No se detecto base de datos
    pause
    exit /b 1
)

echo.
echo [INFO] Limpiando backups antiguos...
set COUNT=0
for /f "delims=" %%f in ('dir /b /o-d "backups\database\*" 2^>nul') do (
    set /a COUNT+=1
    if !COUNT! gtr 50 (
        del "backups\database\%%f" 2>nul
        echo [ELIMINADO] %%f
    )
)

echo.
echo Backup completado.
echo.
pause
