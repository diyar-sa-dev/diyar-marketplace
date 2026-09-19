#Requires -Version 5.1
<#
.SYNOPSIS
  Switch diyar-production to Octane and run Grafana k6 staged stress (KVM2 pre-deploy).

.DESCRIPTION
  Frontend stays on the host (`npm run dev` :3000) like Vercel.
  API/nginx/mysql/redis/queue workers stay in diyar-production Docker.
  k6 runs on the compose network and publishes the Grafana k6 dashboard on :5665.

.PARAMETER IncludeHigh
  Also run 1_000 / 10_000 VU and 1_000 / 10_000 RPS bursts. Default campaign
  stops after 100 users / 100 RPS unless this switch is set (10k VUs can OOM a laptop).
#>
param(
    [switch]$SkipOctaneSwitch,
    [switch]$IncludeHigh,
    [switch]$SkipExisting,
    [string[]]$Profiles
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$EnvFile = Join-Path $Root 'deploy/docker/production.env'
$Reports = Join-Path $Root 'backend/storage/certification/k6'
New-Item -ItemType Directory -Force -Path $Reports | Out-Null

$compose = @(
    '-f', 'docker-compose.production.yml',
    '-f', 'docker-compose.production.octane.yml',
    '-f', 'docker-compose.k6-grafana.yml',
    '--env-file', 'deploy/docker/production.env'
)

function Assert-HttpOk([string]$Url, [string]$Label) {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw "$Label failed HTTP $($response.StatusCode) ($Url)"
    }
    Write-Host "  $Label OK ($Url)" -ForegroundColor Green
}

function Save-DockerStats([string]$Name) {
    $path = Join-Path $Reports "stats-$Name.csv"
    $tmp = Join-Path $Reports "stats-$Name.$([guid]::NewGuid().ToString('n')).tmp"
    docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.NetIO}}" |
        Out-File -FilePath $tmp -Encoding utf8
    Move-Item -Force $tmp $path
}

if (-not $SkipOctaneSwitch) {
    Write-Host '=== Switching diyar-production app+nginx to Octane (KVM2: 2 workers) ===' -ForegroundColor Cyan
    $env:OCTANE_WORKERS = '2'
    docker compose @compose up -d --build app nginx
    docker compose @compose up -d queue-critical queue-default
    if ($LASTEXITCODE -ne 0) {
        throw 'Octane stack up failed.'
    }
}

Write-Host '=== Waiting for Octane nginx health ===' -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    try {
        Assert-HttpOk 'http://127.0.0.1:8093/api/v1/health/live' 'health/live'
        $ready = $true
        break
    } catch {
        Start-Sleep -Seconds 3
    }
}
if (-not $ready) {
    throw 'Octane nginx never became healthy on :8093'
}

Write-Host '=== Checking Vite frontend (Vercel stand-in) ===' -ForegroundColor Cyan
try {
    Assert-HttpOk 'http://127.0.0.1:3000/' 'vite'
    Assert-HttpOk 'http://127.0.0.1:3000/search?q=%D8%B3%D8%B1%D9%8A%D8%B1' 'vite-search'
} catch {
    throw 'Vite is not running. Start `npm run dev` in frontend/ (port 3000).'
}

docker exec diyar-production-app-1 php artisan --version | Out-Host
try {
    docker exec diyar-production-app-1 php -r "echo 'swoole='.(extension_loaded('swoole')?'yes':'no').PHP_EOL;"
} catch {
    Write-Warning 'Could not probe Swoole inside app container.'
}

$campaign = if ($Profiles -and $Profiles.Count -gt 0) {
    $Profiles
} else {
    @('vu10', 'burst10', 'rps10', 'vu100', 'burst100', 'rps100')
}
if ($IncludeHigh -and (-not $Profiles -or $Profiles.Count -eq 0)) {
    $os = Get-CimInstance Win32_OperatingSystem
    $freeGb = [math]::Round(($os.FreePhysicalMemory / 1MB), 1)
    Write-Host "Free RAM: ${freeGb} GB"
    $campaign += @('vu1000', 'burst1000', 'rps1000')
    if ($freeGb -ge 8) {
        $campaign += @('burst10000', 'rps10000')
    } else {
        Write-Warning 'Skipping 10k profiles — need >= 8 GB free RAM for k6 VUs.'
    }
}

$results = @()
$dashboardOpened = $false
Write-Host ''
Write-Host 'Grafana k6 dashboard: http://127.0.0.1:5665' -ForegroundColor Yellow
Write-Host "Reports: $Reports"

foreach ($profile in $campaign) {
    Write-Host ''
    Write-Host "=== PROFILE $profile ===" -ForegroundColor Cyan
    $summaryPath = Join-Path $Reports "summary-$profile.json"
    if ($SkipExisting -and (Test-Path $summaryPath)) {
        Write-Host "  skip (existing $summaryPath)" -ForegroundColor DarkGray
        continue
    }

    Save-DockerStats "$profile-before"
    if (Test-Path $summaryPath) {
        Remove-Item $summaryPath -Force
    }

    $k6Run = @('--profile', 'k6', 'run', '--rm')
    if (-not $dashboardOpened) {
        $k6Run += '--service-ports'
        $dashboardOpened = $true
    }
    $k6Run += @(
        '-e', "PROFILE=$profile",
        '-e', "K6_PROFILE=$profile",
        'k6', 'run', '/scripts/kvm2-octane-predeploy.js'
    )
    docker compose @compose @k6Run
    $code = $LASTEXITCODE

    Save-DockerStats "$profile-after"
    if (Test-Path (Join-Path $Reports 'summary.json')) {
        Copy-Item (Join-Path $Reports 'summary.json') $summaryPath -Force
    }

    $entry = [pscustomobject]@{
        profile = $profile
        exit_code = $code
        summary_file = if (Test-Path $summaryPath) { "summary-$profile.json" } else { $null }
    }
    $results += $entry

    if ($code -ne 0 -and $profile -in @('vu10', 'burst10', 'rps10')) {
        Write-Warning "Aborting campaign: $profile failed (exit $code). Higher stages would not be a valid KVM2 signal."
        break
    }
}

$campaignPath = Join-Path $Reports 'campaign.json'
$merged = @()
Get-ChildItem $Reports -Filter 'summary-*.json' | ForEach-Object {
    $merged += Get-Content $_.FullName -Raw | ConvertFrom-Json
}
@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    stack = 'diyar-production Octane (2 workers) + nginx :8093 + queue workers + Vite :3000'
    profiles = $merged | Sort-Object profile
    last_run = $results
} | ConvertTo-Json -Depth 8 | Set-Content $campaignPath -Encoding utf8
Write-Host ''
Write-Host "Campaign written: $campaignPath"
Write-Host 'Dashboard HTML (last profile): backend/storage/certification/k6/dashboard.html'
Write-Host 'API: http://127.0.0.1:8093   Vite: http://127.0.0.1:3000   Grafana k6: http://127.0.0.1:5665'
