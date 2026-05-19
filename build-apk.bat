@echo off
echo ===================================
echo   TIERRAPI - BUILD APK
echo ===================================
echo.

echo [1/3] Ejecutando npm run build...
call npm run build
if errorlevel 1 (
    echo Error en npm run build
    pause
    exit /b 1
)

echo.
echo [2/3] Sincronizando con Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo Error en npx cap sync
    pause
    exit /b 1
)

echo.
echo [3/3] Abriendo Android Studio...
call npx cap open android

echo.
echo ===================================
echo   Proceso completado!
echo   En Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
echo ===================================
pause
