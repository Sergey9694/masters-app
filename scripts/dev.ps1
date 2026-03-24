# scripts/dev.ps1
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Check Docker
Write-Host "--- Checking Docker ---" -ForegroundColor Cyan
docker info >$null 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    }
    else {
        Write-Host "ERROR: Docker Desktop not found. Please start it manually." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Waiting for Docker Engine to start..." -ForegroundColor Yellow
    $timeout = 60
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        docker info >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker is ready!" -ForegroundColor Green
            break
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $elapsed += 2
    }

    if ($elapsed -ge $timeout) {
        Write-Host "ERROR: Docker start timeout." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Docker is already running." -ForegroundColor Green
}

# 2. Start Database
Write-Host "--- Starting Database ---" -ForegroundColor Cyan
docker-compose up -d db

# Wait for 8 seconds to allow Postgres to initialize
Write-Host "Waiting for database initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 3. Prisma Push
Write-Host "--- Prisma Setup ---" -ForegroundColor Cyan
npx prisma db push

# 4. Seed Data
Write-Host "--- Seeding Data ---" -ForegroundColor Cyan
npx prisma db seed

# 5. Start Server
Write-Host "--- Starting Next.js Dev Server ---" -ForegroundColor Cyan
npx next dev
