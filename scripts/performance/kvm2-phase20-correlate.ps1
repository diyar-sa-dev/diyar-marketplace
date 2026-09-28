#Requires -Version 5.1
param(
    [string]$EvidenceDir = "backend/storage/certification/kvm2-equivalent/phase20-clean-runtime"
)

$campaignPath = Join-Path $EvidenceDir "baseline/clean-baseline/campaign.json"
if (-not (Test-Path $campaignPath)) {
    Write-Error "Campaign file not found at $campaignPath"
    exit 1
}

$campaign = Get-Content $campaignPath -Raw | ConvertFrom-Json
$cpuDir = Join-Path $EvidenceDir "cpu"

$correlationRows = @()

foreach ($run in $campaign.results) {
    $prof = $run.profile
    $work = $run.workload
    # Find matching sampler
    $samplerPattern = "sampler-${prof}-${work}-run*.jsonl"
    $samplers = Get-ChildItem -Path $cpuDir -Filter $samplerPattern

    $row = [ordered]@{
        profile = $prof
        workload = $work
        requested_rps = $run.requested_rps
        achieved_rps = [math]::Round($run.rps, 1)
        p50_ms = [math]::Round($run.p50_ms, 2)
        p90_ms = [math]::Round($run.p90_ms, 2)
        p95_ms = [math]::Round($run.p95_ms, 2)
        p99_ms = [math]::Round($run.p99_ms, 2)
        max_ms = [math]::Round($run.max_ms, 2)
        search_p95_ms = [math]::Round($run.search_p95_ms, 2)
        products_p95_ms = [math]::Round($run.products_p95_ms, 2)
        detail_p95_ms = [math]::Round($run.detail_p95_ms, 2)
        error_rate = $run.error_rate
        http_429 = $run.http_429
        http_5xx = $run.http_5xx
        vus_max = $run.vus_max
        iterations = $run.iterations
    }

    $correlationRows += [PSCustomObject]$row
}

# Also process isolated runs
foreach ($iso in @('search', 'products', 'detail')) {
    $isoFile = Join-Path $EvidenceDir "baseline/clean-baseline/summary-rps150-runiso-$iso.json"
    if (Test-Path $isoFile) {
        $run = Get-Content $isoFile -Raw | ConvertFrom-Json
        $row = [ordered]@{
            profile = "rps150-iso"
            workload = $iso
            requested_rps = $run.requested_rps
            achieved_rps = [math]::Round($run.rps, 1)
            p50_ms = [math]::Round($run.p50_ms, 2)
            p90_ms = [math]::Round($run.p90_ms, 2)
            p95_ms = [math]::Round($run.p95_ms, 2)
            p99_ms = [math]::Round($run.p99_ms, 2)
            max_ms = [math]::Round($run.max_ms, 2)
            search_p95_ms = [math]::Round($run.search_p95_ms, 2)
            products_p95_ms = [math]::Round($run.products_p95_ms, 2)
            detail_p95_ms = [math]::Round($run.detail_p95_ms, 2)
            error_rate = $run.error_rate
            http_429 = $run.http_429
            http_5xx = $run.http_5xx
            vus_max = $run.vus_max
            iterations = $run.iterations
        }
        $correlationRows += [PSCustomObject]$row
    }
}

$correlationRows | Format-Table -AutoSize
$correlationRows | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $EvidenceDir "baseline/correlation-summary.json") -Encoding utf8
