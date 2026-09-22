#Requires -Version 5.1
# Compare nginx→Octane search latency with analytics sync measurement samples.
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Out = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase18-2-3-search-analytics-async/octane-proof'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

docker exec diyar-kvm2-test-app-1 sh -c 'rm -f storage/logs/kvm2-search-analytics-sync.jsonl'

$urls = @{
    with_q = 'http://127.0.0.1:8193/api/v1/catalog/search?q=sofa&type=all&per_page=12&product_page=1&service_page=1'
    no_q = 'http://127.0.0.1:8193/api/v1/catalog/search?type=all&per_page=12&product_page=1&service_page=1'
}

$rows = @()
foreach ($name in $urls.Keys) {
    $times = @()
    for ($i = 0; $i -lt 30; $i++) {
        $ms = curl.exe -s -o NUL -w '%{time_total}' --max-time 30 -H 'Accept: application/json' -H 'Accept-Language: ar' $urls[$name]
        $times += [double]$ms * 1000
    }
    $sorted = $times | Sort-Object
    $rows += [ordered]@{
        profile = $name
        n = $times.Count
        p50_ms = [math]::Round($sorted[[int][math]::Floor($sorted.Count * 0.5)], 2)
        p95_ms = [math]::Round($sorted[[int][math]::Floor($sorted.Count * 0.95)], 2)
        mean_ms = [math]::Round(($times | Measure-Object -Average).Average, 2)
    }
}

$syncLines = docker exec diyar-kvm2-test-app-1 sh -c 'test -f storage/logs/kvm2-search-analytics-sync.jsonl && wc -l storage/logs/kvm2-search-analytics-sync.jsonl || echo 0'
@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    note = 'Post-async: sync jsonl should stay empty on HTTP path; worker writes via job.'
    curl_nginx_octane = $rows
    sync_jsonl_lines = "$syncLines".Trim()
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $Out 'nginx-search-latency-sample.json') -Encoding utf8
