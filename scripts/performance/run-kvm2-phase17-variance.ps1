#Requires -Version 5.1
<#
  Phase 17.2 — variance resolution: replicate runs + paired control/optimized (rps150).
  Does not commit. Preserves Phase 15/17 evidence.
#>
param(
    [switch]$SkipRebuild,
    [switch]$PairedOnly,
    [int]$Replicates = 3
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$VarRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase17-octane-php-cpu/variance-resolution'
$dirs = @('environment','control','optimization','paired','samplers','statistics','regression','face2','final')
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $VarRoot $d) | Out-Null
}

$searchSvc = Join-Path $Root 'backend/app/Services/Catalog/CatalogSearchService.php'
$authMw = Join-Path $Root 'backend/app/Http/Middleware/EnsureCleanAuthState.php'
$backupDir = Join-Path $VarRoot 'environment/code-backup-optimized'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $searchSvc (Join-Path $backupDir 'CatalogSearchService.php') -Force
Copy-Item $authMw (Join-Path $backupDir 'EnsureCleanAuthState.php') -Force

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}
Write-Utf8NoBom (Join-Path $VarRoot 'control/CatalogSearchService.pre-opt01.php') (git show HEAD:backend/app/Services/Catalog/CatalogSearchService.php)
Write-Utf8NoBom (Join-Path $VarRoot 'control/EnsureCleanAuthState.pre-opt01.php') (git show HEAD:backend/app/Http/Middleware/EnsureCleanAuthState.php)

$compose = @(
    '-p', 'diyar-kvm2-test',
    '-f', 'docker-compose.production.yml',
    '-f', 'docker-compose.production.octane.yml',
    '-f', 'docker-compose.kvm2-test.yml',
    '-f', 'docker-compose.kvm2-test.k6.yml',
    '--env-file', 'deploy/docker/kvm2-test.env'
)
$env:OCTANE_WORKERS = '2'

function Save-EnvSnapshot {
    param([string]$Out)
    $snap = [ordered]@{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        octane_workers = (docker exec diyar-kvm2-test-app-1 printenv OCTANE_WORKERS 2>$null)
        app_cpuset = (docker inspect diyar-kvm2-test-app-1 --format '{{.HostConfig.CpusetCpus}}' 2>$null)
        app_image = (docker inspect diyar-kvm2-test-app-1 --format '{{.Image}}' 2>$null)
        git_head = (git rev-parse HEAD)
    }
    $snap | ConvertTo-Json | Set-Content (Join-Path $Out 'environment-snapshot.json') -Encoding utf8
}

function Restore-OptimizedCode {
    Copy-Item (Join-Path $backupDir 'CatalogSearchService.php') $searchSvc -Force
    Copy-Item (Join-Path $backupDir 'EnsureCleanAuthState.php') $authMw -Force
}

function Restore-ControlCode {
    Copy-Item (Join-Path $VarRoot 'control/CatalogSearchService.pre-opt01.php') $searchSvc -Force
    Copy-Item (Join-Path $VarRoot 'control/EnsureCleanAuthState.pre-opt01.php') $authMw -Force
}

function Rebuild-App {
    if ($SkipRebuild) { return }
    docker compose @compose build app queue-critical queue-default | Out-Null
    docker compose @compose up -d --force-recreate --no-deps app queue-critical queue-default nginx | Out-Null
    docker compose @compose restart nginx | Out-Null
    $healthUrl = 'http://127.0.0.1:8193/api/v1/health/live'
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { return }
        } catch {
            try {
                docker exec diyar-kvm2-test-app-1 wget -qO- --timeout=3 http://127.0.0.1:8000/api/v1/health/live 2>$null | Out-Null
                if ($LASTEXITCODE -eq 0) { return }
            } catch { }
            Start-Sleep -Seconds 3
        }
    }
    throw 'Health check failed after rebuild'
}

function Invoke-K6Profile {
    param(
        [string]$Profile,
        [string]$OutSubDir,
        [string]$Suffix,
        [switch]$Sample
    )
    $out = Join-Path $VarRoot $OutSubDir
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    $kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
    $leaf = ($out.Substring($kvm2Root.Length).TrimStart('\','/') -replace '\\','/')

    $sampler = $null
    if ($Sample) {
        $samplerPath = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'
        $sampler = Start-Process powershell -ArgumentList @(
            '-NoProfile','-ExecutionPolicy','Bypass',
            '-File', $samplerPath,
            '-Profile', "${Profile}-${Suffix}",
            '-OutDir', $out,
            '-IntervalMs', '1000'
        ) -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }

    $script = if ($Profile -match '^(detail-auth|search)$') { '/scripts/kvm2-phase15-diagnostics.js' } else { '/scripts/kvm2-phase2-diagnostics.js' }
    $workload = if ($Profile -eq 'search') { 'search' } elseif ($Profile -match '^detail-auth') { 'detail-auth' } else { 'mixed' }
    $k6Profile = if ($Profile -eq 'detail-auth') { 'detail-auth' } else { $Profile }

    docker compose @compose --profile k6 run --rm `
        -e "PROFILE=$k6Profile" `
        -e "WORKLOAD=$workload" `
        -e "STAGE_DURATION=90s" `
        -e "REPORT_DIR=$leaf" `
        -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" `
        -e "K6_SESSION_BASE=http://nginx" `
        k6 run $script | Out-Null

    if ($sampler -and -not $sampler.HasExited) { Stop-Process -Id $sampler.Id -Force -ErrorAction SilentlyContinue }

    $dest = Join-Path $out "summary-${Profile}-run${Suffix}.json"
    $src = Join-Path $out "summary-$k6Profile.json"
    if (-not (Test-Path $src)) { $src = Join-Path $out "summary-$Profile.json" }
    if (Test-Path $src) { Copy-Item $src $dest -Force; Remove-Item $src -Force -ErrorAction SilentlyContinue }
    Get-Content $dest -Raw | ConvertFrom-Json
}

Save-EnvSnapshot -Out (Join-Path $VarRoot 'environment')

$allResults = @()

if (-not $PairedOnly) {
    Write-Host '=== Phase 17.2: optimized replicates (3x) ===' -ForegroundColor Cyan
    Restore-OptimizedCode
    Rebuild-App

    foreach ($profile in @('rps100','rps125','rps150')) {
        for ($i = 1; $i -le $Replicates; $i++) {
            $sample = ($profile -eq 'rps150')
            $r = Invoke-K6Profile -Profile $profile -OutSubDir 'optimization' -Suffix $i -Sample:$sample
            $r | Add-Member -NotePropertyName variant -NotePropertyValue 'optimized' -Force
            $r | Add-Member -NotePropertyName run -NotePropertyValue $i -Force
            $allResults += $r
            Write-Host "$profile run $i p95=$([math]::Round($r.p95_ms,1)) ms" -ForegroundColor Gray
        }
    }
} else {
    Write-Host '=== Phase 17.2: paired only (skipping replicates) ===' -ForegroundColor Cyan
    $prior = Join-Path $VarRoot 'statistics/variance-summary.json'
    if (Test-Path $prior) {
        $parsed = Get-Content $prior -Raw | ConvertFrom-Json
        if ($parsed.optimized_replicates) { Write-Host 'Prior replicate stats loaded from variance-summary.json' -ForegroundColor Gray }
    }
}

Write-Host '=== Phase 17.2: paired control/optimized rps150 ===' -ForegroundColor Cyan
for ($i = 1; $i -le $Replicates; $i++) {
    Restore-ControlCode
    Rebuild-App
    $rc = Invoke-K6Profile -Profile 'rps150' -OutSubDir 'paired' -Suffix "control-$i" -Sample
    $rc | Add-Member -NotePropertyName variant -NotePropertyValue 'control-pre-opt01' -Force
    $rc | Add-Member -NotePropertyName run -NotePropertyValue $i -Force
    $allResults += $rc
    Write-Host "control rps150 run $i p95=$([math]::Round($rc.p95_ms,1)) ms" -ForegroundColor Yellow

    Restore-OptimizedCode
    Rebuild-App
    $ro = Invoke-K6Profile -Profile 'rps150' -OutSubDir 'paired' -Suffix "optimized-$i" -Sample
    $ro | Add-Member -NotePropertyName variant -NotePropertyValue 'optimized' -Force
    $ro | Add-Member -NotePropertyName run -NotePropertyValue $i -Force
    $allResults += $ro
    Write-Host "optimized rps150 run $i p95=$([math]::Round($ro.p95_ms,1)) ms" -ForegroundColor Green
}

Restore-OptimizedCode
Rebuild-App

$stats = $allResults | Group-Object profile, variant | ForEach-Object {
    $p95s = $_.Group | ForEach-Object { [double]$_.p95_ms }
    [ordered]@{
        profile = $_.Group[0].profile
        variant = $_.Group[0].variant
        n = $p95s.Count
        p95_min = ($p95s | Measure-Object -Minimum).Minimum
        p95_max = ($p95s | Measure-Object -Maximum).Maximum
        p95_mean = [math]::Round(($p95s | Measure-Object -Average).Average, 2)
        p95_median = [math]::Round(($p95s | Sort-Object)[[int][math]::Floor($p95s.Count / 2)], 2)
    }
}

@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    results = $allResults
    statistics = $stats
} | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $VarRoot 'statistics/variance-summary.json') -Encoding utf8

Write-Host "Variance resolution written to $VarRoot" -ForegroundColor Green
