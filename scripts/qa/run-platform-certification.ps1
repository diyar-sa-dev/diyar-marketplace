#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Enterprise platform certification orchestrator (Phase 28.16).

.PARAMETER Tier
    quick | integration | e2e | security | load | certification

.PARAMETER SkipBuild
    Skip frontend build during E2E tier.

.EXAMPLE
    .\scripts\qa\run-platform-certification.ps1 -Tier quick
    .\scripts\qa\run-platform-certification.ps1 -Tier certification
#>
param(
    [ValidateSet('quick', 'integration', 'e2e', 'security', 'load', 'certification')]
    [string]$Tier = 'quick',

    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_helpers.ps1')

$ctx = Initialize-QaContext -Tier $Tier
Write-QaHeader $ctx

$results = [System.Collections.Generic.List[object]]::new()

function Invoke-StepCommand {
    param(
        [scriptblock]$Action
    )
    & $Action
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        throw "Command exited with code $LASTEXITCODE"
    }
}

function Record-Step {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [switch]$Optional
    )
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        Invoke-StepCommand -Action $Action
        $sw.Stop()
        $entry = [ordered]@{
            step    = $Name
            status  = 'PASS'
            seconds = [math]::Round($sw.Elapsed.TotalSeconds, 1)
        }
        $results.Add($entry)
        Write-Host "    PASS ($($entry.seconds)s)" -ForegroundColor Green
    } catch {
        $sw.Stop()
        $entry = [ordered]@{
            step    = $Name
            status  = if ($Optional) { 'SKIP' } else { 'FAIL' }
            seconds = [math]::Round($sw.Elapsed.TotalSeconds, 1)
            error   = $_.Exception.Message
        }
        $results.Add($entry)
        if ($Optional) {
            Write-Host "    SKIP: $($_.Exception.Message)" -ForegroundColor Yellow
        } else {
            Write-Host "    FAIL: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    } finally {
        $ErrorActionPreference = $prevEap
    }
}

# ── quick (always included in higher tiers) ────────────────────────────────
if ($Tier -in @('quick', 'integration', 'e2e', 'security', 'load', 'certification')) {
    Record-Step 'Backend Pint' {
        Push-Location $ctx.Backend
        vendor/bin/pint --test
        Pop-Location
    }

    Record-Step 'Frontend typecheck' {
        Push-Location $ctx.Frontend
        npm run typecheck
        Pop-Location
    }

    Record-Step 'Frontend lint' {
        Push-Location $ctx.Frontend
        npm run lint
        Pop-Location
    }

    Record-Step 'Vitest' {
        Push-Location $ctx.Frontend
        npm test 2>&1 | Tee-Object -FilePath (Join-Path $ctx.EvidenceDir 'vitest.txt')
        Pop-Location
    }

    Record-Step 'PHPUnit (full)' {
        $env:DIYAR_LOADTEST_MODE = 'false'
        $env:CACHE_STORE = 'array'
        Push-Location $ctx.Backend
        php artisan test --log-junit (Join-Path $ctx.EvidenceDir 'phpunit.xml') 2>&1 |
            Tee-Object -FilePath (Join-Path $ctx.EvidenceDir 'phpunit.txt')
        Pop-Location
    }
}

# ── integration ────────────────────────────────────────────────────────────
if ($Tier -in @('integration', 'certification')) {
    Record-Step 'Redis integration' {
        if (-not (Test-PortOpen '127.0.0.1' 6379)) {
            throw 'Redis not reachable on 127.0.0.1:6379'
        }
        & (Join-Path $ctx.Root 'scripts\test-redis-integration.ps1') 2>&1 |
            Tee-Object -FilePath (Join-Path $ctx.EvidenceDir 'redis-integration.txt')
    } -Optional
}

# ── e2e ────────────────────────────────────────────────────────────────────
if ($Tier -in @('e2e', 'certification')) {
    Record-Step 'E2E bootstrap' {
        & (Join-Path $ctx.Root 'scripts\e2e\bootstrap-stack.ps1')
    }

    if (-not $SkipBuild) {
        Record-Step 'Frontend production build' {
            Push-Location $ctx.Frontend
            $env:VITE_API_URL = '/api/v1'
            $env:VITE_BACKEND_URL = ''
            npm run build 2>&1 | Tee-Object -FilePath (Join-Path $ctx.EvidenceDir 'frontend-build.txt')
            Pop-Location
        }
    }

    Record-Step 'Playwright E2E' {
        $apiJob = Start-Job -ScriptBlock {
            Set-Location $using:ctx.Backend
            $env:DB_CONNECTION = 'sqlite'
            $env:DB_DATABASE = 'database/database.sqlite'
            $env:CACHE_STORE = 'array'
            $env:QUEUE_CONNECTION = 'sync'
            $env:DIYAR_LOADTEST_MODE = 'true'
            $env:FRONTEND_URL = 'http://127.0.0.1:3000'
            php artisan serve --host=127.0.0.1 --port=8000 2>&1
        }
        $previewJob = Start-Job -ScriptBlock {
            Set-Location $using:ctx.Frontend
            npx vite preview --host 127.0.0.1 --port 3000 2>&1
        }
        try {
            Wait-ForHttp 'http://127.0.0.1:8000/api/v1/health' -TimeoutSec 60
            Wait-ForHttp 'http://127.0.0.1:3000' -TimeoutSec 60
            Push-Location $ctx.Frontend
            $env:CI = 'true'
            $env:E2E_BASE_URL = 'http://127.0.0.1:3000'
            $env:E2E_API_URL = 'http://127.0.0.1:8000/api/v1'
            npx playwright test --reporter=list 2>&1 |
                Tee-Object -FilePath (Join-Path $ctx.EvidenceDir 'playwright.txt')
            Pop-Location
        } finally {
            Stop-Job $apiJob, $previewJob -ErrorAction SilentlyContinue
            Remove-Job $apiJob, $previewJob -Force -ErrorAction SilentlyContinue
        }
    }
}

# ── security ───────────────────────────────────────────────────────────────
if ($Tier -in @('security', 'certification')) {
    Record-Step 'Security regression subset' {
        Push-Location $ctx.Backend
        php artisan test `
            tests/Feature/Security/RateLimitingTest.php `
            tests/Feature/Security/FileUploadSecurityTest.php `
            tests/Feature/Api/V1/Order/OrderAuthorizationTest.php `
            2>&1 | Tee-Object -FilePath (Join-Path $ctx.EvidenceDir 'security.txt')
        Pop-Location
    }
}

# ── load ───────────────────────────────────────────────────────────────────
if ($Tier -in @('load', 'certification')) {
    Record-Step 'k6 mixed rps10' {
        $healthUrl = 'http://127.0.0.1:8000/api/v1/health'
        if (-not (Wait-ForHttp $healthUrl -TimeoutSec 5 -Quiet)) {
            Write-Host '    Loadtest stack not up — starting docker compose loadtest...'
            Push-Location $ctx.Root
            docker compose -f docker-compose.loadtest.yml up -d --build 2>&1 | Out-Null
            Pop-Location
            if (-not (Wait-ForHttp $healthUrl -TimeoutSec 120)) {
                throw "API not healthy at $healthUrl"
            }
        }
        $k6Out = Join-Path $ctx.EvidenceDir 'k6-mixed-rps10.json'
        Push-Location $ctx.Root
        k6 run `
            -e BASE_URL=http://127.0.0.1:8000/api/v1 `
            -e RPS_PROFILE=rps10 `
            --summary-export $k6Out `
            scripts/performance/mixed-workload.js 2>&1 |
            Tee-Object -FilePath (Join-Path $ctx.EvidenceDir 'k6-mixed-rps10.txt')
        Pop-Location
    } -Optional
}

# ── summary ────────────────────────────────────────────────────────────────
$summary = [ordered]@{
    tier       = $Tier
    timestamp  = $ctx.Timestamp
    evidence   = $ctx.EvidenceDir
    steps      = $results
    pass_count = @($results | Where-Object { $_.status -eq 'PASS' }).Count
    fail_count = @($results | Where-Object { $_.status -eq 'FAIL' }).Count
    skip_count = @($results | Where-Object { $_.status -eq 'SKIP' }).Count
}
$summaryPath = Join-Path $ctx.EvidenceDir 'summary.json'
$summary | ConvertTo-Json -Depth 6 | Out-File -FilePath $summaryPath -Encoding utf8

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Tier: $Tier | PASS: $($summary.pass_count) | FAIL: $($summary.fail_count) | SKIP: $($summary.skip_count)"
Write-Host " Evidence: $($ctx.EvidenceDir)"
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

if ($summary.fail_count -gt 0) {
    exit 1
}
