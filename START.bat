@echo off
echo 🚀 Iniciando TaskQuest Pro...
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não está instalado. Por favor, instale Node.js 18+ em https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js encontrado: %NODE_VERSION%
echo.

REM Verificar se .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado. Criando a partir de .env.example...
    copy .env.example .env
    echo 📝 Por favor, edite o arquivo .env com suas configurações de email
    echo.
)

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    call npm install
    echo.
)

REM Iniciar servidor
echo 🎮 Iniciando servidor...
call npm start
pause
