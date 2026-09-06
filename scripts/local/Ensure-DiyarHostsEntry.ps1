#Requires -Version 5.1
<#
.SYNOPSIS
  Ensures 127.0.0.1 diyar.local exists in the Windows hosts file.

.NOTES
  Run once as Administrator if diyar.local does not resolve.
#>

param(
    [string]$Hostname = 'diyar.local',
    [string]$Ip = '127.0.0.1'
)

$ErrorActionPreference = 'Stop'
$hostsPath = Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'
$marker = "# DIYAR local dev"
$entryLine = "$Ip $Hostname $marker"

if (-not (Test-Path $hostsPath)) {
    throw "Hosts file not found: $hostsPath"
}

$content = Get-Content $hostsPath -ErrorAction Stop
$pattern = [regex]::Escape($Hostname)

foreach ($line in $content) {
    if ($line -match "\s$pattern(\s|$)" -and $line -notmatch '^\s*#') {
        Write-Host "Hosts OK — $Hostname already mapped."
        return
    }
}

try {
    Add-Content -Path $hostsPath -Value $entryLine -Encoding ascii
    Write-Host "Added hosts entry: $entryLine"
} catch {
    Write-Warning @"
Could not write hosts file (Admin required). Add manually:

  $entryLine

File: $hostsPath
"@
}
