# SURGE - Local Demo Runner
# Launches FastAPI Backend (Port 8000) and React Vite Frontend (Port 5173)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SURGE: Predictive Catastrophe Operations Intelligence  " -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "==========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

# 1. Check Python and dependencies
Write-Host "[1/3] Checking Backend Python Environment..." -ForegroundColor Yellow
$env:PYTHONPATH = $backendDir

# Seed database if not yet seeded
py -c "
import sys
sys.path.insert(0, r'$backendDir')
from app.db.seed import seed_database
seed_database()
print('Database verified.')
"

# 2. Start FastAPI Backend in background job
Write-Host "[2/3] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($bDir)
    Set-Location $bDir
    $env:PYTHONPATH = $bDir
    py -m uvicorn app.main:app --host 127.0.0.1 --port 8000
} -ArgumentList $backendDir

Start-Sleep -Seconds 3

# Test backend health
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5
    Write-Host "Backend is ONLINE: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "Backend is initializing..." -ForegroundColor DarkYellow
}

# 3. Start Frontend
Write-Host "[3/3] Launching React Control Tower on http://localhost:5173..." -ForegroundColor Yellow
Write-Host ""
Write-Host "-> Dashboard URL: http://localhost:5173" -ForegroundColor Green
Write-Host "-> Interactive API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the development servers." -ForegroundColor Gray

Set-Location $frontendDir
npm run dev

# Cleanup when user stops frontend
Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue
