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

# Wait for Postgres to actually accept connections (not just a fixed sleep).
# Uses pg_isready inside the container — it returns 0 only when the server is ready.
Write-Host "Waiting for Postgres to accept connections..." -ForegroundColor Yellow
$dbTimeout = 60
$dbElapsed = 0
while ($dbElapsed -lt $dbTimeout) {
    docker exec masters_db pg_isready -U admin -d masters_db >$null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Postgres is ready!" -ForegroundColor Green
        break
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
    $dbElapsed += 1
}
if ($dbElapsed -ge $dbTimeout) {
    Write-Host "ERROR: Postgres did not become ready within $dbTimeout seconds." -ForegroundColor Red
    exit 1
}

# 3. Prisma Push
Write-Host "--- Prisma Setup ---" -ForegroundColor Cyan
npx prisma db push
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

# 5. Start Server
Write-Host "--- Starting Next.js Dev Server ---" -ForegroundColor Cyan
npx next dev
