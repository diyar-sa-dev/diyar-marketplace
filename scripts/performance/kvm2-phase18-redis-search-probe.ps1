#Requires -Version 5.1
# Count Redis commands during a single guest catalog search (supporting evidence for 01b).
$ErrorActionPreference = 'Stop'
$Project = 'diyar-kvm2-test'
$Out = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) 'backend/storage/certification/kvm2-equivalent/phase18-php-cpu-profiling/profiling'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$monitor = Start-Job -ScriptBlock {
    param($Project)
    docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret MONITOR 2>$null
} -ArgumentList $Project

Start-Sleep -Seconds 1
curl.exe -s -o NUL -w "%{http_code}" --max-time 30 `
    -H "Accept: application/json" -H "Accept-Language: ar" `
    "http://127.0.0.1:8193/api/v1/catalog/search?q=sofa&type=all&per_page=12&product_page=1&service_page=1" | Out-Null
Start-Sleep -Seconds 2
Stop-Job $monitor -ErrorAction SilentlyContinue
$lines = Receive-Job $monitor
Remove-Job $monitor -Force -ErrorAction SilentlyContinue

$gets = @($lines | Where-Object { $_ -match '"GET"' })
$versionGets = @($gets | Where-Object { $_ -match 'catalog.*version|CATALOG_VERSION' -or $_ -match ':version' })
[ordered]@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    monitor_lines = $lines.Count
    redis_get_total = $gets.Count
    redis_get_version_like = $versionGets.Count
    sample_gets = @($gets | Select-Object -First 15)
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $Out 'redis-search-single-request-probe.json') -Encoding utf8
Write-Host "Probe written: redis GET total=$($gets.Count)" -ForegroundColor Green
