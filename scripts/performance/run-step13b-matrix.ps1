#Requires -Version 5.1
<#
.SYNOPSIS
  Step 13B Benchmark Matrix Runner (FPM vs Octane).
  Runs Smoke (5 VU), Moderate (20 VU), and Saturation on identical targets and captures metrics.
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('fpm', 'octane')]
    [string]$Target
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$OutputDir = Join-Path $Root "backend/storage/certification/step13b/$Target"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "=== Starting Step 13B Benchmark Matrix for Target: $Target ===" -ForegroundColor Cyan

# 1. Warmup (20 requests)
Write-Host "--- Warmup ---" -ForegroundColor Yellow
1..10 | ForEach-Object {
    Invoke-WebRequest -Uri "http://localhost:8092/api/v1/health" -UseBasicParsing | Out-Null
    Invoke-WebRequest -Uri "http://localhost:8092/api/v1/products?per_page=12" -UseBasicParsing | Out-Null
}

$modes = @('smoke', 'moderate', 'saturation')

foreach ($mode in $modes) {
    Write-Host "`n--- Running Mode: $mode ($Target) ---" -ForegroundColor Yellow

    # Start CPU/RAM sampler job
    $statsJob = Start-Job -ScriptBlock {
        param($prefix)
        $samples = @()
        for ($i = 0; $i -lt 30; $i++) {
            $raw = docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"
            $samples += $raw
            Start-Sleep -Seconds 1
        }
        return $samples
    }

    # Run k6 container
    $k6Cmd = "docker run --rm --network diyar-vps-sim_backend -v `"${Root}/scripts/performance:/scripts`" -e BASE_URL=http://nginx/api/v1 -e MODE=$mode grafana/k6 run /scripts/step13b-benchmark.js 2>&1"
    $k6Output = Invoke-Expression $k6Cmd

    # Wait for sampler
    Stop-Job $statsJob | Out-Null
    $statsData = Receive-Job $statsJob
    Remove-Job $statsJob | Out-Null

    # Parse and save k6 json
    $jsonMatch = ($k6Output -join "`n") | Select-String -Pattern '\{[\s\S]*"mode":[\s\S]*\}'
    if ($jsonMatch) {
        $jsonStr = $jsonMatch.Matches[0].Value
        $resultFile = Join-Path $OutputDir "k6-$mode.json"
        $jsonStr | Out-File -FilePath $resultFile -Encoding utf8
        Write-Host "k6 Result for $mode saved to $resultFile" -ForegroundColor Green
        Write-Host $jsonStr -ForegroundColor White
    } else {
        Write-Warning "Could not parse JSON output for $mode. Raw output logged."
        ($k6Output -join "`n") | Out-File -FilePath (Join-Path $OutputDir "k6-$mode.raw.txt") -Encoding utf8
    }

    # Save stats
    $statsFile = Join-Path $OutputDir "stats-$mode.txt"
    $statsData | Out-File -FilePath $statsFile -Encoding utf8
    Write-Host "Docker stats saved to $statsFile" -ForegroundColor Green

    Start-Sleep -Seconds 3
}

Write-Host "`n=== Benchmark Matrix Completed for $Target ===" -ForegroundColor Cyan
