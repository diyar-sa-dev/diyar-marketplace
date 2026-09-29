#Requires -Version 5.1
<#
.SYNOPSIS
  Phase 20.2 Catalog Cardinality Scaling Runner (12 -> 1,000 -> 10,000 products)
  Measures query execution plans, individual endpoint latencies, and 150 RPS sustained load
  across scaling catalog sizes in the KVM2-equivalent envelope.
#>
param(
    [int[]]$Scales = @(12, 1000, 10000),
    [string]$StageDuration = '45s'
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$PhaseRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase20-cardinality'
New-Item -ItemType Directory -Force -Path $PhaseRoot | Out-Null

$Project = 'diyar-kvm2-test'
$compose = @('-p', $Project, '-f', 'docker-compose.production.yml', '-f', 'docker-compose.production.octane.yml', '-f', 'docker-compose.kvm2-test.yml', '-f', 'docker-compose.kvm2-test.k6.yml', '--env-file', 'deploy/docker/kvm2-test.env')

function Invoke-MysqlCmd([string]$Sql) {
    docker exec -e MYSQL_PWD=kvm2_test_db_secret "${Project}-mysql-1" mysql -udiyar diyar_kvm2_test -N -e $Sql 2>$null
}

function Start-SamplerJob([string]$Label, [string]$OutFolder, [int]$DurationSeconds = 60) {
    $samplerScript = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$samplerScript`" -Profile `"$Label`" -OutDir `"$OutFolder`" -IntervalMs 1000 -DurationSeconds $DurationSeconds"
    $job = Start-Process powershell -ArgumentList $argList -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 2
    return $job
}

function Measure-Endpoint([string]$Url) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $res = curl.exe -s -w '%{http_code}|%{size_download}' -o NUL $Url
    $sw.Stop()
    $parts = $res -split '\|'
    return [ordered]@{
        url = $Url
        duration_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
        http_code = [int]$parts[0]
        size_bytes = [int]$parts[1]
    }
}

$allScaleResults = @()

foreach ($scale in $Scales) {
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host " PHASE 20.2: TESTING CARDINALITY SCALE: $scale PRODUCTS" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan

    $scaleDir = Join-Path $PhaseRoot "scale-$scale"
    New-Item -ItemType Directory -Force -Path $scaleDir | Out-Null

    # 1. Set intended cardinality
    Write-Host "[CARDINALITY] Setting catalog size to $scale..." -ForegroundColor Yellow
    $genStart = Get-Date
    if ($scale -eq 12) {
        docker exec "${Project}-app-1" php artisan perf:cardinality clean | Out-Null
    } else {
        docker exec "${Project}-app-1" php artisan perf:cardinality set --count=$scale | Out-Null
    }
    $genDuration = [math]::Round(((Get-Date) - $genStart).TotalSeconds, 2)

    # 2. Record table counts and sizes
    $prodCount = (Invoke-MysqlCmd "SELECT count(*) FROM products;").Trim()
    $invCount = (Invoke-MysqlCmd "SELECT count(*) FROM product_inventory;").Trim()
    $sizeSql = "SELECT round(((data_length + index_length) / 1024 / 1024), 2) FROM information_schema.tables WHERE table_schema='diyar_kvm2_test' AND table_name='products';"
    $tableSizeMb = (Invoke-MysqlCmd $sizeSql).Trim()

    Write-Host "[CARDINALITY] Verified in DB: products=$prodCount, inventory=$invCount, size=${tableSizeMb}MB (set in ${genDuration}s)" -ForegroundColor Green

    # Warmup
    for ($w = 1; $w -le 5; $w++) {
        curl.exe -sf -o NUL 'http://127.0.0.1:8193/api/v1/products?per_page=12'
        curl.exe -sf -o NUL 'http://127.0.0.1:8193/api/v1/search?q=sofa'
    }

    # 3. Capture EXPLAIN queries
    Write-Host "[CARDINALITY] Capturing SQL EXPLAIN query plans..." -ForegroundColor Yellow
    $explainListing = Invoke-MysqlCmd "EXPLAIN SELECT * FROM products WHERE status='active' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 12;"
    $explainSearch = Invoke-MysqlCmd "EXPLAIN SELECT * FROM products WHERE MATCH(name, description) AGAINST('sofa' IN BOOLEAN MODE) AND status='active' AND deleted_at IS NULL LIMIT 12;"
    $explainFilter = Invoke-MysqlCmd "EXPLAIN SELECT * FROM products WHERE status='active' AND deleted_at IS NULL AND sale_price BETWEEN 500 AND 2000 ORDER BY sale_price ASC LIMIT 12;"
    
    $sqlPlans = @{
        scale = $scale
        listing_plan = $explainListing
        search_plan = $explainSearch
        filter_plan = $explainFilter
    }
    $sqlPlans | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $scaleDir 'sql-explain.json') -Encoding utf8

    # 4. Measure Cardinality Benchmark Matrix (Individual Endpoints)
    Write-Host "[CARDINALITY] Probing individual endpoint matrix..." -ForegroundColor Yellow
    $sampleProduct = docker exec "${Project}-app-1" php artisan tinker --execute="echo App\Models\Product::query()->publiclyVisible()->first()?->id;" 2>$null
    $sampleProduct = "$sampleProduct".Trim()

    $lastPage = [math]::Max(1, [math]::Ceiling([int]$prodCount / 12))
    $midPage = [math]::Max(1, [math]::Floor($lastPage / 2))

    $matrixProbes = @(
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/products?per_page=12"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/products?per_page=12&page=$midPage"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/products?per_page=12&page=$lastPage"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/products?per_page=12&sort=price_asc"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/products?per_page=12&sort=price_desc"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/products?per_page=12&min_price=500&max_price=2000"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/search?q=sofa"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/search?q=chair"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/search?q=table"),
        (Measure-Endpoint "http://127.0.0.1:8193/api/v1/products/$sampleProduct")
    )
    $matrixProbes | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $scaleDir 'matrix-probes.json') -Encoding utf8

    # 5. Measure Sustained Mixed Load via k6 at 150 RPS
    Write-Host "[CARDINALITY] Running sustained 150 RPS mixed benchmark with 1s resource telemetry..." -ForegroundColor Yellow
    $samplerJob = Start-SamplerJob -Label "scale-${scale}-rps150" -OutFolder $scaleDir -DurationSeconds 65
    $leaf = "phase20-cardinality/scale-$scale"

    docker compose @compose --profile k6 run --rm `
        -e "PROFILE=rps150" `
        -e "WORKLOAD=mixed" `
        -e "STAGE_DURATION=$StageDuration" `
        -e "REPORT_DIR=$leaf" `
        -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" `
        k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null

    if ($samplerJob) {
        Stop-Process -Id $samplerJob.Id -Force -ErrorAction SilentlyContinue
    }

    $k6SummaryFile = Join-Path $scaleDir 'summary-rps150.json'
    $k6Data = $null
    if (Test-Path $k6SummaryFile) {
        $k6Data = Get-Content $k6SummaryFile -Raw | ConvertFrom-Json
        Write-Host "  -> Sustained 150 RPS Result: p95=$([math]::Round($k6Data.p95_ms, 1))ms search_p95=$([math]::Round($k6Data.search_p95_ms, 1))ms error_rate=$($k6Data.error_rate)" -ForegroundColor Green
    }

    $scaleRecord = [ordered]@{
        scale = $scale
        actual_products = [int]$prodCount
        inventory_records = [int]$invCount
        table_size_mb = [double]$tableSizeMb
        generation_duration_sec = $genDuration
        probes = $matrixProbes
        k6_sustained_rps150 = $k6Data
    }
    $allScaleResults += $scaleRecord
    $scaleRecord | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $scaleDir 'scale-summary.json') -Encoding utf8
}

# 6. Revert to baseline 12 products cleanly
Write-Host "`n[CARDINALITY] Reverting to baseline 12 products..." -ForegroundColor Yellow
docker exec "${Project}-app-1" php artisan perf:cardinality clean | Out-Null

$campaignRecord = [ordered]@{
    phase = "20.2-cardinality-scaling"
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    envelope = "LOCAL KVM2-EQUIVALENT (2-vCPU cpuset 0-1, 2 Octane workers)"
    hostinger = "NOT VERIFIED"
    scales_tested = $Scales
    results = $allScaleResults
}
$campaignRecord | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $PhaseRoot 'cardinality-campaign.json') -Encoding utf8
Write-Host "`n[PHASE 20.2] Complete! Summary -> $(Join-Path $PhaseRoot 'cardinality-campaign.json')" -ForegroundColor Green
