# Run PHPUnit with safe env (never inherit DIYAR_LOADTEST_MODE from E2E shell)
$ErrorActionPreference = 'Stop'
$env:DIYAR_LOADTEST_MODE = 'false'
if (-not $env:CACHE_STORE) { $env:CACHE_STORE = 'array' }
Set-Location (Join-Path $PSScriptRoot '..\backend')
php artisan test @args
