$ErrorActionPreference = "SilentlyContinue"
$projectDir = "C:\Users\Win11\OneDrive\Desktop\Credsetu"
Set-Location $projectDir

# Check if backend is already responding on port 5000
$isHealthy = $false
try {
    $res = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 2
    if ($res.status -eq "ok") {
        $isHealthy = $true
    }
} catch {
    $isHealthy = $false
}

if (-not $isHealthy) {
    Write-Host "Starting MiniLedger Backend..." -ForegroundColor Cyan
    # Start backend production server in background
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\backend`" && npm start" -WindowStyle Hidden
    
    # Wait for server to become ready
    $retries = 0
    while (-not $isHealthy -and $retries -lt 20) {
        Start-Sleep -Milliseconds 500
        try {
            $check = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 1
            if ($check.status -eq "ok") {
                $isHealthy = $true
            }
        } catch {}
        $retries++
    }
}

# Launch in native app window mode
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if (Test-Path $chromePath) {
    Start-Process -FilePath $chromePath -ArgumentList "--app=http://localhost:5000", "--window-size=1220,840"
} elseif (Test-Path $edgePath) {
    Start-Process -FilePath $edgePath -ArgumentList "--app=http://localhost:5000", "--window-size=1220,840"
} else {
    Start-Process "http://localhost:5000"
}

exit 0
