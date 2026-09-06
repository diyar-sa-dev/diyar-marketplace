#Requires -Version 5.1
<#
.SYNOPSIS
  Writes stable local URLs into deploy/docker/production.env.

.DESCRIPTION
  Uses a fixed hostname (default diyar.local) — no Wi‑Fi IP auto-detect.
  Open http://diyar.local:8080 via scripts/local/start-dev-gateway.ps1.

  Override hostname only if needed: DIYAR_GATEWAY_HOST=mydiyar.local
#>

function Read-EnvMap {
    param([string]$Path)

    $map = [ordered]@{}
    if (-not (Test-Path $Path)) {
        return $map
    }

    foreach ($line in Get-Content $Path) {
        if ($line -match '^\s*#' -or $line -match '^\s*$') {
            continue
        }
        if ($line -match '^([^=]+)=(.*)$') {
            $map[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }

    return $map
}

function Set-EnvMapValue {
    param(
        [System.Collections.Specialized.OrderedDictionary]$Map,
        [string]$Key,
        [string]$Value
    )

    if ($Map.Contains($Key)) {
        $Map[$Key] = $Value
    } else {
        $Map.Add($Key, $Value)
    }
}

function Write-EnvFile {
    param(
        [string]$Path,
        [System.Collections.Specialized.OrderedDictionary]$Map,
        [string[]]$KeyOrder
    )

    $lines = New-Object System.Collections.Generic.List[string]
    $written = @{}

    if (Test-Path $Path) {
        foreach ($line in Get-Content $Path) {
            if ($line -match '^([^=]+)=(.*)$') {
                $key = $Matches[1].Trim()
                if ($Map.Contains($key)) {
                    $lines.Add("$key=$($Map[$key])")
                    $written[$key] = $true
                    continue
                }
            }
            $lines.Add($line)
        }
    }

    foreach ($key in $KeyOrder) {
        if ($written.ContainsKey($key) -or -not $Map.Contains($key)) {
            continue
        }
        $lines.Add("$key=$($Map[$key])")
        $written[$key] = $true
    }

    foreach ($entry in $Map.GetEnumerator()) {
        if ($written.ContainsKey($entry.Key)) {
            continue
        }
        $lines.Add("$($entry.Key)=$($entry.Value)")
    }

    Set-Content -Path $Path -Value ($lines -join "`n") -Encoding utf8
}

function Sync-ProductionEnv {
    param(
        [string]$Root = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
    )

    $envFile = Join-Path $Root 'deploy/docker/production.env'
    $example = Join-Path $Root 'deploy/docker/production.env.local.example'

    if (-not (Test-Path $envFile)) {
        if (-not (Test-Path $example)) {
            throw "Missing $envFile and $example"
        }
        Copy-Item $example $envFile
        Write-Host "Created $envFile from local example."
    }

    $map = Read-EnvMap -Path $envFile
    $httpPort = if ($map.HTTP_PORT) { $map.HTTP_PORT } else { '8093' }
    $gatewayHost = if ($map.DIYAR_GATEWAY_HOST) { $map.DIYAR_GATEWAY_HOST } elseif ($map.DIYAR_LAN_HOST -and $map.DIYAR_LAN_HOST -ne 'auto') { $map.DIYAR_LAN_HOST } else { 'diyar.local' }
    $gatewayPort = if ($map.GATEWAY_PORT) { $map.GATEWAY_PORT } else { '8080' }
    $frontendPort = if ($map.FRONTEND_PORT) { $map.FRONTEND_PORT } else { '3000' }
    $gatewayUrl = "http://${gatewayHost}:${gatewayPort}"

    Set-EnvMapValue -Map $map -Key 'DIYAR_GATEWAY_HOST' -Value $gatewayHost
    Set-EnvMapValue -Map $map -Key 'DIYAR_LAN_HOST' -Value $gatewayHost
    Set-EnvMapValue -Map $map -Key 'GATEWAY_PORT' -Value $gatewayPort
    Set-EnvMapValue -Map $map -Key 'HTTP_PORT' -Value $httpPort
    Set-EnvMapValue -Map $map -Key 'FRONTEND_PORT' -Value $frontendPort
    Set-EnvMapValue -Map $map -Key 'APP_URL' -Value $gatewayUrl
    Set-EnvMapValue -Map $map -Key 'FRONTEND_URL' -Value $gatewayUrl
    Set-EnvMapValue -Map $map -Key 'DIYAR_FRONTEND_URL' -Value $gatewayUrl
    Set-EnvMapValue -Map $map -Key 'REVERB_HOST' -Value $gatewayHost
    Set-EnvMapValue -Map $map -Key 'REVERB_PORT' -Value $gatewayPort
    Set-EnvMapValue -Map $map -Key 'REVERB_SCHEME' -Value 'http'

    Write-EnvFile -Path $envFile -Map $map -KeyOrder @(
        'DIYAR_GATEWAY_HOST', 'DIYAR_LAN_HOST', 'GATEWAY_PORT', 'HTTP_PORT', 'FRONTEND_PORT',
        'APP_URL', 'FRONTEND_URL', 'DIYAR_FRONTEND_URL', 'REVERB_HOST', 'REVERB_PORT', 'REVERB_SCHEME'
    )

    Write-Host 'Synced production.env (stable local URL):'
    Write-Host "  DIYAR_GATEWAY_HOST = $gatewayHost"
    Write-Host "  GATEWAY_PORT       = $gatewayPort"
    Write-Host "  Open in browser    = $gatewayUrl"
    Write-Host "  Docker API (internal) = http://127.0.0.1:$httpPort"
    Write-Host "  Vite (internal)       = http://127.0.0.1:$frontendPort"

    return @{
        GatewayHost = $gatewayHost
        GatewayPort = $gatewayPort
        GatewayUrl = $gatewayUrl
        HttpPort = $httpPort
        FrontendPort = $frontendPort
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    Sync-ProductionEnv | Out-Null
}
