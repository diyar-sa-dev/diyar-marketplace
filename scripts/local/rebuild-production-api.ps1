#Requires -Version 5.1
<#
.SYNOPSIS
  Rebuild diyar-production Docker images so the API includes the latest backend code.

.DESCRIPTION
  Required after pulling backend route/feature changes (e.g. Smart Filter suggestions).
  Rebuilds app, queue, scheduler, and Reverb services, then restarts the stack.
#>

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$EnvFile = Join-Path $Root 'deploy/docker/production.env'
if (-not (Test-Path $EnvFile)) {
    $Example = Join-Path $Root 'deploy/docker/production.env.local.example'
    Copy-Item $Example $EnvFile
    Write-Host "Created $EnvFile — review secrets before production use."
}

Write-Host '=== Rebuilding diyar-production API images ===' -ForegroundColor Cyan
docker compose -f docker-compose.production.yml --env-file deploy/docker/production.env build app queue-critical queue-default scheduler reverb-1 reverb-2
if ($LASTEXITCODE -ne 0) {
    throw 'Docker build failed.'
}

Write-Host '=== Restarting diyar-production stack ===' -ForegroundColor Cyan
docker compose -f docker-compose.production.yml --env-file deploy/docker/production.env up -d --force-recreate app queue-critical queue-default scheduler reverb-1 reverb-2 nginx
if ($LASTEXITCODE -ne 0) {
    throw 'Docker up failed.'
}

Start-Sleep -Seconds 8
$httpPort = '8093'
if (Test-Path $EnvFile) {
    $line = Get-Content $EnvFile | Where-Object { $_ -match '^HTTP_PORT=' } | Select-Object -First 1
    if ($line -match 'HTTP_PORT=(\d+)') {
        $httpPort = $Matches[1]
    }
}

Write-Host ''
Write-Host '=== Smoke checks ===' -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:${httpPort}/api/v1/health/live" -UseBasicParsing -TimeoutSec 10 | Out-Null
    Write-Host "  health/live: OK" -ForegroundColor Green
} catch {
    Write-Warning "  health/live: not ready yet"
}

try {
    $filterSuggestionsUrl = ('http://127.0.0.1:{0}/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom' -f $httpPort)
    Invoke-WebRequest -Uri $filterSuggestionsUrl -UseBasicParsing -TimeoutSec 30 | Out-Null
    Write-Host "  filter-suggestions: OK" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Warning "  filter-suggestions: HTTP $status — check docker logs app nginx"
}

Write-Host ''
Write-Host "API: http://127.0.0.1:${httpPort}" -ForegroundColor Green
Write-Host 'Restart Vite (npm run dev) so proxy targets pick up .env.development if changed.'
