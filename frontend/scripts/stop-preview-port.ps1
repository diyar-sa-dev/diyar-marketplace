#Requires -Version 5.1
<#
.SYNOPSIS
  Stop any process listening on the Vite preview/dev port (default 3000).
#>
param(
    [int]$Port = 3000
)

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $connections) {
    Write-Host "Port $Port is free." -ForegroundColor Green
    exit 0
}

$processIds = $connections.OwningProcess | Sort-Object -Unique
foreach ($processId in $processIds) {
    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
    $name = if ($proc) { $proc.ProcessName } else { 'unknown' }
    Write-Host "Stopping $name (PID $processId) on port $Port..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1
$stillListening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($stillListening) {
    Write-Error "Port $Port is still in use."
    exit 1
}

Write-Host "Port $Port is free." -ForegroundColor Green
