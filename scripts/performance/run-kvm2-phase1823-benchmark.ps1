#Requires -Version 5.1
param(
    [string]$Label = 'post-optimization',
    [int]$Replicates = 3
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root
$Out = Join-Path $Root "backend/storage/certification/kvm2-equivalent/phase18-2-3-search-analytics-async/performance/$Label"
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$compose = @('-p','diyar-kvm2-test','-f','docker-compose.production.yml','-f','docker-compose.production.octane.yml','-f','docker-compose.kvm2-test.yml','-f','docker-compose.kvm2-test.k6.yml','--env-file','deploy/docker/kvm2-test.env')
$env:OCTANE_WORKERS = '2'
$sampler = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'

function Invoke-Profile {
    param([string]$Profile, [string]$Workload, [string]$Script, [string]$Suffix, [switch]$Sample)
    $leaf = ($Out.Substring($kvm2Root.Length).TrimStart('\','/') -replace '\\','/')
    $sam = $null
    if ($Sample -and (Test-Path $sampler)) {
        $sam = Start-Process powershell -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$sampler,'-Profile',"${Profile}-${Suffix}",'-OutDir',(Join-Path $Out 'cpu-samples'),'-IntervalMs','1000') -PassThru -WindowStyle Hidden
        Start-Sleep 2
    }
    docker compose @compose --profile k6 run --rm -e "PROFILE=$Profile" -e "WORKLOAD=$Workload" -e "STAGE_DURATION=90s" -e "REPORT_DIR=$leaf" -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" k6 run $Script | Out-Null
    if ($sam) { Stop-Process -Id $sam.Id -Force -ErrorAction SilentlyContinue }
    $src = Join-Path $Out "summary-$Profile.json"
    if (Test-Path $src) {
        $dest = Join-Path $Out "summary-${Profile}-run${Suffix}.json"
        Copy-Item $src $dest -Force
        return Get-Content $dest -Raw | ConvertFrom-Json
    }
    return $null
}

$results = @()
foreach ($r in @('rps125','rps150','rps200')) {
    for ($i = 1; $i -le $Replicates; $i++) {
        $row = Invoke-Profile -Profile $r -Workload 'mixed' -Script '/scripts/kvm2-phase2-diagnostics.js' -Suffix $i -Sample:($r -eq 'rps150')
        if ($row) { $results += $row; Write-Host "$Label $r run $i p95=$([math]::Round($row.p95_ms,1))" -ForegroundColor Gray }
    }
}
Invoke-Profile -Profile 'rps150' -Workload 'search' -Script '/scripts/kvm2-phase2-diagnostics.js' -Suffix 'search-once' | Out-Null

@{
    label = $Label
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    results = $results
} | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Out 'campaign.json') -Encoding utf8
Write-Host "Benchmark $Label -> $Out" -ForegroundColor Green
