#Requires -Version 5.1
<#
.SYNOPSIS
  Sample Docker / MySQL / Redis / Nginx / Octane WHILE k6 is running.
  Writes JSONL to backend/storage/certification/kvm2-equivalent/phase1-2/sampler-<profile>.jsonl
#>
param(
    [Parameter(Mandatory = $true)][string]$Profile,
    [string]$OutDir,
    [int]$IntervalMs = 2000,
    [int]$DurationSeconds = 0
)

$ErrorActionPreference = 'Continue'
$Project = 'diyar-kvm2-test'
if (-not $OutDir) {
    $Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
    $OutDir = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase1-2'
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$outFile = Join-Path $OutDir "sampler-$Profile.jsonl"
if (Test-Path $outFile) { Remove-Item $outFile -Force }

function Invoke-Mysql([string]$Sql) {
    docker exec "${Project}-mysql-1" mysql -udiyar -pkvm2_test_db_secret -N -e $Sql 2>$null
}

function Get-MysqlMap([string]$Like) {
    $map = @{}
    $raw = Invoke-Mysql "SHOW GLOBAL STATUS LIKE '$Like';"
    if (-not $raw) { return $map }
    foreach ($line in ($raw -split "`n")) {
        $parts = $line.Trim() -split '\s+', 2
        if ($parts.Count -eq 2) { $map[$parts[0]] = $parts[1] }
    }
    return $map
}

$deadline = $null
if ($DurationSeconds -gt 0) {
    $deadline = (Get-Date).AddSeconds($DurationSeconds)
}

while ($true) {
    if ($deadline -and (Get-Date) -ge $deadline) { break }
    $ts = (Get-Date).ToUniversalTime().ToString('o')
    $row = [ordered]@{ ts = $ts; profile = $Profile }

    $stats = docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}" 2>$null |
        Where-Object { $_ -match $Project }
    $row.docker = @($stats | ForEach-Object {
        $p = $_ -split '\|'
        [ordered]@{ name = $p[0]; cpu = $p[1]; mem = $p[2]; mem_pct = $p[3]; net = $p[4]; block = $p[5] }
    })

    $st = Get-MysqlMap 'Threads_%'
    $qs = Get-MysqlMap 'Questions'
    $sl = Get-MysqlMap 'Slow_queries'
    $lk = Get-MysqlMap 'Innodb_row_lock_waits'
    $tmp = Get-MysqlMap 'Created_tmp_disk_tables'
    $bpr = Get-MysqlMap 'Innodb_buffer_pool_reads'
    $bpreq = Get-MysqlMap 'Innodb_buffer_pool_read_requests'
    $tc = Get-MysqlMap 'Threads_connected'
    $row.mysql = [ordered]@{
        threads_connected = $st['Threads_connected']
        threads_running   = $st['Threads_running']
        questions         = $qs['Questions']
        slow_queries      = $sl['Slow_queries']
        lock_waits        = $lk['Innodb_row_lock_waits']
        tmp_disk_tables   = $tmp['Created_tmp_disk_tables']
        bp_reads          = $bpr['Innodb_buffer_pool_reads']
        bp_read_requests  = $bpreq['Innodb_buffer_pool_read_requests']
    }

    $pl = Invoke-Mysql "SELECT COUNT(*) FROM information_schema.processlist WHERE COMMAND <> 'Sleep';"
    $row.mysql.processlist_active = ("$pl".Trim())

    $redis = docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret INFO 2>$null
    $ri = @{}
    foreach ($line in ($redis -split "`n")) {
        if ($line -match '^(used_memory_human|used_memory_peak_human|connected_clients|instantaneous_ops_per_sec|blocked_clients|evicted_keys|expired_keys|mem_fragmentation_ratio):(.+)$') {
            $ri[$Matches[1]] = $Matches[2].Trim()
        }
    }
    $row.redis = $ri

    $ngx = docker exec "${Project}-nginx-1" wget -qO- http://127.0.0.1/nginx_status 2>$null
    $row.nginx_status = ("$ngx".Trim() -replace "`r",'')

    $oct = docker exec "${Project}-app-1" php artisan octane:status --no-ansi 2>$null
    $row.octane_status = ("$oct".Trim() -replace "`r",'')
    $workers = docker exec "${Project}-app-1" sh -c "ps aux | grep -E 'octane|swoole' | grep -v grep | wc -l" 2>$null
    $row.octane_procs = ("$workers".Trim())

    $qdepth = docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret LLEN "${Project}-database-queues:default" 2>$null
    if ("$qdepth" -match '^\d+$') { $row.queue_default_depth = [int]"$qdepth" }

    $row | ConvertTo-Json -Compress -Depth 6 | Out-File -FilePath $outFile -Append -Encoding utf8
    Start-Sleep -Milliseconds $IntervalMs
}
