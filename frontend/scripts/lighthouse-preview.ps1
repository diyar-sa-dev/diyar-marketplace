#Requires -Version 5.1
<#
.SYNOPSIS
  Run Lighthouse against the production preview build (not Vite dev).

.EXAMPLE
  .\scripts\lighthouse-preview.ps1
  .\scripts\lighthouse-preview.ps1 -Port 3002
#>
param(
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "Building production bundle..." -ForegroundColor Cyan
npm run build | Out-Null

$preview = Start-Process powershell -PassThru -WindowStyle Hidden -ArgumentList @(
    '-NoProfile',
    '-Command',
    "Set-Location '$Root'; npm run preview"
)

try {
    Start-Sleep -Seconds 4
    $url = "http://127.0.0.1:$Port/"
    Write-Host "Auditing $url (use Incognito in Chrome for manual runs)..." -ForegroundColor Cyan

    npx --yes lighthouse $url `
        --only-categories=performance,accessibility,best-practices,seo `
        --chrome-flags="--headless --disable-extensions" `
        --output=html `
        --output-path=./lighthouse-report.html `
        --view

    Write-Host "Report: $Root\lighthouse-report.html" -ForegroundColor Green
}
finally {
    if ($preview -and -not $preview.HasExited) {
        Stop-Process -Id $preview.Id -Force -ErrorAction SilentlyContinue
    }
}
