#Requires -Version 5.1
# Isolated workloads at rps150 (single 90s stage each) — run when baseline not using k6.
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root
$Out = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase19-search-performance/traffic/workload-matrix'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$leaf = ($Out.Substring($kvm2Root.Length).TrimStart('\','/') -replace '\\','/')
$compose = @('-p','diyar-kvm2-test','-f','docker-compose.production.yml','-f','docker-compose.production.octane.yml','-f','docker-compose.kvm2-test.yml','-f','docker-compose.kvm2-test.k6.yml','--env-file','deploy/docker/kvm2-test.env')

$workloads = @('mixed','search','products','detail','health')
$results = @()
foreach ($w in $workloads) {
    docker compose @compose --profile k6 run --rm -e 'PROFILE=rps150' -e "WORKLOAD=$w" -e 'STAGE_DURATION=90s' -e "REPORT_DIR=$leaf" -e 'FRONTEND_ORIGIN=http://127.0.0.1:8193' k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null
    $src = Join-Path $Out 'summary-rps150.json'
    if (Test-Path $src) {
        $dest = Join-Path $Out "summary-rps150-$w.json"
        Copy-Item $src $dest -Force
        $results += Get-Content $dest -Raw | ConvertFrom-Json
        Write-Host "workload $w p95=$([math]::Round((Get-Content $dest | ConvertFrom-Json).p95_ms,1))"
    }
}
@{ captured_at_utc = (Get-Date).ToUniversalTime().ToString('o'); results = $results } | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $Out 'campaign.json') -Encoding utf8
