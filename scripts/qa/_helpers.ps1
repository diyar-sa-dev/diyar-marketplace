$ErrorActionPreference = 'Stop'

function Initialize-QaContext {
    param([string]$Tier)

    $Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
    $Timestamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
    $EvidenceBase = Join-Path $Root 'conception\Stages\Stage 28\Phase 28.16 - Enterprise Platform QA\_raw'
    $EvidenceDir = Join-Path $EvidenceBase $Timestamp
    New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

    return [ordered]@{
        Root        = $Root
        Backend     = Join-Path $Root 'backend'
        Frontend    = Join-Path $Root 'frontend'
        Tier        = $Tier
        Timestamp   = $Timestamp
        EvidenceDir = $EvidenceDir
    }
}

function Write-QaHeader {
    param($Ctx)
    Write-Host ''
    Write-Host 'DIYAR Platform Certification' -ForegroundColor Cyan
    Write-Host "Tier: $($Ctx.Tier)"
    Write-Host "Evidence: $($Ctx.EvidenceDir)"
    Write-Host ''
}

function Test-PortOpen {
    param(
        [string]$TargetHost = '127.0.0.1',
        [int]$Port
    )
    return (Test-NetConnection $TargetHost -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
}

function Wait-ForHttp {
    param(
        [string]$Url,
        [int]$TimeoutSec = 60,
        [switch]$Quiet
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    if (-not $Quiet) {
        throw "Timeout waiting for $Url"
    }
    return $false
}
