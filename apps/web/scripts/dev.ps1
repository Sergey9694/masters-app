$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 0. Cleanup old processes (only on specific ports to avoid killing self)
Write-Host "--- Cleaning up old processes on ports 3000, 4040 ---" -ForegroundColor Cyan
$ports = @(3000, 4040, 6379)
foreach ($port in $ports) {
    $processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}
Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue

# 1. Check Docker
Write-Host "--- Checking Docker ---" -ForegroundColor Cyan
docker info >$null 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    } else {
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
} else {
    Write-Host "Docker is already running." -ForegroundColor Green
}

# 2. Start Database & Redis
Write-Host "--- Starting Database & Redis ---" -ForegroundColor Cyan
docker-compose up -d db redis

Write-Host "Waiting for Postgres engine to be fully ready..." -ForegroundColor Yellow
$dbTimeout = 60
$dbElapsed = 0
$isReady = $false
while ($dbElapsed -lt $dbTimeout) {
    # Check if postgres is ready inside the container
    docker exec uslugi_db pg_isready -U admin -d uslugi_db >$null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Postgres is ready!" -ForegroundColor Green
        $isReady = $true
        break
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $dbElapsed += 2
}

if (-not $isReady) {
    Write-Host "ERROR: Postgres did not become ready within $dbTimeout seconds." -ForegroundColor Red
    exit 1
}

# 3. Prisma Setup & PostGIS
Write-Host "--- Prisma Setup ---" -ForegroundColor Cyan

# Try to enable PostGIS extension before push
Write-Host "Enabling PostGIS extension..." -ForegroundColor Cyan
$env:PGPASSWORD = "admin_pass"
# Use 'uslugi_db' as per docker-compose default
docker exec uslugi_db psql -U admin -d uslugi_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

npx prisma db push --schema=prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: prisma db push failed." -ForegroundColor Red
    exit 1
}

# 4. Seed Data
Write-Host "--- Seeding Data ---" -ForegroundColor Cyan
npx prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: seed failed (continuing to start server)." -ForegroundColor Yellow
}

# 5. Start Custom Socket.io Server
Write-Host "--- Starting Socket.io + Next.js Server ---" -ForegroundColor Cyan
npx tsx server.ts
