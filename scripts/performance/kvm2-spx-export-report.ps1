#Requires -Version 5.1
param(
    [string]$OutDir,
    [string]$Label = 'export'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $OutDir) {
    $OutDir = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase18-1-saturation-profiling/profiling/spx'
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$latest = docker exec diyar-kvm2-test-app-1 bash -c 'ls -t /tmp/spx-data 2>/dev/null | head -1'
if (-not $latest -or -not $latest.Trim()) { return $null }
$name = $latest.Trim()
docker cp "diyar-kvm2-test-app-1:/tmp/spx-data/$name" (Join-Path $OutDir "$Label-$name")
return (Join-Path $OutDir "$Label-$name")
