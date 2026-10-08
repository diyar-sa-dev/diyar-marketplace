#Requires -Version 5.1
<#
.SYNOPSIS
  Step 13B.1 Benchmark Integrity & Repeatability Matrix Runner.
  Executes repeated runs (3x smoke, 3x moderate, 1x high, 1x saturation, 1x cold, 1x warm)
  using grafana/k6 with strict response-body schema assertions.
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('octane', 'fpm')]
    [string]$Target
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$OutputDir = Join-Path $Root "backend/storage/certification/step13b1/$Target"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " STEP 13B.1 BENCHMARK INTEGRITY MATRIX ($Target) " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

function Run-K6Test {
    param(
        [string]$ModeName,
        [string]$RunLabel,
        [bool]$PreClearCache = $false
    )

    if ($PreClearCache) {
        Write-Host "  -> Clearing Redis Cache for cold run..." -ForegroundColor DarkYellow
        docker exec diyar-vps-sim-app-1 php artisan cache:clear | Out-Null
    }

    Write-Host "  -> Running k6: Mode=$ModeName, Label=$RunLabel" -ForegroundColor Yellow

    $outFile = "${OutputDir}/k6_${RunLabel}_raw.txt"
    $jsonFile = "${OutputDir}/k6_${RunLabel}_summary.json"

    $k6Cmd = "docker run --rm --network diyar-vps-sim_backend -v `"${Root}/scripts/performance:/scripts`" -e BASE_URL=http://nginx/api/v1 -e MODE=$ModeName grafana/k6 run /scripts/step13b1-benchmark.js 2>&1"
    $k6Output = Invoke-Expression $k6Cmd

    $k6Output | Out-File -FilePath $outFile -Encoding utf8

    $jsonMatch = ($k6Output -join "`n") | Select-String -Pattern '\{[\s\S]*"mode":[\s\S]*\}'
    if ($jsonMatch) {
        $jsonStr = $jsonMatch.Matches[0].Value
        $jsonStr | Out-File -FilePath $jsonFile -Encoding utf8
        $obj = $jsonStr | ConvertFrom-Json
        Write-Host "     [Result] RPS: $($obj.rps) | p50: $($obj.p50_ms)ms | p95: $($obj.p95_ms)ms | Errors: $($obj.fail_rate_pct)% | Assertion Fails: $($obj.assertion_failures)" -ForegroundColor Green
        return $obj
    } else {
        Write-Host "     [WARN] Could not parse summary JSON from k6 output." -ForegroundColor Red
        return $null
    }
}

$results = @()

# 1. Warm-up
Write-Host "`n[Phase 1] Pre-warming application..." -ForegroundColor Cyan
1..10 | ForEach-Object {
    docker exec diyar-vps-sim-app-1 curl -s http://nginx/api/v1/health | Out-Null
    docker exec diyar-vps-sim-app-1 curl -s http://nginx/api/v1/products?per_page=12 | Out-Null
}

# 2. Smoke Repeatability (3 runs)
Write-Host "`n[Phase 2] Smoke Repeatability (5 VUs, 10s - 3 Runs)..." -ForegroundColor Cyan
for ($i = 1; $i -le 3; $i++) {
    $res = Run-K6Test -ModeName 'smoke' -RunLabel "smoke_run_$i"
    if ($res) { $results += [PSCustomObject]@{ Scenario = "Smoke Run $i"; RPS = $res.rps; p50 = $res.p50_ms; p95 = $res.p95_ms; p99 = $res.p99_ms; Errors = "$($res.fail_rate_pct)%"; AssertFails = $res.assertion_failures } }
    Start-Sleep -Seconds 2
}

# 3. Moderate Repeatability (3 runs)
Write-Host "`n[Phase 3] Moderate Repeatability (20 VUs, 30s - 3 Runs)..." -ForegroundColor Cyan
for ($i = 1; $i -le 3; $i++) {
    $res = Run-K6Test -ModeName 'moderate' -RunLabel "moderate_run_$i"
    if ($res) { $results += [PSCustomObject]@{ Scenario = "Moderate Run $i"; RPS = $res.rps; p50 = $res.p50_ms; p95 = $res.p95_ms; p99 = $res.p99_ms; Errors = "$($res.fail_rate_pct)%"; AssertFails = $res.assertion_failures } }
    Start-Sleep -Seconds 3
}

# 4. High Load (40 VUs, 30s)
Write-Host "`n[Phase 4] High Load (40 VUs, 30s)..." -ForegroundColor Cyan
$resHigh = Run-K6Test -ModeName 'high' -RunLabel "high_run_1"
if ($resHigh) { $results += [PSCustomObject]@{ Scenario = "High (40 VU)"; RPS = $resHigh.rps; p50 = $resHigh.p50_ms; p95 = $resHigh.p95_ms; p99 = $resHigh.p99_ms; Errors = "$($resHigh.fail_rate_pct)%"; AssertFails = $resHigh.assertion_failures } }
Start-Sleep -Seconds 3

# 5. Saturation Ramping (10 -> 80 VUs)
Write-Host "`n[Phase 5] Saturation Ramping (10-80 VUs)..." -ForegroundColor Cyan
$resSat = Run-K6Test -ModeName 'saturation' -RunLabel "saturation_run_1"
if ($resSat) { $results += [PSCustomObject]@{ Scenario = "Saturation (80 VU)"; RPS = $resSat.rps; p50 = $resSat.p50_ms; p95 = $resSat.p95_ms; p99 = $resSat.p99_ms; Errors = "$($resSat.fail_rate_pct)%"; AssertFails = $resSat.assertion_failures } }
Start-Sleep -Seconds 3

# 6. Cold vs Warm Cache Isolation
Write-Host "`n[Phase 6] Cold vs Warm Cache Isolation (Moderate 20 VUs)..." -ForegroundColor Cyan
$resCold = Run-K6Test -ModeName 'moderate' -RunLabel "cache_cold_run" -PreClearCache $true
if ($resCold) { $results += [PSCustomObject]@{ Scenario = "Cold Cache (20 VU)"; RPS = $resCold.rps; p50 = $resCold.p50_ms; p95 = $resCold.p95_ms; p99 = $resCold.p99_ms; Errors = "$($resCold.fail_rate_pct)%"; AssertFails = $resCold.assertion_failures } }
Start-Sleep -Seconds 2

# Warm up twice
1..10 | ForEach-Object {
    docker exec diyar-vps-sim-app-1 curl -s http://nginx/api/v1/categories | Out-Null
    docker exec diyar-vps-sim-app-1 curl -s http://nginx/api/v1/products/sim-luxury-sofa | Out-Null
}

$resWarm = Run-K6Test -ModeName 'moderate' -RunLabel "cache_warm_run"
if ($resWarm) { $results += [PSCustomObject]@{ Scenario = "Warm Cache (20 VU)"; RPS = $resWarm.rps; p50 = $resWarm.p50_ms; p95 = $resWarm.p95_ms; p99 = $resWarm.p99_ms; Errors = "$($resWarm.fail_rate_pct)%"; AssertFails = $resWarm.assertion_failures } }

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " MATRIX COMPLETE: RESULTS SUMMARY " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize

# Export summary table to JSON
$results | ConvertTo-Json -Depth 4 | Out-File -FilePath "${OutputDir}/matrix_summary.json" -Encoding utf8
Write-Host "`nResults saved to: ${OutputDir}" -ForegroundColor Green
