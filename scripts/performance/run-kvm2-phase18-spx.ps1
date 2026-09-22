#Requires -Version 5.1
# Enable SPX in running app container, run isolated search load, export report metadata.
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root
$Out = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase18-php-cpu-profiling/profiling'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$ini = Join-Path $Root 'backend/docker/spx.ini'
docker cp $ini diyar-kvm2-test-app-1:/usr/local/etc/php/conf.d/99-spx.ini
docker exec -u root diyar-kvm2-test-app-1 bash -c 'mkdir -p /tmp/spx-data && chmod 777 /tmp/spx-data'
docker compose -p diyar-kvm2-test -f docker-compose.production.yml -f docker-compose.production.octane.yml -f docker-compose.kvm2-test.yml --env-file deploy/docker/kvm2-test.env restart app nginx | Out-Null
Start-Sleep 20
$mods = docker exec diyar-kvm2-test-app-1 php -m 2>&1
if ("$mods" -notmatch 'spx') { throw 'SPX extension not loaded after restart' }

$leaf = 'phase18-php-cpu-profiling/profiling'
docker compose -p diyar-kvm2-test -f docker-compose.production.yml -f docker-compose.production.octane.yml -f docker-compose.kvm2-test.yml -f docker-compose.kvm2-test.k6.yml --env-file deploy/docker/kvm2-test.env --profile k6 run --rm `
    -e "PROFILE=rps100" -e "WORKLOAD=search" -e "STAGE_DURATION=60s" -e "REPORT_DIR=$leaf" `
    -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null

$reports = docker exec diyar-kvm2-test-app-1 sh -c 'ls -1 /tmp/spx-data 2>/dev/null | head -20'
[ordered]@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    spx_loaded = $true
    workload = 'search rps100 60s'
    spx_data_files = @("$reports" -split "`n" | Where-Object { $_.Trim() })
    note = 'SPX with Octane/Swoole may aggregate per-worker reports; inspect /tmp/spx-data in app container or SPX UI on port 8000 if exposed.'
} | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $Out 'spx-search-rps100-session.json') -Encoding utf8

docker exec diyar-kvm2-test-app-1 rm -f /usr/local/etc/php/conf.d/99-spx.ini 2>$null
docker compose -p diyar-kvm2-test -f docker-compose.production.yml -f docker-compose.production.octane.yml -f docker-compose.kvm2-test.yml --env-file deploy/docker/kvm2-test.env restart app nginx | Out-Null
Write-Host "SPX session metadata: $Out/spx-search-rps100-session.json" -ForegroundColor Green
