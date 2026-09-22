#Requires -Version 5.1
<#
  Phase 18 — baseline + 3× critical RPS + sampler. Profiling (SPX) separate step.
  Does not commit. Reports under phase18-php-cpu-profiling/
#>
param(
    [switch]$SkipRecreate,
    [switch]$BaselineOnly,
    [switch]$CriticalOnly,
    [int]$Replicates = 3
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$PhaseRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase18-php-cpu-profiling'
$subdirs = @(
    'environment','baseline','profiling','cpu-samples','rps100','rps125','rps150','rps200',
    'detail','search','listing','authenticated','analytics','middleware','optimization',
    'regression','security','face2','final'
)
foreach ($d in $subdirs) { New-Item -ItemType Directory -Force -Path (Join-Path $PhaseRoot $d) | Out-Null }

$Project = 'diyar-kvm2-test'
$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$compose = @(
    '-p', $Project,
    '-f', 'docker-compose.production.yml',
    '-f', 'docker-compose.production.octane.yml',
    '-f', 'docker-compose.kvm2-test.yml',
    '-f', 'docker-compose.kvm2-test.k6.yml',
    '--env-file', 'deploy/docker/kvm2-test.env'
)
$env:OCTANE_WORKERS = '2'
$samplerPath = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'

function Save-Environment {
    $out = Join-Path $PhaseRoot 'environment'
    $app = "${Project}-app-1"
    $cert = [ordered]@{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        git_head = (git rev-parse HEAD)
        octane_workers = $env:OCTANE_WORKERS
        docker_ncpu = (docker info --format '{{.NCPU}}')
        docker_server_version = (docker version --format '{{.Server.Version}}' 2>$null)
        containers = @{}
    }
    docker ps --filter "name=$Project" --format '{{.Names}}' | ForEach-Object {
        $cert.containers[$_] = [ordered]@{
            id = (docker inspect $_ --format '{{.Id}}')
            image = (docker inspect $_ --format '{{.Image}}')
            cpuset = (docker inspect $_ --format '{{.HostConfig.CpusetCpus}}')
            nano_cpus = (docker inspect $_ --format '{{.HostConfig.NanoCpus}}')
            memory = (docker inspect $_ --format '{{.HostConfig.Memory}}')
            status = (docker inspect $_ --format '{{.State.Status}}')
        }
    }
    try {
        $cert.php_version = (docker exec $app php -r 'echo PHP_VERSION;')
        $cert.laravel = (docker exec $app php artisan --version --no-ansi 2>$null)
        $cert.octane_status = (docker exec $app php artisan octane:status --no-ansi 2>$null)
        $cert.redis_version = (docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret INFO server 2>$null | Select-String 'redis_version')
        $cert.mysql_version = (docker exec "${Project}-mysql-1" mysql -udiyar -pkvm2_test_db_secret -N -e 'SELECT VERSION();' 2>$null)
        $cert.public_products = (docker exec $app php artisan tinker --execute="echo \App\Models\Product::query()->where('status','published')->where('visibility','public')->count();" 2>$null).ToString().Trim()
    } catch {}
    $cert | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $out 'runtime-snapshot.json') -Encoding utf8
    docker inspect $app | Set-Content (Join-Path $out 'docker-inspect-app.json') -Encoding utf8
}

function Assert-Envelope {
    $healthUrl = 'http://127.0.0.1:8193/api/v1/health/live'
    $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 15
    if ($r.StatusCode -lt 200 -or $r.StatusCode -ge 300) { throw "Health not OK: $($r.StatusCode)" }
    $appCpu = docker inspect "${Project}-app-1" --format '{{.HostConfig.CpusetCpus}}'
    if ($appCpu -notmatch '0-1|0,1') { throw "App cpuset expected 0-1, got: $appCpu" }
    $workers = docker exec "${Project}-app-1" printenv OCTANE_WORKERS 2>$null
    if ("$workers".Trim() -ne '2') { throw "OCTANE_WORKERS must be 2, got: $workers" }
    $failed = docker exec "${Project}-app-1" php artisan tinker --execute="echo \DB::table('failed_jobs')->count();" 2>$null
    $failed = ("$failed".Trim() -replace '\D', '')
    if ($failed -ne '' -and $failed -ne '0') { throw "failed_jobs=$failed" }
}

function Invoke-K6 {
    param(
        [string]$Profile,
        [string]$Workload,
        [string]$OutSubDir,
        [string]$Script = '/scripts/kvm2-phase2-diagnostics.js',
        [string]$Suffix = '',
        [switch]$Sample,
        [int]$SampleIntervalMs = 1000
    )
    $out = Join-Path $PhaseRoot $OutSubDir
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    $leaf = ($out.Substring($kvm2Root.Length).TrimStart('\','/') -replace '\\','/')

    $sampler = $null
    if ($Sample -and (Test-Path $samplerPath)) {
        $sampler = Start-Process powershell -ArgumentList @(
            '-NoProfile','-ExecutionPolicy','Bypass',
            '-File', $samplerPath,
            '-Profile', "${Profile}${Suffix}",
            '-OutDir', (Join-Path $PhaseRoot 'cpu-samples'),
            '-IntervalMs', "$SampleIntervalMs"
        ) -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }

    docker compose @compose --profile k6 run --rm `
        -e "PROFILE=$Profile" `
        -e "WORKLOAD=$Workload" `
        -e "STAGE_DURATION=90s" `
        -e "REPORT_DIR=$leaf" `
        -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" `
        -e "K6_SESSION_BASE=http://nginx" `
        k6 run $Script | Out-Null

    if ($sampler -and -not $sampler.HasExited) { Stop-Process -Id $sampler.Id -Force -ErrorAction SilentlyContinue }

    $base = "summary-$Profile"
    if ($Suffix) { $base = "summary-${Profile}-run${Suffix}" }
    $dest = Join-Path $out "$base.json"
    $src = Join-Path $out "summary-$Profile.json"
    if (Test-Path $src) {
        Copy-Item $src $dest -Force
        if ($Suffix) { Remove-Item $src -Force -ErrorAction SilentlyContinue }
    }
    if (Test-Path $dest) { return Get-Content $dest -Raw | ConvertFrom-Json }
    return $null
}

function Write-Stats {
    param([string]$Name, [array]$Rows, [string]$OutDir)
    $p95s = @($Rows | ForEach-Object { [double]$_.p95_ms })
    if ($p95s.Count -eq 0) { return }
    $sorted = $p95s | Sort-Object
    $mean = ($p95s | Measure-Object -Average).Average
    $variance = if ($p95s.Count -gt 1) {
        ($p95s | ForEach-Object { ($_ - $mean) * ($_ - $mean) } | Measure-Object -Sum).Sum / ($p95s.Count - 1)
    } else { 0 }
    [ordered]@{
        profile = $Name
        n = $p95s.Count
        p95_min = ($p95s | Measure-Object -Minimum).Minimum
        p95_max = ($p95s | Measure-Object -Maximum).Maximum
        p95_mean = [math]::Round($mean, 2)
        p95_median = [math]::Round($sorted[[int][math]::Floor(($sorted.Count - 1) / 2)], 2)
        p95_stdev = [math]::Round([math]::Sqrt($variance), 2)
        p95_range = [math]::Round(($p95s | Measure-Object -Maximum).Maximum - ($p95s | Measure-Object -Minimum).Minimum, 2)
        runs = $Rows
    } | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $OutDir "statistics-$Name.json") -Encoding utf8
}

if (-not $SkipRecreate) {
    docker compose @compose up -d mysql redis app nginx queue-critical queue-default | Out-Null
    Assert-Envelope
}
Save-Environment

$all = @()

if (-not $CriticalOnly) {
    Write-Host '=== Phase 18 baseline (single run each) ===' -ForegroundColor Cyan
    $baselinePlan = @(
        @{ p = 'detail-guest'; w = 'detail-guest'; d = 'detail'; s = '/scripts/kvm2-phase15-diagnostics.js' },
        @{ p = 'vu50'; w = 'detail'; d = 'detail'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'detail-auth'; w = 'detail-auth'; d = 'authenticated'; s = '/scripts/kvm2-phase15-diagnostics.js' },
        @{ p = 'detail-auth-vu50'; w = 'detail-auth'; d = 'authenticated'; s = '/scripts/kvm2-phase15-diagnostics.js' },
        @{ p = 'vu25'; w = 'search'; d = 'search'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'vu50'; w = 'search'; d = 'search'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'rps100'; w = 'search'; d = 'search'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'rps150'; w = 'search'; d = 'search'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'vu25'; w = 'products'; d = 'listing'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'vu50'; w = 'products'; d = 'listing'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'rps100'; w = 'products'; d = 'listing'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'rps150'; w = 'products'; d = 'listing'; s = '/scripts/kvm2-phase2-diagnostics.js' },
        @{ p = 'mix-realistic'; w = 'mix-realistic'; d = 'baseline'; s = '/scripts/kvm2-phase15-diagnostics.js' },
        @{ p = 'rps100'; w = 'mixed'; d = 'baseline'; s = '/scripts/kvm2-phase2-diagnostics.js' }
    )
    foreach ($item in $baselinePlan) {
        $r = Invoke-K6 -Profile $item.p -Workload $item.w -OutSubDir $item.d -Script $item.s
        if ($r) { $all += $r; Write-Host "$($item.d)/$($item.p) p95=$([math]::Round($r.p95_ms,1)) ms" -ForegroundColor Gray }
    }
}

if ($BaselineOnly) {
    Write-Host "Baseline-only complete: $PhaseRoot" -ForegroundColor Green
    exit 0
}

Write-Host "=== Phase 18 critical RPS ${Replicates}x + sampler ===" -ForegroundColor Cyan
foreach ($rate in @('rps125','rps150','rps200')) {
    $dir = $rate
    $rows = @()
    for ($i = 1; $i -le $Replicates; $i++) {
        $sample = ($rate -eq 'rps150')
        $r = Invoke-K6 -Profile $rate -Workload 'mixed' -OutSubDir $dir -Suffix $i -Sample:$sample
        if ($r) {
            $rows += $r
            Write-Host "$rate run $i p95=$([math]::Round($r.p95_ms,1)) ms 5xx=$($r.http_5xx)" -ForegroundColor Gray
        }
    }
    Write-Stats -Name $rate -Rows $rows -OutDir (Join-Path $PhaseRoot $dir)
    $all += $rows
}

@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    phase = 18
    profiles = $all
} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $PhaseRoot 'final/campaign-partial.json') -Encoding utf8

Write-Host "Phase 18 measurement written under $PhaseRoot" -ForegroundColor Green
