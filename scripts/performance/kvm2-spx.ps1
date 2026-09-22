#Requires -Version 5.1
# Enable/disable php-spx in diyar-kvm2-test app container (local KVM2 only).
param(
    [ValidateSet('enable','disable','status')]
    [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ini = Join-Path $Root 'backend/docker/spx.ini'
$container = 'diyar-kvm2-test-app-1'
$remoteIni = '/usr/local/etc/php/conf.d/99-spx-kvm2.ini'

function Ensure-SpxBuilt {
    docker exec -u root $container bash -c 'test -f /usr/local/lib/php/extensions/no-debug-non-zts-20230831/spx.so' 2>$null
    if ($LASTEXITCODE -ne 0) {
        docker exec -u root $container bash -c '
            apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git autoconf gcc g++ make >/dev/null &&
            rm -rf /tmp/php-spx && git clone --depth 1 https://github.com/NoiseByNorthwest/php-spx.git /tmp/php-spx &&
            cd /tmp/php-spx && phpize && ./configure && make -j2 && make install
        '
    }
}

switch ($Action) {
    'enable' {
        Ensure-SpxBuilt
        docker cp $ini "${container}:${remoteIni}"
        docker exec -u root $container bash -c 'mkdir -p /tmp/spx-data && chmod 777 /tmp/spx-data'
        docker compose -p diyar-kvm2-test -f (Join-Path $Root 'docker-compose.production.yml') -f (Join-Path $Root 'docker-compose.production.octane.yml') -f (Join-Path $Root 'docker-compose.kvm2-test.yml') --env-file (Join-Path $Root 'deploy/docker/kvm2-test.env') restart app nginx | Out-Null
        Start-Sleep 18
        $m = docker exec $container php -m 2>&1
        if ("$m" -notmatch '\bspx\b') { throw 'SPX not loaded after enable' }
        Write-Host 'SPX enabled (restart app+nginx).' -ForegroundColor Green
    }
    'disable' {
        docker exec -u root $container rm -f $remoteIni 2>$null
        docker compose -p diyar-kvm2-test -f (Join-Path $Root 'docker-compose.production.yml') -f (Join-Path $Root 'docker-compose.production.octane.yml') -f (Join-Path $Root 'docker-compose.kvm2-test.yml') --env-file (Join-Path $Root 'deploy/docker/kvm2-test.env') restart app nginx | Out-Null
        Write-Host 'SPX disabled.' -ForegroundColor Yellow
    }
    'status' {
        $so = docker exec $container bash -c 'test -f /usr/local/lib/php/extensions/no-debug-non-zts-20230831/spx.so && echo yes || echo no'
        $iniPresent = docker exec $container bash -c "test -f $remoteIni && echo yes || echo no"
        $loaded = docker exec $container php -m 2>&1
        [ordered]@{
            spx_so = $so.Trim()
            ini_present = $iniPresent.Trim()
            loaded = [bool]("$loaded" -match '\bspx\b')
        } | ConvertTo-Json
    }
}
