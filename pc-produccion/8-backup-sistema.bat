@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title TrazaSole - Backup Sistema Completo
color 0B

:: Configuración
set "INSTALL_DIR=%~dp0.."
set "BACKUP_DIR=%INSTALL_DIR%\backups\sistema"
set "MAX_BACKUPS=50"

echo.
echo ════════════════════════════════════════════════════════════════
echo   TRAZASOLE - Backup del Sistema Completo
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%INSTALL_DIR%"

:: Crear carpeta de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Obtener versión del package.json
set VERSION=unknown
if exist "package.json" (
    for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json 2^>nul') do (
        set VERSION=%%a
        set VERSION=!VERSION:"=!
    )
)

:: Obtener fecha y hora
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value 2^>nul') do set DT=%%a
set FECHA=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%
set HORA=%DT:~8,2%-%DT:~10,2%-%DT:~12,2%
set TIMESTAMP=%FECHA%_%HORA%

:: Nombre del backup
set BACKUP_NAME=trazasole_v%VERSION%_%TIMESTAMP%
set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_NAME%.zip

echo [INFO] Version del sistema: %VERSION%
echo [INFO] Fecha: %FECHA% - Hora: %HORA%
echo.
echo [1/3] Creando backup del sistema...
echo        Archivo: %BACKUP_NAME%.zip
echo.

:: Crear backup excluyendo carpetas pesadas
powershell -Command "& { ^
    $exclude = @('backups', 'node_modules', '.next', '.git', 'servidor.log', '*.log', 'mini-services'); ^
    $items = Get-ChildItem -Path '.' | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object { $_.FullName }; ^
    if ($items.Count -gt 0) { ^
        Compress-Archive -Path $items -DestinationPath '%BACKUP_FILE%' -Force; ^
        exit 0; ^
    } else { ^
        exit 1; ^
    } ^
}"

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo crear el backup
    pause
    exit /b 1
)

echo [OK] Backup creado exitosamente!
echo.

:: Limpiar backups antiguos (mantener últimos 50)
echo [2/3] Limpiando backups antiguos (manteniendo últimos %MAX_BACKUPS%)...

set BACKUP_COUNT=0
for /f %%i in ('dir "%BACKUP_DIR%\*.zip" /b 2^>nul ^| find /c /v ""') do set BACKUP_COUNT=%%i

if %BACKUP_COUNT% gtr %MAX_BACKUPS% (
    set /a EXCESS=%BACKUP_COUNT%-%MAX_BACKUPS%
    echo [INFO] Hay %BACKUP_COUNT% backups, eliminando %EXCESS% más antiguos...
    
    dir "%BACKUP_DIR%\*.zip" /o:d /b > "%TEMP%\backups_sistema_list.txt"
    
    set COUNT=0
    for /f "usebackq delims=" %%f in ("%TEMP%\backups_sistema_list.txt") do (
        set /a COUNT+=1
        if !COUNT! leq %EXCESS% (
            del "%BACKUP_DIR%\%%f" 2>nul
            echo [ELIMINADO] %%f
        )
    )
    del "%TEMP%\backups_sistema_list.txt" 2>nul
) else (
    echo [OK] Hay %BACKUP_COUNT% backups, no es necesario limpiar
)

:: Resumen
echo.
echo [3/3] Resumen de backups disponibles:
echo ════════════════════════════════════════════════════════════════
dir "%BACKUP_DIR%\*.zip" /o-d /b 2>nul | findstr /n "." | findstr "^[1-5]:"
echo ...
for /f %%i in ('dir "%BACKUP_DIR%\*.zip" /b 2^>nul ^| find /c /v ""') do echo Total: %%i backups en disco
echo ════════════════════════════════════════════════════════════════
echo.
echo [OK] Backup del sistema completado!
echo.
pause
