# Fix API configuration and start server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WebMetricsPro - Fix and Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any existing node processes on port 8080
Write-Host "[1/4] Checking for existing processes..." -ForegroundColor Yellow
$port8080 = netstat -ano | findstr ":8080"
if ($port8080) {
    Write-Host "Found process using port 8080, attempting to terminate..." -ForegroundColor Yellow
    $pid = ($port8080 -split '\s+')[-1]
    if ($pid) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Process terminated successfully" -ForegroundColor Green
        } catch {
            Write-Host "Could not terminate process automatically. Please close it manually." -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "No existing process found on port 8080" -ForegroundColor Green
}

# Step 2: Rebuild frontend (optional, only if changes were made)
Write-Host ""
Write-Host "[2/4] Rebuilding frontend..." -ForegroundColor Yellow
$buildChoice = Read-Host "Do you want to rebuild the frontend? (y/N)"
if ($buildChoice -eq 'y' -or $buildChoice -eq 'Y') {
    Write-Host "Building frontend... This may take a minute..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend built successfully!" -ForegroundColor Green
    } else {
        Write-Host "Build failed. Check errors above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Skipping rebuild" -ForegroundColor Gray
}

# Step 3: Check dist folder
Write-Host ""
Write-Host "[3/4] Verifying dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $distFiles = Get-ChildItem dist -Recurse | Measure-Object
    Write-Host "Dist folder exists with $($distFiles.Count) files" -ForegroundColor Green
} else {
    Write-Host "ERROR: dist folder not found! Running build..." -ForegroundColor Red
    npm run build
}

# Step 4: Start server
Write-Host ""
Write-Host "[4/4] Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Server is starting..." -ForegroundColor Green
Write-Host "Access at: http://localhost:8080" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$env:NODE_ENV = "production"
node server.js
