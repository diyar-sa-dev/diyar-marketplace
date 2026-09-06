# Run queue worker integration tests (requires Redis + queue:work)
$ErrorActionPreference = 'Stop'
$env:DIYAR_LOADTEST_MODE = 'false'
$env:CACHE_STORE = 'redis'
$env:QUEUE_CONNECTION = 'redis'
$env:REDIS_HOST = if ($env:REDIS_HOST) { $env:REDIS_HOST } else { '127.0.0.1' }
$env:REDIS_PORT = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { '6379' }
Set-Location (Join-Path $PSScriptRoot '..\backend')
php artisan test --group=queue-integration @args
