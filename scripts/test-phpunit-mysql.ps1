# Run PHPUnit with MySQL 8 for index EXPLAIN and engine-parity tests
$ErrorActionPreference = 'Stop'
$env:DIYAR_LOADTEST_MODE = 'false'
$env:DB_CONNECTION = 'mysql'
$env:DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { '127.0.0.1' }
$env:DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { '3306' }
$env:DB_DATABASE = if ($env:DB_DATABASE) { $env:DB_DATABASE } else { 'diyar' }
$env:DB_USERNAME = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { 'root' }
if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = '' }
Set-Location (Join-Path $PSScriptRoot '..\backend')
php artisan test @args
