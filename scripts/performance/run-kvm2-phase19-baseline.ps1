#Requires -Version 5.1
param(
    [string]$Label = 'baseline',
    [int]$Replicates = 3,
    [switch]$IncludeRps100
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root
$PhaseRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase19-search-performance'
$Out = Join-Path $PhaseRoot "baseline/$Label"
New-Item -ItemType Directory -Force -Path (Join-Path $Out 'cpu') | Out-Null
$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$compose = @('-p','diyar-kvm2-test','-f','docker-compose.production.yml','-f','docker-compose.production.octane.yml','-f','docker-compose.kvm2-test.yml','-f','docker-compose.kvm2-test.k6.yml','--env-file','deploy/docker/kvm2-test.env')
$env:OCTANE_WORKERS = '2'
$sampler = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'

function Invoke-Profile {
    param([string]$Profile, [string]$Workload, [string]$Suffix, [switch]$Sample)
    $leaf = ($Out.Substring($kvm2Root.Length).TrimStart('\','/') -replace '\\','/')
    $sam = $null
    if ($Sample -and (Test-Path $sampler)) {
        $cpuDir = Join-Path $Out 'cpu'
        $sam = Start-Process powershell -ArgumentList @(
            '-NoProfile','-ExecutionPolicy','Bypass','-File',$sampler,
            '-Profile',"${Profile}-run${Suffix}",
            '-OutDir',$cpuDir,
            '-IntervalMs','1000',
            '-DurationSeconds','95'
        ) -PassThru -WindowStyle Hidden
        Start-Sleep 2
    }
    docker compose @compose --profile k6 run --rm -e "PROFILE=$Profile" -e "WORKLOAD=$Workload" -e "STAGE_DURATION=90s" -e "REPORT_DIR=$leaf" -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null
    if ($sam) { Stop-Process -Id $sam.Id -Force -ErrorAction SilentlyContinue }
    $src = Join-Path $Out "summary-$Profile.json"
    if (Test-Path $src) {
        $dest = Join-Path $Out "summary-${Profile}-run${Suffix}.json"
        Copy-Item $src $dest -Force
        return Get-Content $dest -Raw | ConvertFrom-Json
    }
    return $null
}

$rates = @('rps125','rps150','rps175','rps200')
if ($IncludeRps100) { $rates = @('rps100') + $rates }

$results = @()
foreach ($r in $rates) {
    for ($i = 1; $i -le $Replicates; $i++) {
        $sample = ($r -eq 'rps150' -or $r -eq 'rps175') -and ($i -eq 2)
        $row = Invoke-Profile -Profile $r -Workload 'mixed' -Suffix $i -Sample:$sample
        if ($row) {
            $results += $row
            Write-Host "$Label $r run $i p95=$([math]::Round($row.p95_ms,1)) search_p95=$([math]::Round($row.search_p95_ms,1))" -ForegroundColor Gray
        }
    }
}

foreach ($w in @('search','products','detail')) {
    Invoke-Profile -Profile 'rps150' -Workload $w -Suffix "iso-$w" | Out-Null
}

@{
    label = $Label
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    results = $results
} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $Out 'campaign.json') -Encoding utf8
Write-Host "Phase 19 baseline -> $Out" -ForegroundColor Green
