#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

. (Join-Path $PSScriptRoot 'Sync-ProductionEnv.ps1')
. (Join-Path $PSScriptRoot 'Ensure-DiyarHostsEntry.ps1')

$network = Sync-ProductionEnv -Root $Root
$gatewayHost = if ($network.GatewayHost) { $network.GatewayHost } else { 'diyar.local' }
$gatewayPort = if ($network.GatewayPort) { $network.GatewayPort } else { '8080' }

Ensure-DiyarHostsEntry -Hostname $gatewayHost

Write-Host "Starting local dev gateway on port $gatewayPort..."
docker compose -f docker-compose.local-gateway.yml up -d

Start-Sleep -Seconds 2
$url = "http://${gatewayHost}:${gatewayPort}"
try {
    Invoke-WebRequest -Uri "$url/api/v1/health/live" -UseBasicParsing | Out-Null
    Write-Host "Gateway health: OK"
} catch {
    Write-Host "Gateway starting — ensure Docker API (:8093) and Vite (:3000) are running."
}

Write-Host ''
Write-Host "Use this URL every time (stable, no LAN IP):"
Write-Host "  $url"
Write-Host ''
