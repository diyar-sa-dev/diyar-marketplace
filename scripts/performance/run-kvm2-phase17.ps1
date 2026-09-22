#Requires -Version 5.1
param(
    [switch]$RebuildApp,
    [switch]$SkipRecreate,
    [string]$Stage = 'baseline',
    [string[]]$Profiles
)

$ReportsDir = "backend/storage/certification/kvm2-equivalent/phase17-octane-php-cpu/$Stage"
$params = @{
    ReportsDir = $ReportsDir
    OctaneWorkers = 2
}
if ($RebuildApp) { $params.RebuildApp = $true }
if ($SkipRecreate) { $params.SkipRecreate = $true }
if ($Profiles) { $params.Profiles = $Profiles }
& "$PSScriptRoot/run-kvm2-phase15.ps1" @params
