param([int]$Port = 8080)
$ErrorActionPreference = "Stop"

Write-Host "Starting ngrok on port $Port..." -ForegroundColor Cyan

try {
    $ver = ngrok version 2>&1
    Write-Host "Ngrok found: $ver" -ForegroundColor Green
} catch {
    Write-Host "Ngrok not found. Install from https://ngrok.com/download" -ForegroundColor Red
    exit 1
}


$envPath = Join-Path $PSScriptRoot "..\.env"
Write-Host "Checking for .env file at: $envPath" -ForegroundColor Yellow
if (-not (Test-Path $envPath)) {
    Write-Host ".env file not found at: $envPath" -ForegroundColor Red
    exit 1
}

$backup = "$envPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $envPath $backup
Write-Host "Backup created: $backup" -ForegroundColor Green

$ngrokJob = Start-Job { param($p) ngrok http $p } -ArgumentList $Port
Start-Sleep -Seconds 3

$ngrokUrl = $null
for ($i = 0; $i -lt 10; $i++) {
    try {
        $resp = Invoke-RestMethod "http://127.0.0.1:4040/api/tunnels"
        $ngrokUrl = ($resp.tunnels | Where-Object { $_.proto -eq "https" }).public_url
        if ($ngrokUrl) { break }
    } catch { }
    Start-Sleep 1
}

if (-not $ngrokUrl) {
    Write-Host "Failed to get ngrok URL" -ForegroundColor Red
    Stop-Job $ngrokJob; Remove-Job $ngrokJob
    exit 1
}

Write-Host "Ngrok URL: $ngrokUrl" -ForegroundColor Green

$content = Get-Content $envPath -Raw
$content = $content -replace 'CALLBACK_URI="?[^"\r\n]+"?', "CALLBACK_URI=`"$ngrokUrl`""
Set-Content $envPath $content -NoNewline

Write-Host "Updated .env with $ngrokUrl" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop and restore .env" -ForegroundColor Yellow

try {
    while ($ngrokJob.State -eq "Running") {
        Start-Sleep 2
    }
} catch {
    Write-Host "Stopped" -ForegroundColor Yellow
} finally {
    Stop-Job $ngrokJob -ErrorAction SilentlyContinue
    Remove-Job $ngrokJob -ErrorAction SilentlyContinue
    Copy-Item $backup $envPath -Force
    Write-Host "Restored original .env" -ForegroundColor Green
}
