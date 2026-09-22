# Session isolation smoke — two seeded customers, no load test
$ErrorActionPreference = 'Stop'
$Base = 'http://127.0.0.1:8193'
$Api = "$Base/api/v1"

function Login-Customer([string]$Email, [string]$Password) {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $null = Invoke-WebRequest -Uri "$Base/sanctum/csrf-cookie" -WebSession $session -UseBasicParsing
    $xsrf = ($session.Cookies.GetCookies($Base) | Where-Object { $_.Name -eq 'XSRF-TOKEN' }).Value
    $xsrf = [uri]::UnescapeDataString($xsrf)
    $body = @{ identifier = $Email; method = 'email'; password = $Password } | ConvertTo-Json
    $login = Invoke-WebRequest -Uri "$Api/auth/login" -Method POST -WebSession $session -UseBasicParsing `
        -ContentType 'application/json' -Headers @{ 'X-XSRF-TOKEN' = $xsrf; 'X-Requested-With' = 'XMLHttpRequest' } -Body $body
    if ($login.StatusCode -lt 200 -or $login.StatusCode -ge 300) { throw "Login failed for $Email" }
    return $session
}

function Get-ProfileEmail($session) {
    $r = Invoke-WebRequest -Uri "$Api/auth/me" -WebSession $session -UseBasicParsing -Headers @{ Accept = 'application/json' }
    $j = $r.Content | ConvertFrom-Json
    return $j.data.email
}

$pass = 'Password123!'
$userA = Login-Customer 'customer@diyar.local' $pass
$userB = Login-Customer 'vendor@diyar.local' $pass
$emailA = Get-ProfileEmail $userA
$emailB = Get-ProfileEmail $userB

$result = @{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    user_a_expected = 'customer@diyar.local'
    user_a_actual = $emailA
    user_b_expected = 'vendor@diyar.local'
    user_b_actual = $emailB
    isolation_ok = ($emailA -eq 'customer@diyar.local' -and $emailB -eq 'vendor@diyar.local')
    critical = -not ($emailA -eq 'customer@diyar.local' -and $emailB -eq 'vendor@diyar.local')
}
$result | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'auth-isolation.json') -Encoding utf8
if ($result.critical) { Write-Error 'CRITICAL: session isolation failure'; exit 2 }
Write-Host 'Auth isolation OK'
exit 0
