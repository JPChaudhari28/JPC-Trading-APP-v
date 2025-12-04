@echo off
REM =====================================================
REM JPC Trading App - Auto Setup & Start Dev Server
REM Automatically installs missing packages
REM =====================================================

echo.
echo ================================
echo Checking Node.js version...
echo ================================

for /f "tokens=2 delims=v " %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=1,2 delims=." %%a in ("%NODE_VER%") do (
    set NODE_MAJOR=%%a
    set NODE_MINOR=%%b
)

if %NODE_MAJOR% LSS 18 (
    echo.
    echo WARNING: Node.js version is %NODE_VER%.
    echo This project requires Node.js >= 18.
    pause
    exit /b 1
)

echo Node.js version %NODE_VER% is OK.
echo.

echo ================================
echo Cleaning old node_modules and lock file...
echo ================================
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo.
echo ================================
echo Installing core dependencies...
echo ================================
npm install axios bcryptjs cookie-parser cors dotenv express kiteconnect mongoose morgan socket.io razorpay jsonwebtoken

echo.
echo Installing devDependencies...
echo ================================
npm install --save-dev eslint nodemon ts-node typescript

echo.
echo ================================
echo Reading PORT from .env file...
echo ================================
set PORT=4000
if exist .env (
    for /f "tokens=1,2 delims==" %%a in ('findstr /r "^PORT=" .env') do set PORT=%%b
)
echo Using PORT=%PORT%
echo.

:START_SERVER
echo ================================
echo Starting development server...
echo ================================
echo Server URL: http://localhost:%PORT%
echo.

set "NODE_ENV=development"

:RESTART
node src/app.js 2> temp_error.log
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================
    echo Checking for missing packages...
    echo ================================
    for /f "tokens=*" %%p in (temp_error.log) do (
        echo %%p | findstr /i "ERR_MODULE_NOT_FOUND" >nul
        if not errorlevel 1 (
            for /f "tokens=6 delims=''" %%m in ("%%p") do (
                set "PKG=%%m"
                echo Installing missing package: !PKG!
                npm install !PKG!
            )
        )
    )
    echo Restarting server...
    goto RESTART
)
del temp_error.log
pause
