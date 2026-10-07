@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   GHAR TAK SERVICE (GTS) - ANDROID APK BUILD RUNNER
echo ========================================================
echo.

:: 1. Search for Java / Android Studio JBR if JAVA_HOME is not set
if not defined JAVA_HOME (
    if exist "%LOCALAPPDATA%\Android\Android Studio\jbr\bin\java.exe" (
        set "JAVA_HOME=%LOCALAPPDATA%\Android\Android Studio\jbr"
        echo [INFO] Detected Android Studio JBR: !JAVA_HOME!
    ) else if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
        echo [INFO] Detected Android Studio JBR: !JAVA_HOME!
    ) else if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-17"
        echo [INFO] Detected JDK 17: !JAVA_HOME!
    )
)

if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo [OK] Using JAVA_HOME: %JAVA_HOME%
) else (
    echo [WARNING] JAVA_HOME is not set. Assuming 'java' is available in system PATH.
)

echo.
echo [1/3] Cleaning previous builds...
call "%~dp0gradlew.bat" clean --no-daemon

echo.
echo [2/3] Building Customer App APK (Sapphire Blue #0D47A1)...
call "%~dp0gradlew.bat" :customer-app:assembleDebug --no-daemon
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to compile customer-app!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Building Field Technician App APK (Flame Orange #E65100)...
call "%~dp0gradlew.bat" :technician-app:assembleDebug --no-daemon
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to compile technician-app!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo   SUCCESS! BOTH NATIVE ANDROID APKS ASSEMBLED:
echo ========================================================
echo Customer APK:
echo   %~dp0customer-app\build\outputs\apk\debug\customer-app-debug.apk
echo.
echo Technician APK:
echo   %~dp0technician-app\build\outputs\apk\debug\technician-app-debug.apk
echo ========================================================
echo.
pause
