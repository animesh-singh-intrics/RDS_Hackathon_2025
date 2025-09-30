@echo off
echo 🚀 Setting up React-Node.js Full-Stack Application...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

:: Get Node.js version
for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

:: Install root dependencies
echo 📦 Installing root dependencies...
npm install

:: Install client and server dependencies
echo 📦 Installing client and server dependencies...
npm run install:all

:: Copy environment files
echo 🔧 Setting up environment files...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file
) else (
    echo ⚠️  .env file already exists
)

if not exist client\.env (
    copy client\.env.example client\.env
    echo ✅ Created client\.env file
) else (
    echo ⚠️  client\.env file already exists
)

:: Build the project
echo 🏗️  Building the project...
npm run build

echo.
echo 🎉 Setup completed successfully!
echo.
echo 🚀 To start development:
echo    npm run dev
echo.
echo 📚 Don't forget to read the DEVELOPMENT_GUIDE.md before coding!
echo 🌐 Frontend will be available at: http://localhost:3000
echo 🔧 Backend will be available at: http://localhost:5000
echo 🏥 API Health check: http://localhost:5000/api/health

pause