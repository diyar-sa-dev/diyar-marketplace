#Requires -Version 5.1
# Phase 18.1 — SPX capture validation (guest search, guest detail, nginx path).
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$OutRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase18-1-saturation-profiling'
$triggerOut = Join-Path $OutRoot 'profiling/triggers'
$spxOut = Join-Path $OutRoot 'profiling/spx'
foreach ($d in @($OutRoot, $triggerOut, $spxOut, (Join-Path $OutRoot 'environment'), (Join-Path $OutRoot 'face1'))) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

& (Join-Path $PSScriptRoot 'kvm2-spx.ps1') -Action enable | Out-Null
docker exec diyar-kvm2-test-app-1 bash -c 'rm -rf /tmp/spx-data/* 2>/dev/null; mkdir -p /tmp/spx-data'

$spxCookie = 'SPX_ENABLED=1; SPX_KEY=dev; SPX_AUTO_START=1; SPX_REPORT=full'
$base = 'http://127.0.0.1:8193/api/v1'
$headers = @{
    Accept = 'application/json'
    'Accept-Language' = 'ar'
    Cookie = $spxCookie
}

$tests = @(
    @{
        name = 'guest-search-nginx'
        url = "$base/catalog/search?q=sofa&type=all&per_page=12&product_page=1&service_page=1&SPX_KEY=dev&SPX_ENABLED=1&SPX_AUTO_START=1&SPX_REPORT=full"
    },
    @{
        name = 'guest-detail-nginx'
        url = "$base/products?per_page=1&SPX_KEY=dev&SPX_ENABLED=1&SPX_AUTO_START=1&SPX_REPORT=full"
    },
    @{
        name = 'guest-search-cookie-only'
        url = "$base/catalog/search?q=bedroom&type=all&per_page=12&product_page=1&service_page=1"
    }
)

$results = @()
foreach ($t in $tests) {
    $h = $headers.Clone()
    if ($t.name -eq 'guest-search-cookie-only') { } else { $h.Remove('Cookie'); $h['Cookie'] = $spxCookie }
    $code = curl.exe -s -o NUL -w '%{http_code}' --max-time 60 -H "Accept: application/json" -H "Accept-Language: ar" -H "Cookie: $($h.Cookie)" "$($t.url)"
    Start-Sleep -Seconds 1
    $files = docker exec diyar-kvm2-test-app-1 bash -c 'ls -1 /tmp/spx-data 2>/dev/null'
    $fileList = @("$files" -split "`n" | Where-Object { $_.Trim() })
    $results += [ordered]@{
        test = $t.name
        http_code = $code
        spx_files_after = $fileList.Count
        spx_files = $fileList
    }
}

docker cp (Join-Path $Root 'backend/storage/certification/kvm2-spx-kernel-profile.php') diyar-kvm2-test-app-1:/var/www/html/storage/certification/ | Out-Null
docker exec diyar-kvm2-test-app-1 bash -c 'rm -rf /tmp/spx-data/*; SPX_ENABLED=1 SPX_AUTO_START=1 SPX_REPORT=full SPX_KEY=dev php /var/www/html/storage/certification/kvm2-spx-kernel-profile.php >/dev/null'
$latest = docker exec diyar-kvm2-test-app-1 bash -c 'ls -t /tmp/spx-data 2>/dev/null | head -1'
if ($latest -and $latest.Trim()) {
    $src = "/tmp/spx-data/$($latest.Trim())"
    docker cp "diyar-kvm2-test-app-1:${src}" (Join-Path $spxOut "validate-$($latest.Trim())") 2>$null
}

@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    spx_cookie = $spxCookie
    tests = $results
    pipeline_proven = ($results | Where-Object { $_.spx_files_after -gt 0 }).Count -ge 1
    kernel_cli_pipeline_proven = ($null -ne $latest -and $latest.Trim() -ne '')
} | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $triggerOut 'spx-validation.json') -Encoding utf8

& (Join-Path $PSScriptRoot 'kvm2-spx.ps1') -Action disable | Out-Null
$val = Get-Content (Join-Path $triggerOut 'spx-validation.json') -Raw | ConvertFrom-Json
if (-not $val.kernel_cli_pipeline_proven) {
    Write-Warning 'SPX Octane HTTP + kernel CLI validation incomplete — see spx-validation.json'
    exit 1
}
Write-Host "SPX validation OK: $triggerOut/spx-validation.json" -ForegroundColor Green
