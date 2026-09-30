#Requires -Version 5.1
<#
.SYNOPSIS
  Stage 26.9 Post-Optimization Measurement Probe across Search, Listing, and Detail
#>
param(
    [string]$BaseUrl = 'http://127.0.0.1:8193/api/v1',
    [string]$OutputPath = 'conception/Stages/Stage 26/Phase 26.9 - Advanced Search/Phase 26.9.2 - Search Query/optimized-probes-10k.json'
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

function Probe-Url([string]$Url) {
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

# Warmup
for ($i = 1; $i -le 3; $i++) {
    curl.exe -sf -o NUL "$BaseUrl/products?per_page=12"
    curl.exe -sf -o NUL "$BaseUrl/products?q=chair"
}

$endpoints = @(
    # Listing & Pagination
    "$BaseUrl/products?per_page=12",
    "$BaseUrl/products?per_page=12&page=20",
    "$BaseUrl/products?per_page=12&sort=price",
    "$BaseUrl/products?per_page=12&sort=-price",
    # English Search
    "$BaseUrl/products?q=sofa",
    "$BaseUrl/products?q=chair",
    "$BaseUrl/products?q=table",
    "$BaseUrl/products?q=cha",
    # Arabic Search
    "$BaseUrl/products?q=%D8%B7%D8%A7%D9%88%D9%84%D8%A9", # طاولة
    "$BaseUrl/products?q=%D9%83%D8%B1%D8%B3%D9%8A",       # كرسي
    "$BaseUrl/products?q=%D9%83%D9%86%D8%A8",         # كنب
    "$BaseUrl/products?q=%D8%B7%D8%A7%D9%88",         # طاو (partial)
    # Filtered Search
    "$BaseUrl/products?q=chair&min_price=500&max_price=2000",
    # Unified Catalog Search
    "$BaseUrl/catalog/search?q=chair&type=products",
    "$BaseUrl/catalog/search?q=%D8%B7%D8%A7%D9%88%D9%84%D8%A9&type=products"
)

# Fetch a sample product ID for detail endpoint
$sampleId = (curl.exe -s "$BaseUrl/products?per_page=1" | ConvertFrom-Json).data.items[0].id
if ($sampleId) {
    $endpoints += "$BaseUrl/products/$sampleId"
}

$results = @()
foreach ($ep in $endpoints) {
    # Run 3 probes and take the median
    $runs = @()
    for ($r = 1; $r -le 3; $r++) {
        $runs += (Probe-Url $ep).duration_ms
        Start-Sleep -Milliseconds 50
    }
    $sorted = $runs | Sort-Object
    $median = $sorted[1]
    $probe = Probe-Url $ep
    $probe.duration_ms = $median

    $results += [PSCustomObject]@{
        endpoint = ($ep -replace [regex]::Escape($BaseUrl), '')
        median_ms = $median
        http_code = $probe.http_code
        size_bytes = $probe.size_bytes
    }
}

$results | Format-Table -AutoSize
$targetFile = Join-Path $Root $OutputPath
$targetDir = Split-Path $targetFile -Parent
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}
$results | ConvertTo-Json -Depth 4 | Set-Content $targetFile -Encoding utf8
Write-Host "Results saved to: $targetFile"
