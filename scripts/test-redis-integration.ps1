# Run Redis integration tests (requires Docker: docker compose -f docker-compose.dev.yml up -d)
$ErrorActionPreference = 'Stop'
$env:DIYAR_LOADTEST_MODE = 'false'
$env:CACHE_STORE = 'redis'
$env:QUEUE_CONNECTION = 'redis'
$env:REDIS_HOST = if ($env:REDIS_HOST) { $env:REDIS_HOST } else { '127.0.0.1' }
$env:REDIS_PORT = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { '6379' }
Set-Location (Join-Path $PSScriptRoot '..\backend')
php artisan test --group=redis-integration @args
