#Requires -Version 5.1
# Serial vs parallel nginx→Octane search latency (micro vs macro reconciliation helper).
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Out = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase19-search-performance/octane/concurrent-curl-probe.json'
New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null

$url = 'http://127.0.0.1:8193/api/v1/catalog/search?q=sofa&type=all&per_page=12&product_page=1&service_page=1'
$hdr = @('-H', 'Accept: application/json', '-H', 'Accept-Language: ar')

function Measure-Curls([int]$n, [int]$parallelism) {
    $times = @()
    if ($parallelism -le 1) {
        for ($i = 0; $i -lt $n; $i++) {
            $raw = curl.exe -s -o NUL -w '%{time_connect},%{time_starttransfer},%{time_total}' @hdr $url
            $p = $raw -split ','
            $times += [ordered]@{ connect_ms = [math]::Round([double]$p[0]*1000,2); ttfb_ms = [math]::Round([double]$p[1]*1000,2); total_ms = [math]::Round([double]$p[2]*1000,2) }
        }
    } else {
        $jobs = @()
        $perJob = [math]::Ceiling($n / $parallelism)
        for ($j = 1; $j -le $parallelism; $j++) {
            $jobs += Start-Job -ScriptBlock {
                param($u, $count)
                $out = @()
                for ($i = 0; $i -lt $count; $i++) {
                    $raw = curl.exe -s -o NUL -w '%{time_connect},%{time_starttransfer},%{time_total}' -H 'Accept: application/json' -H 'Accept-Language: ar' $u
                    $p = $raw -split ','
                    $out += [pscustomobject]@{ total_ms = [double]$p[2]*1000; ttfb_ms = [double]$p[1]*1000 }
                }
                $out
            } -ArgumentList @($url, $perJob)
        }
        $jobs | Wait-Job | Out-Null
        $times = @($jobs | Receive-Job | ForEach-Object { $_ }) | ForEach-Object {
            [ordered]@{ connect_ms = $null; ttfb_ms = [math]::Round($_.ttfb_ms,2); total_ms = [math]::Round($_.total_ms,2) }
        }
        $jobs | Remove-Job -Force
    }
    $totals = $times | ForEach-Object { $_.total_ms } | Sort-Object
    $p95i = [int][math]::Floor($totals.Count * 0.95)
    return @{
        n = $times.Count
        parallel = $parallelism
        p50_ms = [math]::Round($totals[[int][math]::Floor($totals.Count * 0.5)], 2)
        p95_ms = [math]::Round($totals[[math]::Min($p95i, $totals.Count-1)], 2)
        max_ms = [math]::Round($totals[-1], 2)
    }
}

# Warm cache first
1..40 | ForEach-Object { curl.exe -s -o NUL @hdr $url | Out-Null }

@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    url = $url
    serial_30 = Measure-Curls -n 30 -parallel 1
    parallel_8x8 = Measure-Curls -n 64 -parallel 8
    parallel_16x8 = Measure-Curls -n 128 -parallel 16
    note = 'If p95 rises sharply with parallel while serial stays low, worker queueing/contention is supported.'
} | ConvertTo-Json -Depth 5 | Set-Content $Out -Encoding utf8
Write-Host "Octane probe -> $Out"
