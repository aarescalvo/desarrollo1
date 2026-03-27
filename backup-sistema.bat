@echo off
chcp 65001 >nul
title TrazaSole - Backup de Base de Datos PostgreSQL
color 0B

:: Configuración
set "INSTALL_DIR=C:\TrazaSole"
set "BACKUP_DIR=C:\TrazaSole\backups"
set "MAX_BACKUPS=50"

echo.
echo ════════════════════════════════════════════════════════════════
echo   TRAZASOLE - Backup de Base de Datos PostgreSQL
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%INSTALL_DIR%"

REM Crear carpeta de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Obtener fecha y hora para el nombre del backup
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set FECHA=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%
set HORA=%datetime:~8,2%-%datetime:~10,2%
set VERSION=v3.4.1

REM Nombre del archivo de backup
set BACKUP_FILE=%BACKUP_DIR%\backup_%FECHA%_%HORA%_%VERSION%.sql

echo [1/3] Creando backup de PostgreSQL...
echo        Archivo: %BACKUP_FILE%
echo.

REM Crear backup usando pg_dump (PostgreSQL)
set PGPASSWORD=1810
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h localhost -d trazasole -F p -f "%BACKUP_FILE%" 2>nul

if %ERRORLEVEL% equ 0 (
    echo [OK] Backup creado exitosamente!
    echo.
    echo ========================================
    echo   Backup guardado en:
    echo   %BACKUP_FILE%
    echo ========================================
) else (
    echo [ERROR] No se pudo crear el backup
    echo.
    echo Verifica que PostgreSQL este corriendo y las credenciales sean correctas.
    pause
    exit /b 1
)

:: Limpiar backups antiguos (mantener últimos 50)
echo.
echo [2/3] Limpiando backups antiguos (manteniendo últimos %MAX_BACKUPS%)...

set BACKUP_COUNT=0
for /f %%i in ('dir "%BACKUP_DIR%\*.sql" /b 2^>nul ^| find /c /v ""') do set BACKUP_COUNT=%%i

if %BACKUP_COUNT% gtr %MAX_BACKUPS% (
    set /a EXCESS=%BACKUP_COUNT%-%MAX_BACKUPS%
    echo [INFO] Hay %BACKUP_COUNT% backups, eliminando %EXCESS% más antiguos...

    dir "%BACKUP_DIR%\*.sql" /o:d /b > "%TEMP%\backups_list.txt"

    setlocal enabledelayedexpansion
    set COUNT=0
    for /f "usebackq delims=" %%f in ("%TEMP%\backups_list.txt") do (
        set /a COUNT+=1
        if !COUNT! leq %EXCESS% (
            del "%BACKUP_DIR%\%%f" 2>nul
            echo [ELIMINADO] %%f
        )
    )
    endlocal
    del "%TEMP%\backups_list.txt" 2>nul
) else (
    echo [OK] Hay %BACKUP_COUNT% backups, no es necesario limpiar
)

echo.
echo [3/3] Resumen de backups disponibles:
echo ════════════════════════════════════════════════════════════════
dir "%BACKUP_DIR%\*.sql" /o-d /b 2>nul | findstr /n "." | findstr "^[1-5]:"
echo ...
echo.
for /f %%i in ('dir "%BACKUP_DIR%\*.sql" /b 2^>nul ^| find /c /v ""') do echo Total: %%i backups en disco
echo ════════════════════════════════════════════════════════════════
echo.
echo [OK] Backup completado exitosamente!
echo.
pause
