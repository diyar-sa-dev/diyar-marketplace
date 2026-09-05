#Requires -Version 5.1
<#
.SYNOPSIS
  Resolves DIYAR_LAN_HOST and writes derived URL keys into deploy/docker/production.env.

.DESCRIPTION
  Single knob local networking:
    DIYAR_LAN_HOST=auto   -> detected Wi‑Fi IPv4 (192.168.x.x), or 127.0.0.1
    DIYAR_LAN_HOST=192.168.1.50  -> fixed IP (override auto)

  Synced keys: DIYAR_LAN_HOST, APP_URL, REVERB_HOST
  Sanctum/CORS expand at runtime from *_BASE lists + DIYAR_LAN_HOST (see DiyarNetworkOrigins.php).
#>

function Get-DiyarLanHost {
    param(
        [string]$Configured = 'auto'
    )

    if ($env:DIYAR_LAN_HOST -and $env:DIYAR_LAN_HOST -ne 'auto') {
        return $env:DIYAR_LAN_HOST.Trim()
    }

    if ($Configured -and $Configured.Trim() -ne '' -and $Configured.Trim().ToLower() -ne 'auto') {
        return $Configured.Trim()
    }

    $detected = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -like '192.168.*' -and
            $_.PrefixOrigin -ne 'WellKnown' -and
            $_.AddressState -eq 'Preferred'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress

    if ($detected) {
        return $detected
    }

    return '127.0.0.1'
}

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
    $configuredLan = if ($map.DIYAR_LAN_HOST) { $map.DIYAR_LAN_HOST } else { 'auto' }
    $lanHost = Get-DiyarLanHost -Configured $configuredLan

    Set-EnvMapValue -Map $map -Key 'DIYAR_LAN_HOST' -Value $lanHost
    Set-EnvMapValue -Map $map -Key 'APP_URL' -Value "http://${lanHost}:${httpPort}"
    Set-EnvMapValue -Map $map -Key 'REVERB_HOST' -Value $lanHost

    if (-not $map.FRONTEND_PORT) { Set-EnvMapValue -Map $map -Key 'FRONTEND_PORT' -Value '3000' }
    if (-not $map.HTTP_PORT) { Set-EnvMapValue -Map $map -Key 'HTTP_PORT' -Value $httpPort }

    Write-EnvFile -Path $envFile -Map $map -KeyOrder @(
        'DIYAR_LAN_HOST', 'HTTP_PORT', 'FRONTEND_PORT', 'APP_URL', 'REVERB_HOST'
    )

    Write-Host "Synced production.env:"
    Write-Host "  DIYAR_LAN_HOST = $lanHost"
    Write-Host "  APP_URL        = http://${lanHost}:${httpPort}"
    Write-Host "  REVERB_HOST    = $lanHost"
    Write-Host "  Phone frontend = http://${lanHost}:$($map.FRONTEND_PORT)"
    Write-Host "  PC frontend    = http://localhost:$($map.FRONTEND_PORT)"

    return @{
        LanHost = $lanHost
        HttpPort = $httpPort
        FrontendPort = $map.FRONTEND_PORT
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    Sync-ProductionEnv | Out-Null
}
