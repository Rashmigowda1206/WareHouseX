@echo off
title WareHouseX - Intelligent Warehouse Management & Linux Server Admin
echo ==============================================================================
echo WAREHOUSEX: Intelligent E-Commerce Warehouse Management & Linux Server Administration
echo TAGLINE: Secure. Automate. Monitor. Recover.
echo ==============================================================================
echo.

echo [1/3] Starting WareHouseX Flask REST Backend on port 5000...
start "WareHouseX Backend" cmd /k "cd backend && python app.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting WareHouseX Vite React Frontend on port 5173...
start "WareHouseX Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Launching web interface...
start http://localhost:5173

echo.
echo WareHouseX is active!
echo Backend:  http://127.0.0.1:5000/api/health
echo Frontend: http://localhost:5173
echo.
echo Default Logins:
echo   Administrator: admin / admin123
echo   Warehouse Mgr: manager / manager123
echo   Staff Member:  staff / staff123
echo ==============================================================================
pause
