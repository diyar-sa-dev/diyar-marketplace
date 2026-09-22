#Requires -Version 5.1
param(
    [string]$BaselineDir = ''
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $BaselineDir) {
    $BaselineDir = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase19-search-performance/baseline/baseline'
}
$cpuDir = Join-Path $BaselineDir 'cpu'
$out = Join-Path (Split-Path $BaselineDir -Parent) '../final/correlation-table.json'
$out = [System.IO.Path]::GetFullPath($out)
New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null

function Parse-DockerCpu([string]$pct) {
    if ($pct -match '([\d.]+)') { return [double]$Matches[1] }
    return $null
}

function Avg-SamplerCpu([string]$jsonl, [string]$containerSuffix) {
    if (-not (Test-Path $jsonl)) { return $null }
    $vals = @()
    Get-Content $jsonl | ForEach-Object {
        $row = $_ | ConvertFrom-Json
        foreach ($d in $row.docker) {
            if ($d.name -match $containerSuffix) {
                $c = Parse-DockerCpu $d.cpu
                if ($null -ne $c) { $vals += $c }
            }
        }
    }
    if ($vals.Count -eq 0) { return $null }
    return [math]::Round(($vals | Measure-Object -Average).Average, 2)
}

$rows = @()
Get-ChildItem $BaselineDir -Filter 'summary-rps*-run*.json' | Sort-Object Name | ForEach-Object {
    $s = Get-Content $_.FullName -Raw | ConvertFrom-Json
    $run = if ($_.Name -match 'run(\d+)') { $Matches[1] } else { '1' }
    $prof = $s.profile
    $samFile = Join-Path $cpuDir "sampler-${prof}-run${run}.jsonl"
    $rows += [ordered]@{
        file = $_.Name
        rps_target = $s.requested_rps
        rps_achieved = [math]::Round($s.rps, 2)
        p50_ms = [math]::Round($s.p50_ms, 2)
        p95_ms = [math]::Round($s.p95_ms, 2)
        p99_ms = [math]::Round($s.p99_ms, 2)
        search_p95_ms = [math]::Round($s.search_p95_ms, 2)
        http_429 = $s.http_429
        http_5xx = $s.http_5xx
        app_cpu_avg_pct = Avg-SamplerCpu $samFile '-app-1'
        redis_cpu_avg_pct = Avg-SamplerCpu $samFile '-redis-1'
        mysql_cpu_avg_pct = Avg-SamplerCpu $samFile '-mysql-1'
        queue_cpu_avg_pct = Avg-SamplerCpu $samFile 'queue-default'
        sampler = if (Test-Path $samFile) { 'yes' } else { 'no' }
    }
}

@{
    generated_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    baseline_dir = $BaselineDir
    rows = $rows
} | ConvertTo-Json -Depth 6 | Set-Content $out -Encoding utf8
Write-Host "Correlation -> $out"
