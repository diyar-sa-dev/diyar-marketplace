#Requires -Version 5.1
<#
.SYNOPSIS
  Isolated KVM2-equivalent (2 CPU / ~8 GB) local validation — Octane + full production-like stack.

  Does NOT touch Hostinger VPS. Does NOT modify application code.
#>
param(
    [switch]$SkipBuild,
    [switch]$SkipCampaign,
    [switch]$Quick,
    [string[]]$Profiles
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$Project = 'diyar-kvm2-test'
$EnvExample = Join-Path $Root 'deploy/docker/kvm2-test.env.example'
$EnvFile = Join-Path $Root 'deploy/docker/kvm2-test.env'
$Reports = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
New-Item -ItemType Directory -Force -Path $Reports | Out-Null

if (-not (Test-Path $EnvFile)) {
    Copy-Item $EnvExample $EnvFile
    $prodEnv = Join-Path $Root 'deploy/docker/production.env'
    if (Test-Path $prodEnv) {
        $keyLine = Get-Content $prodEnv | Where-Object { $_ -match '^APP_KEY=' } | Select-Object -First 1
        if ($keyLine) {
            (Get-Content $EnvFile) -replace '^APP_KEY=.*', $keyLine | Set-Content $EnvFile -Encoding utf8
        }
    }
    Write-Host "Created $EnvFile from example (APP_KEY copied if available)." -ForegroundColor Yellow
}

$compose = @(
    '-p', $Project,
    '-f', 'docker-compose.production.yml',
    '-f', 'docker-compose.production.octane.yml',
    '-f', 'docker-compose.kvm2-test.yml',
    '-f', 'docker-compose.kvm2-test.k6.yml',
    '--env-file', 'deploy/docker/kvm2-test.env'
)

function Get-HttpPort {
    $line = Get-Content $EnvFile | Where-Object { $_ -match '^HTTP_PORT=' } | Select-Object -First 1
    if ($line -match '=(\d+)') { return $Matches[1] }
    return '8193'
}

function Save-DockerStats([string]$Name) {
    $path = Join-Path $Reports "stats-$Name.csv"
    docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}}" |
        Where-Object { $_ -match $Project } |
        Out-File -FilePath $path -Encoding utf8
}

function Save-EnvironmentAudit {
    $app = "${Project}-app-1"
    $audit = [ordered]@{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        git_head = (git rev-parse HEAD)
        git_describe = (git log -1 --oneline)
        df0e5e1_in_history = $(git merge-base --is-ancestor df0e5e1 HEAD; $LASTEXITCODE -eq 0)
        docker_server = (docker version --format '{{.Server.Version}}' 2>$null)
        compose_version = (docker compose version --short 2>$null)
    }
    try {
        $audit.laravel = (docker exec $app php artisan --version 2>$null)
        $audit.php = (docker exec $app php -r 'echo PHP_VERSION;' 2>$null)
        $audit.swoole = (docker exec $app php -r 'echo extension_loaded("swoole")?"yes":"no";' 2>$null)
        $audit.octane_workers = (docker exec $app printenv OCTANE_WORKERS 2>$null)
    } catch { }
    $audit | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $Reports 'environment-audit.json') -Encoding utf8
}

$port = Get-HttpPort
$healthUrl = "http://127.0.0.1:${port}/api/v1/health/live"

if (-not $SkipBuild) {
    Write-Host "=== Starting $Project (Octane, OCTANE_WORKERS=2, HTTP :$port) ===" -ForegroundColor Cyan
    $env:OCTANE_WORKERS = '2'
    docker compose @compose up -d --build mysql redis app nginx queue-critical queue-default scheduler reverb-1 reverb-2
    if ($LASTEXITCODE -ne 0) { throw 'Stack failed to start.' }

    Write-Host '=== Waiting for MySQL + nginx ===' -ForegroundColor Cyan
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { $ready = $true; break }
        } catch { Start-Sleep -Seconds 4 }
    }
    if (-not $ready) { throw "Health check failed: $healthUrl" }

    Write-Host '=== Migrations (idempotent) ===' -ForegroundColor Cyan
    docker compose @compose exec -T app php artisan migrate --force
    Write-Host '=== Seeding catalog (DatabaseSeeder, isolated kvm2 DB) ===' -ForegroundColor Cyan
    docker compose @compose exec -T app php artisan db:seed --class=DatabaseSeeder --force
}

Save-EnvironmentAudit
Save-DockerStats 'idle'

if ($SkipCampaign) {
    Write-Host "Stack ready at $healthUrl - campaign skipped." -ForegroundColor Green
    exit 0
}

$stageDuration = if ($Quick) { '90s' } else { '3m' }
$soakDuration = if ($Quick) { '3m' } else { '10m' }

$campaign = if ($Profiles -and $Profiles.Count -gt 0) {
    $Profiles
} elseif ($Quick) {
    @('baseline', 'vu10', 'vu25', 'rps50', 'rps100', 'search-focus', 'burst100')
} else {
    @(
        'baseline', 'vu10', 'vu25', 'vu50', 'vu100',
        'rps50', 'rps100', 'rps150', 'rps200', 'rps250',
        'vu250', 'vu500', 'vu1000',
        'rps300', 'rps350', 'rps400', 'rps500',
        'burst100', 'burst250', 'burst500', 'burst1000',
        'search-focus', 'soak75'
    )
}

$results = @()
foreach ($profile in $campaign) {
    Write-Host "`n=== K6 PROFILE $profile (STAGE=$stageDuration) ===" -ForegroundColor Cyan
    Save-DockerStats "before-$profile"
    docker compose @compose --profile k6 run --rm `
        -e "K6_PROFILE=$profile" `
        -e "PROFILE=$profile" `
        -e "STAGE_DURATION=$stageDuration" `
        -e "SOAK_DURATION=$soakDuration" `
        k6 run /scripts/kvm2-equivalent-campaign.js
    $code = $LASTEXITCODE
    Save-DockerStats "after-$profile"
    $summaryPath = Join-Path $Reports "summary-$profile.json"
    if (Test-Path $summaryPath) {
        $results += Get-Content $summaryPath -Raw | ConvertFrom-Json
    }
    if ($code -ne 0 -and $profile -in @('baseline', 'vu10', 'rps50')) {
        Write-Warning "Aborting campaign after critical profile failure: $profile"
        break
    }
}

Save-DockerStats 'recovery-idle'
Start-Sleep -Seconds 30
Save-DockerStats 'recovery-30s'

@{
    project = $Project
    http_port = $port
    git_head = (git rev-parse HEAD)
    stage_duration = $stageDuration
    soak_duration = $soakDuration
    profiles = $results
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Reports 'campaign.json') -Encoding utf8

Write-Host "`nCampaign written to $Reports" -ForegroundColor Green
