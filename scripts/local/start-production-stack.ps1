#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

. (Join-Path $PSScriptRoot 'Sync-ProductionEnv.ps1')
. (Join-Path $PSScriptRoot 'Ensure-DiyarHostsEntry.ps1')

$EnvFile = Join-Path $Root 'deploy/docker/production.env'
$Example = Join-Path $Root 'deploy/docker/production.env.local.example'

if (-not (Test-Path $EnvFile)) {
    Copy-Item $Example $EnvFile
    Write-Host "Created $EnvFile from local example."
}

$backend = Join-Path $Root 'backend'
Push-Location $backend
$appKey = (php artisan key:generate --show 2>$null | Select-Object -Last 1).Trim()
Pop-Location

if ($appKey) {
    (Get-Content $EnvFile -Raw) -replace 'APP_KEY=.*', "APP_KEY=$appKey" | Set-Content $EnvFile -NoNewline
    Write-Host 'Injected APP_KEY into production.env'
}

$network = Sync-ProductionEnv -Root $Root
Ensure-DiyarHostsEntry -Hostname $network.GatewayHost

Write-Host 'Starting KVM2 production Docker stack (API internal port 8093)...'
docker compose -f docker-compose.production.yml --env-file deploy/docker/production.env up -d --build

Write-Host 'Waiting for health...'
Start-Sleep -Seconds 15
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:$($network.HttpPort)/api/v1/health" -UseBasicParsing | Out-Null
    Write-Host "API health: OK — http://127.0.0.1:$($network.HttpPort)/api/v1/health"
} catch {
    Write-Host "API not ready yet. Check: docker compose -f docker-compose.production.yml logs nginx app"
}

Write-Host ''
Write-Host 'Run migrations (first time):'
Write-Host '  docker compose -f docker-compose.production.yml exec app php artisan migrate --force'
Write-Host ''
Write-Host 'Frontend (separate terminal):'
Write-Host '  .\scripts\local\start-frontend-prod-api.ps1'
Write-Host ''
Write-Host 'Dev gateway (after Vite is running):'
Write-Host '  .\scripts\local\start-dev-gateway.ps1'
Write-Host ''
Write-Host "Stable browser URL: $($network.GatewayUrl)"
