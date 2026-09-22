#Requires -Version 5.1
param(
    [switch]$SaturationOnly,
    [switch]$SpxOnly,
    [object]$Rates = @(100, 125, 150, 175, 200)
)
if ($Rates -is [string]) {
    $Rates = @($Rates -split '[,\s]+' | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ })
}
if ($Rates -isnot [array]) { $Rates = @([int]$Rates) }

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root
$Phase = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase18-1-saturation-profiling'
$sub = @('environment','saturation','cpu','profiling/spx','profiling/triggers','statistics','face1','face2','final')
foreach ($s in $sub) { New-Item -ItemType Directory -Force -Path (Join-Path $Phase $s) | Out-Null }

$Project = 'diyar-kvm2-test'
$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$compose = @('-p',$Project,'-f','docker-compose.production.yml','-f','docker-compose.production.octane.yml','-f','docker-compose.kvm2-test.yml','-f','docker-compose.kvm2-test.k6.yml','--env-file','deploy/docker/kvm2-test.env')
$env:OCTANE_WORKERS = '2'
$sampler = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'

function Save-Env {
    $app = "${Project}-app-1"
    [ordered]@{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        git_head = (git rev-parse HEAD)
        octane_workers = '2'
        php = (docker exec $app php -r 'echo PHP_VERSION;')
        laravel = (docker exec $app php artisan --version --no-ansi 2>$null)
        swoole = (docker exec $app php -r 'echo phpversion("swoole");' 2>$null)
    } | ConvertTo-Json | Set-Content (Join-Path $Phase 'environment/runtime-snapshot.json') -Encoding utf8
}

function Invoke-MixedRps {
    param([int]$Rate, [switch]$Sample)
    $profile = "rps$Rate"
    $dir = Join-Path $Phase "saturation/$profile"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $leaf = ($dir.Substring($kvm2Root.Length).TrimStart('\','/') -replace '\\','/')
    $sam = $null
    if ($Sample -and (Test-Path $sampler)) {
        $sam = Start-Process powershell -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$sampler,'-Profile',$profile,'-OutDir',(Join-Path $Phase 'cpu'),'-IntervalMs','1000') -PassThru -WindowStyle Hidden
        Start-Sleep 2
    }
    docker compose @compose --profile k6 run --rm -e "PROFILE=$profile" -e "WORKLOAD=mixed" -e "STAGE_DURATION=90s" -e "REPORT_DIR=$leaf" -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null
    if ($sam) { Stop-Process -Id $sam.Id -Force -ErrorAction SilentlyContinue }
    $src = Join-Path $dir "summary-$profile.json"
    if (Test-Path $src) { return Get-Content $src -Raw | ConvertFrom-Json }
    return $null
}

function Invoke-SpxWarm {
    param([string]$Label, [string]$Path = '')
    docker cp (Join-Path $Root 'backend/storage/certification/kvm2-spx-kernel-profile-warm.php') "${Project}-app-1:/var/www/html/storage/certification/" | Out-Null
    $outFile = Join-Path $Phase "profiling/spx/fp-$Label.txt"
    if ($Path) {
        docker exec "${Project}-app-1" sh -c "printf '%s' '$($Path -replace "'", "'\\''")' > /tmp/kvm2_profile_path"
        docker exec -e KVM2_WARM_ITERATIONS=10 "${Project}-app-1" sh -c 'export KVM2_PROFILE_PATH=$(cat /tmp/kvm2_profile_path); SPX_ENABLED=1 SPX_AUTO_START=0 SPX_REPORT=fp SPX_KEY=dev php /var/www/html/storage/certification/kvm2-spx-kernel-profile-warm.php' 2>&1 | Set-Content $outFile -Encoding utf8
    } else {
        docker exec -e KVM2_WARM_ITERATIONS=10 "${Project}-app-1" sh -c 'SPX_ENABLED=1 SPX_AUTO_START=0 SPX_REPORT=fp SPX_KEY=dev php /var/www/html/storage/certification/kvm2-spx-kernel-profile-warm.php' 2>&1 | Set-Content $outFile -Encoding utf8
    }
    docker exec "${Project}-app-1" sh -c 'rm -rf /tmp/spx-data/*' | Out-Null
}

Save-Env
& (Join-Path $PSScriptRoot 'kvm2-spx.ps1') -Action enable | Out-Null

if (-not $SpxOnly) {
    $rows = @()
    foreach ($r in $Rates) {
        $sample = $r -ge 150
        $row = Invoke-MixedRps -Rate $r -Sample:$sample
        if ($row) {
            $rows += [ordered]@{
                rps_target = $r
                rps_achieved = [math]::Round($row.rps, 1)
                p95_ms = [math]::Round($row.p95_ms, 1)
                p99_ms = [math]::Round($row.p99_ms, 1)
                search_p95_ms = [math]::Round($row.search_p95_ms, 1)
                products_p95_ms = [math]::Round($row.products_p95_ms, 1)
                detail_p95_ms = [math]::Round($row.detail_p95_ms, 1)
                http_5xx = $row.http_5xx
            }
            Write-Host "rps$r p95=$([math]::Round($row.p95_ms,1)) ms achieved=$([math]::Round($row.rps,1))" -ForegroundColor Gray
        }
    }
    $rows | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $Phase 'statistics/saturation-summary.json') -Encoding utf8
}

if (-not $SaturationOnly) {
    Invoke-SpxWarm -Label 'search-warm'
    Invoke-SpxWarm -Label 'products-warm' -Path '/api/v1/products?per_page=12'
    Invoke-SpxWarm -Label 'health-warm' -Path '/api/v1/health/live'
}

& (Join-Path $PSScriptRoot 'kvm2-spx.ps1') -Action disable | Out-Null
Write-Host "Phase 18.1 evidence: $Phase" -ForegroundColor Green
