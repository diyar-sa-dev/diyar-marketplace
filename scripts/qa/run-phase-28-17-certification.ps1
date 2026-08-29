#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Phase 28.17 final enterprise certification orchestrator.

.PARAMETER Tier
    audit | quick | load | full

.EXAMPLE
    .\scripts\qa\run-phase-28-17-certification.ps1 -Tier quick
    .\scripts\qa\run-phase-28-17-certification.ps1 -Tier load
    .\scripts\qa\run-phase-28-17-certification.ps1 -Tier full
#>
param(
    [ValidateSet('audit', 'quick', 'load', 'full')]
    [string]$Tier = 'quick',

    [switch]$SkipDockerRebuild
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_helpers.ps1')

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Timestamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$EvidenceDir = Join-Path $Root "conception\Stages\Stage 28\Phase 28.17 - Final Enterprise Certification\_raw\$Timestamp"
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

Write-Host ''
Write-Host 'PHASE 28.17 — Final Enterprise Certification' -ForegroundColor Cyan
Write-Host "Tier: $Tier"
Write-Host "Evidence: $EvidenceDir"
Write-Host ''

$results = [System.Collections.Generic.List[object]]::new()

function Record-Step {
    param([string]$Name, [scriptblock]$Action, [switch]$Optional)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host "==> $Name" -ForegroundColor Cyan
    try {
        & $Action
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
        $sw.Stop()
        $results.Add([ordered]@{ step = $Name; status = 'PASS'; seconds = [math]::Round($sw.Elapsed.TotalSeconds, 1) })
        Write-Host "    PASS ($([math]::Round($sw.Elapsed.TotalSeconds, 1))s)" -ForegroundColor Green
    } catch {
        $sw.Stop()
        $status = if ($Optional) { 'SKIP' } else { 'FAIL' }
        $results.Add([ordered]@{ step = $Name; status = $status; seconds = [math]::Round($sw.Elapsed.TotalSeconds, 1); error = $_.Exception.Message })
        if ($Optional) {
            Write-Host "    SKIP: $($_.Exception.Message)" -ForegroundColor Yellow
        } else {
            Write-Host "    FAIL: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    }
}

# ── Stack verification ─────────────────────────────────────────────────────
if ($Tier -in @('audit', 'load', 'full')) {
    Record-Step 'Docker stack verify' {
        docker ps --format 'table {{.Names}}\t{{.Status}}' 2>&1 |
            Tee-Object -FilePath (Join-Path $EvidenceDir 'docker-ps.txt')
        docker inspect diyar-marketplace-api-1 --format '{{json .State.Health}}' 2>&1 |
            Out-File (Join-Path $EvidenceDir 'api-health.json') -Encoding utf8
    } -Optional

    if (-not $SkipDockerRebuild) {
        Record-Step 'Docker loadtest rebuild' {
            Push-Location $Root
            docker compose -f docker-compose.loadtest.yml up -d --build 2>&1 |
                Tee-Object -FilePath (Join-Path $EvidenceDir 'docker-rebuild.txt')
            Pop-Location
            if (-not (Wait-ForHttp 'http://127.0.0.1:8000/api/v1/health' -TimeoutSec 180)) {
                throw 'API not healthy after rebuild'
            }
        } -Optional
    }

    Record-Step 'Octane runtime probe' {
        docker exec diyar-marketplace-api-1 php -m 2>&1 |
            Tee-Object -FilePath (Join-Path $EvidenceDir 'php-modules.txt')
        docker exec diyar-marketplace-api-1 php -r "echo extension_loaded('swoole')?'swoole:yes':'swoole:no'; echo PHP_EOL;" 2>&1 |
            Add-Content (Join-Path $EvidenceDir 'php-modules.txt')
    } -Optional
}

# ── Quick gate ─────────────────────────────────────────────────────────────
if ($Tier -in @('quick', 'load', 'full')) {
    Record-Step 'Frontend typecheck' {
        Push-Location (Join-Path $Root 'frontend')
        npm run typecheck 2>&1 | Tee-Object -FilePath (Join-Path $EvidenceDir 'typecheck.txt')
        Pop-Location
    }

    Record-Step 'Vitest' {
        Push-Location (Join-Path $Root 'frontend')
        npm test 2>&1 | Tee-Object -FilePath (Join-Path $EvidenceDir 'vitest.txt')
        Pop-Location
    }

    Record-Step 'PHPUnit full' {
        $env:DIYAR_LOADTEST_MODE = 'false'
        $env:CACHE_STORE = 'array'
        Push-Location (Join-Path $Root 'backend')
        php artisan test 2>&1 | Tee-Object -FilePath (Join-Path $EvidenceDir 'phpunit.txt')
        Pop-Location
    }

    Record-Step 'Integration: Redis' {
        if (-not (Test-PortOpen '127.0.0.1' 6379)) { throw 'Redis not on 6379' }
        & (Join-Path $Root 'scripts\test-redis-integration.ps1') 2>&1 |
            Tee-Object -FilePath (Join-Path $EvidenceDir 'redis-integration.txt')
    } -Optional

    Record-Step 'Integration: Queue' {
        Push-Location (Join-Path $Root 'backend')
        php artisan test tests/Integration/Queue/QueueWorkerIntegrationTest.php 2>&1 |
            Tee-Object -FilePath (Join-Path $EvidenceDir 'queue-integration.txt')
        Pop-Location
    } -Optional

    Record-Step 'Integration: Broadcast' {
        Push-Location (Join-Path $Root 'backend')
        php artisan test tests/Integration/Broadcast/BroadcastChannelAuthorizationTest.php 2>&1 |
            Tee-Object -FilePath (Join-Path $EvidenceDir 'broadcast-integration.txt')
        Pop-Location
    } -Optional
}

# ── Load / capacity ──────────────────────────────────────────────────────────
if ($Tier -in @('load', 'full')) {
    $profiles = @('rps10', 'rps25', 'rps50', 'rps75', 'rps100')
    foreach ($p in $profiles) {
        Record-Step "k6 mixed $p" {
            Push-Location $Root
            docker compose -f docker-compose.loadtest.yml --profile k6 run --rm `
                -e "RPS_PROFILE=$p" k6 2>&1 |
                Tee-Object -FilePath (Join-Path $EvidenceDir "k6-mixed-$p.txt")
            Pop-Location
        } -Optional
    }

    Record-Step 'k6 soak15' {
        Push-Location $Root
        docker compose -f docker-compose.loadtest.yml --profile k6 run --rm `
            -e 'RPS_PROFILE=soak15' k6 2>&1 |
            Tee-Object -FilePath (Join-Path $EvidenceDir 'k6-soak15.txt')
        Pop-Location
    } -Optional
}

# ── Full tier adds E2E ───────────────────────────────────────────────────────
if ($Tier -eq 'full') {
    & (Join-Path $PSScriptRoot 'run-platform-certification.ps1') -Tier e2e -SkipBuild:$false
}

$summary = [ordered]@{
    phase      = '28.17'
    tier       = $Tier
    timestamp  = $Timestamp
    evidence   = $EvidenceDir
    steps      = $results
    pass_count = @($results | Where-Object { $_.status -eq 'PASS' }).Count
    fail_count = @($results | Where-Object { $_.status -eq 'FAIL' }).Count
    skip_count = @($results | Where-Object { $_.status -eq 'SKIP' }).Count
}
$summary | ConvertTo-Json -Depth 6 | Out-File (Join-Path $EvidenceDir 'summary.json') -Encoding utf8

Write-Host ''
Write-Host "PASS: $($summary.pass_count) | FAIL: $($summary.fail_count) | SKIP: $($summary.skip_count)"
Write-Host "Evidence: $EvidenceDir"

if ($summary.fail_count -gt 0) { exit 1 }
