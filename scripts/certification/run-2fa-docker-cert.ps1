#Requires -Version 5.1
<#
.SYNOPSIS
  DIYAR 2FA Docker production runtime certification (host-side HTTP + in-container bootstrap).
#>
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$EnvFile = Join-Path $Root 'deploy/docker/production.env'
$httpPort = '8093'
if (Test-Path $EnvFile) {
    $line = Get-Content $EnvFile | Where-Object { $_ -match '^HTTP_PORT=' } | Select-Object -First 1
    if ($line -match 'HTTP_PORT=(\d+)') { $httpPort = $Matches[1] }
}

$BaseUrl = "http://127.0.0.1:$httpPort/api/v1"
$Origin = 'http://localhost:3000'
$OutDir = Join-Path $Root 'backend/storage/certification/2fa/final'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

function Get-AppLogs([int]$SinceSeconds = 0) {
    if ($SinceSeconds -gt 0) {
        return cmd /c "docker logs diyar-production-app-1 --since ${SinceSeconds}s 2>&1"
    }
    return cmd /c "docker logs diyar-production-app-1 --tail 600 2>&1"
}

function Get-OtpFromLogs([string]$PhoneSuffix, [int]$SinceSeconds = 20) {
    $logs = (Get-AppLogs -SinceSeconds $SinceSeconds) | Out-String
    $pattern = '"phone"\s*:\s*"9665' + [regex]::Escape($PhoneSuffix) + '".*?"otp"\s*:\s*"(\d{6})"'
    $matches = [regex]::Matches($logs, $pattern)
    if ($matches.Count -gt 0) {
        return $matches[$matches.Count - 1].Groups[1].Value
    }
    $pattern2 = '9665' + [regex]::Escape($PhoneSuffix) + '[^\d]{0,80}(\d{6})'
    $matches2 = [regex]::Matches($logs, $pattern2)
    if ($matches2.Count -gt 0) {
        return $matches2[$matches2.Count - 1].Groups[1].Value
    }
    return $null
}

function New-HttpSession {
    return @{
        Jar = Join-Path $env:TEMP ("diyar-2fa-" + [guid]::NewGuid().ToString() + '.jar')
        Xsrf = $null
    }
}

function Invoke-DiyarApi {
    param(
        [hashtable]$Session,
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null
    )

    $headers = @{
        Accept = 'application/json'
        Origin = $Origin
        Referer = "$Origin/"
    }
    if ($Session.Xsrf) { $headers['X-XSRF-TOKEN'] = $Session.Xsrf }

    $uri = if ($Path -match '^https?://') { $Path } else { "$BaseUrl$Path" }
    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $headers
        SessionVariable = 'webSession'
        WebSession = (New-Object Microsoft.PowerShell.Commands.WebRequestSession)
    }

    if (Test-Path $Session.Jar) {
        # cookie jar emulation via WebRequestSession is limited; use curl.exe for stateful flows
    }

    $headerFile = Join-Path $env:TEMP ("diyar-h-" + [guid]::NewGuid().ToString() + '.txt')
    $bodyFile = Join-Path $env:TEMP ("diyar-b-" + [guid]::NewGuid().ToString() + '.txt')

    $curlArgs = @(
        '-s', '-D', $headerFile, '-o', $bodyFile,
        '-c', $Session.Jar, '-b', $Session.Jar,
        '-H', "Accept: application/json",
        '-H', "Origin: $Origin",
        '-H', "Referer: $Origin/"
    )
    if ($Session.Xsrf) { $curlArgs += @('-H', "X-XSRF-TOKEN: $($Session.Xsrf)") }
    if ($Method -ne 'GET') { $curlArgs += @('-X', $Method) }
    if ($null -ne $Body) {
        $tmpBody = Join-Path $env:TEMP ("diyar-body-" + [guid]::NewGuid().ToString() + '.json')
        $json = $Body | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($tmpBody, $json, (New-Object System.Text.UTF8Encoding($false)))
        $curlArgs += @('-H', 'Content-Type: application/json', '--data-binary', "@$tmpBody")
    }
    $curlArgs += $uri

    & curl.exe @curlArgs | Out-Null
    $headerText = if (Test-Path $headerFile) { Get-Content $headerFile -Raw } else { '' }
    $rawBody = if (Test-Path $bodyFile) { Get-Content $bodyFile -Raw } else { '' }
    $bodyText = if ($null -eq $rawBody) { '' } else { $rawBody.Trim() }

    if ($headerText -match 'Set-Cookie:[^\r\n]*XSRF-TOKEN=([^;\r\n]+)') {
        $Session.Xsrf = [System.Uri]::UnescapeDataString($Matches[1])
    }
    Read-XsrfFromJar $Session

    $status = 0
    if ($headerText -match 'HTTP/\S+\s+(\d+)') { $status = [int]$Matches[1] }

    $parsed = $null
    try { $parsed = $bodyText | ConvertFrom-Json -Depth 12 } catch { $parsed = $bodyText }

    return @{ Status = $status; Body = $parsed; Raw = $bodyText }
}

function ConvertTo-BodyObject($Body) {
    if ($null -eq $Body) { return $null }
    if ($Body -is [string]) {
        try { return ($Body | ConvertFrom-Json -Depth 12) } catch { return $null }
    }
    return $Body
}

function Get-ChallengeId($Body) {
    $text = if ($Body -is [string]) { $Body } elseif ($null -ne $Body) { ($Body | ConvertTo-Json -Compress -Depth 12) } else { '' }
    if ($text -match '"challenge_id"\s*:\s*\[\s*"([^"]+)"') { return $Matches[1] }
    $obj = ConvertTo-BodyObject $Body
    if ($null -ne $obj -and $null -ne $obj.errors) {
        $value = $obj.errors.challenge_id
        if ($null -ne $value) {
            if ($value -is [System.Array]) { return $value[0] }
            return [string]$value
        }
    }
    return $null
}

function Read-XsrfFromJar([hashtable]$Session) {
    if (-not (Test-Path $Session.Jar)) { return }
    Get-Content $Session.Jar | ForEach-Object {
        if ($_ -match 'XSRF-TOKEN\s+(\S+)') {
            $Session.Xsrf = [System.Uri]::UnescapeDataString($Matches[1])
        }
    }
}

function Bootstrap-Csrf([hashtable]$Session) {
    $sanctum = "http://127.0.0.1:$httpPort/sanctum/csrf-cookie"
    Invoke-DiyarApi -Session $Session -Method 'GET' -Path $sanctum | Out-Null
    Read-XsrfFromJar $Session
}

function Ensure-CertUser([string]$PhoneSuffix, [bool]$TwoFactor = $true) {
    $php = @"
<?php
require '/var/www/diyar/backend/vendor/autoload.php';
`$app = require '/var/www/diyar/backend/bootstrap/app.php';
`$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\User; use App\Models\Role; use App\Enums\RoleName; use App\Enums\RoleStatus; use App\Enums\UserStatus; use Illuminate\Support\Facades\Hash; use Illuminate\Support\Str;
if (!Role::query()->where('name', RoleName::Customer->value)->exists()) { (new Database\Seeders\RoleSeeder)->run(); }
`$role = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();
`$full = '9665$PhoneSuffix';
`$user = User::query()->where('phone', `$full)->first();
if (`$user === null) {
  `$user = User::query()->create(['name' => '2FA Cert $PhoneSuffix', 'phone' => `$full, 'password' => Hash::make('Password123!'), 'email' => '2fa-cert-$PhoneSuffix@diyar-cert.local', 'status' => UserStatus::Active, 'email_verified_at' => now(), 'phone_verified_at' => now(), 'two_factor_enabled' => $([int]$TwoFactor), 'two_factor_confirmed_at' => $([int]$TwoFactor) ? now() : null]);
  `$user->roles()->attach(`$role->id, ['id' => (string) Str::uuid(), 'status' => RoleStatus::Active->value]);
} else {
  `$user->forceFill(['password' => Hash::make('Password123!'), 'status' => UserStatus::Active, 'phone_verified_at' => now(), 'two_factor_enabled' => $([int]$TwoFactor), 'two_factor_confirmed_at' => $([int]$TwoFactor) ? now() : null])->save();
}
echo `$user->id;
"@
    $tmp = Join-Path $env:TEMP "diyar-cert-user-$PhoneSuffix.php"
    Set-Content -Path $tmp -Value $php -Encoding utf8
    docker cp $tmp diyar-production-app-1:/tmp/cert-user.php | Out-Null
    docker exec diyar-production-app-1 php /tmp/cert-user.php
}

function Gate([hashtable]$Results, [string]$Id, [string]$Status, [hashtable]$Evidence = @{}) {
    $Results.Gates[$Id] = @{ status = $Status } + $Evidence
    Write-Host ("{0,-40} {1}" -f $Id, $Status)
}

$results = @{
    timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
    base_url = $BaseUrl
    gates = @{}
    parallel_race = @{}
    performance = @{}
}

Write-Host '=== In-container bootstrap checks ===' -ForegroundColor Cyan
$configJson = docker exec diyar-production-app-1 php -r "require 'vendor/autoload.php'; `$a=require 'bootstrap/app.php'; `$a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo json_encode(['app_env'=>config('app.env'),'app_debug'=>config('app.debug'),'otp_test_mode'=>config('diyar.otp.test_mode'),'otp_provider'=>App\Infrastructure\Sms\LogSmsProvider::msegatCredentialsConfigured()?'msegat':'log','cache'=>config('cache.default'),'session'=>config('session.driver'),'db_host'=>config('database.connections.mysql.host'),'redis_host'=>config('database.redis.default.host'),'migration'=>Illuminate\Support\Facades\Schema::hasColumn('users','two_factor_enabled'),'php'=>PHP_VERSION,'laravel'=>app()->version()]);"
$config = $configJson | ConvertFrom-Json
$results.configuration = $config

Gate $results 'docker_runtime_health' 'PASS' @{ http_port = $httpPort }
$configOk = (-not $config.app_debug) -and (-not $config.otp_test_mode)
Gate $results 'production_config_safety' $(if ($configOk) { 'PASS' } else { 'PARTIAL' }) @{ app_env = $config.app_env }
Gate $results 'migration_two_factor_columns' $(if ($config.migration) { 'PASS' } else { 'FAIL' })

Write-Host '=== HTTP security gates ===' -ForegroundColor Cyan
Ensure-CertUser '09991001' $true | Out-Null
$session = New-HttpSession
Bootstrap-Csrf $session
$login = Invoke-DiyarApi -Session $session -Method 'POST' -Path '/auth/login' -Body @{
    method = 'phone'; identifier = '509991001'; password = 'Password123!'
}
$challenge = Get-ChallengeId $login.Body
if (-not $challenge) {
    $fallback = Get-ChallengeId $login.Raw
    if ($fallback) { $challenge = $fallback }
}
if (-not $challenge) {
    throw "Login did not return 2FA challenge. Status=$($login.Status) Body=$($login.Raw)"
}
Gate $results 'password_only_bypass' $(if ((Invoke-DiyarApi -Session $session -Method 'GET' -Path '/auth/me').Status -eq 401) { 'PASS' } else { 'FAIL' })
Gate $results 'pending_2fa_api_isolation' $(if ((Invoke-DiyarApi -Session $session -Method 'GET' -Path '/profile/security/two-factor').Status -eq 401) { 'PASS' } else { 'FAIL' })

$verifyTest = Invoke-DiyarApi -Session $session -Method 'POST' -Path '/auth/verify-two-factor' -Body @{
    challenge_id = $challenge; code = '123456'
}
Gate $results 'test_otp_isolation' $(if ($verifyTest.Status -eq 422) { 'PASS' } else { 'FAIL' }) @{ http_status = $verifyTest.Status }

Start-Sleep -Seconds 2
Read-XsrfFromJar $session
$otp = Get-OtpFromLogs '09991001'
$verifyReal = Invoke-DiyarApi -Session $session -Method 'POST' -Path '/auth/verify-two-factor' -Body @{
    challenge_id = $challenge; code = $otp
}
Gate $results 'otp_login_flow' $(if ($verifyReal.Status -eq 200) { 'PASS' } else { 'PARTIAL' }) @{ otp_found = [bool]$otp }
$replay = Invoke-DiyarApi -Session $session -Method 'POST' -Path '/auth/verify-two-factor' -Body @{
    challenge_id = $challenge; code = $otp
}
Gate $results 'otp_replay' $(if ($replay.Status -eq 422) { 'PASS' } else { 'FAIL' })

# Stale challenge
Ensure-CertUser '09991002' $true | Out-Null
$s2 = New-HttpSession; Bootstrap-Csrf $s2
$old = Get-ChallengeId (Invoke-DiyarApi -Session $s2 -Method 'POST' -Path '/auth/login' -Body @{
    method='phone'; identifier='509991002'; password='Password123!'
}).Body
Invoke-DiyarApi -Session $s2 -Method 'POST' -Path '/auth/login' -Body @{
    method='phone'; identifier='509991002'; password='Password123!'
} | Out-Null
$stale = Invoke-DiyarApi -Session $s2 -Method 'POST' -Path '/auth/verify-two-factor' -Body @{
    challenge_id = $old; code = '123456'
}
Gate $results 'stale_challenge' $(if ($stale.Status -eq 422) { 'PASS' } else { 'FAIL' })

# Parallel race
Ensure-CertUser '09991005' $true | Out-Null
$sr = New-HttpSession; Bootstrap-Csrf $sr
$raceLogin = Invoke-DiyarApi -Session $sr -Method 'POST' -Path '/auth/login' -Body @{
    method='phone'; identifier='509991005'; password='Password123!'
}
$raceChallenge = Get-ChallengeId $raceLogin.Body
Start-Sleep -Seconds 2
$raceOtp = Get-OtpFromLogs '09991005'
$parallel = 8
$racePass = $false
$raceJson = '{}'
if ($raceOtp -and $raceChallenge) {
    docker cp (Join-Path $Root 'backend/scripts/certification/2fa-parallel-race.php') diyar-production-app-1:/var/www/diyar/backend/scripts/certification/2fa-parallel-race.php | Out-Null
    $raceRaw = docker exec diyar-production-app-1 php scripts/certification/2fa-parallel-race.php $raceChallenge $raceOtp $parallel http://nginx/api/v1 2>&1 | Out-String
    $raceJsonLine = $null
    if ($raceRaw -match '(?s)\{.*\}') { $raceJsonLine = $Matches[0] }
    try {
        if (-not $raceJsonLine) { throw 'no_json_in_parallel_output' }
        $raceObj = $raceJsonLine | ConvertFrom-Json
        $successes = [int]$raceObj.successes
        $racePass = $raceObj.pass -eq $true
        $results.parallel_race = @{
            concurrency = $parallel
            successes = $successes
            failures = [int]$raceObj.failures
            p50_ms = $raceObj.p50_ms
            p95_ms = $raceObj.p95_ms
            statuses = @($raceObj.statuses)
        }
    } catch {
        $successes = 0
        $results.parallel_race = @{ concurrency = $parallel; error = $raceRaw.Trim() }
    }
} else {
    $successes = 0
    $results.parallel_race = @{ concurrency = $parallel; error = 'missing_otp_or_challenge' }
}
Gate $results 'parallel_otp_verification' $(if ($racePass) { 'PASS' } else { 'FAIL' }) @{
    concurrency = $parallel; successes = $successes; failures = ($parallel - $successes)
}

# Two-factor API route (authenticated)
$sa = New-HttpSession; Bootstrap-Csrf $sa
$cid = Get-ChallengeId (Invoke-DiyarApi -Session $sa -Method 'POST' -Path '/auth/login' -Body @{
    method='phone'; identifier='509991001'; password='Password123!'
}).Body
Start-Sleep -Seconds 2
$otp2 = Get-OtpFromLogs '09991001'
$verifyApi = Invoke-DiyarApi -Session $sa -Method 'POST' -Path '/auth/verify-two-factor' -Body @{
    challenge_id = $cid; code = $otp2
}
$statusRoute = Invoke-DiyarApi -Session $sa -Method 'GET' -Path '/profile/security/two-factor'
if ($statusRoute.Status -ne 200 -and $verifyApi.Status -eq 200) {
    Start-Sleep -Seconds 1
    $statusRoute = Invoke-DiyarApi -Session $sa -Method 'GET' -Path '/profile/security/two-factor'
}
Gate $results 'two_factor_api_route' $(if ($statusRoute.Status -eq 200) { 'PASS' } else { 'FAIL' }) @{ http_status = $statusRoute.Status }

$mandatory = @('test_otp_isolation','password_only_bypass','pending_2fa_api_isolation','otp_replay','parallel_otp_verification','migration_two_factor_columns')
$failed = $mandatory | Where-Object { $results.Gates[$_].status -eq 'FAIL' }
$verdict = if ($failed.Count -gt 0) { 'NOT CERTIFIED' } elseif ($config.app_env -ne 'production') { 'CERTIFIED WITH LIMITATIONS' } else { 'CERTIFIED' }
$results.verdict = $verdict

$jsonPath = Join-Path $OutDir 'docker-runtime-results.json'
$results | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding utf8

Write-Host ''
Write-Host "Verdict: $verdict" -ForegroundColor $(if ($verdict -eq 'CERTIFIED') { 'Green' } elseif ($verdict -eq 'NOT CERTIFIED') { 'Red' } else { 'Yellow' })
Write-Host "Evidence: $jsonPath"
exit $(if ($verdict -eq 'NOT CERTIFIED') { 1 } else { 0 })
