# One-shot infra snapshot for diyar-kvm2-test (run during/after load)
$Project = 'diyar-kvm2-test'
$Out = Join-Path $PSScriptRoot 'infra-snapshot.json'
$redisPass = (Get-Content (Join-Path (Split-Path $PSScriptRoot -Parent -Parent -Parent -Parent) 'deploy/docker/kvm2-test.env') | Where-Object { $_ -match '^REDIS_PASSWORD=' }) -replace '^REDIS_PASSWORD=', ''
$stats = docker stats --no-stream --format '{{json .}}' | ForEach-Object { $_ | ConvertFrom-Json } | Where-Object { $_.Name -like "$Project*" }
$mysql = docker exec "${Project}-mysql-1" mysqladmin -uroot -p$( (Get-Content (Join-Path (Split-Path $PSScriptRoot -Parent -Parent -Parent -Parent) 'deploy/docker/kvm2-test.env') | Where-Object { $_ -match '^MYSQL_ROOT_PASSWORD=' }) -replace '^MYSQL_ROOT_PASSWORD=', '') status 2>$null
$redisInfo = docker exec "${Project}-redis-1" redis-cli -a $redisPass INFO memory 2>$null
@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    docker_stats = $stats
    mysqladmin_status = $mysql
    redis_memory = ($redisInfo | Select-String 'used_memory_human|maxmemory')
} | ConvertTo-Json -Depth 6 | Set-Content $Out -Encoding utf8
Write-Host "Wrote $Out"
