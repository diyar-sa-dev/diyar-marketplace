#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Out = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase19-search-performance/environment'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$ready = curl.exe -sf -o NUL -w '%{http_code}' http://127.0.0.1:8193/api/v1/health/ready
$failed = docker exec diyar-kvm2-test-app-1 php artisan tinker --execute="echo DB::table('failed_jobs')->count();" 2>$null
$cpuset = docker inspect diyar-kvm2-test-app-1 --format '{{json .HostConfig.CpusetCpus}}' 2>$null
$octane = docker exec diyar-kvm2-test-app-1 printenv OCTANE_WORKERS 2>$null
$queue = docker exec diyar-kvm2-test-app-1 printenv QUEUE_CONNECTION 2>$null
$php = docker exec diyar-kvm2-test-app-1 php -v 2>$null | Select-Object -First 1
$laravel = docker exec diyar-kvm2-test-app-1 php artisan --version 2>$null
$productCount = docker exec diyar-kvm2-test-app-1 php artisan tinker --execute="echo App\Models\Product::query()->publiclyVisible()->count();" 2>$null

@{
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    envelope = 'LOCAL KVM2-EQUIVALENT'
    hostinger = 'NOT VERIFIED'
    health_ready = [int]$ready
    failed_jobs = "$failed".Trim()
    app_cpuset = "$cpuset".Trim()
    octane_workers = "$octane".Trim()
    queue_connection = "$queue".Trim()
    php = "$php".Trim()
    laravel = "$laravel".Trim()
    publicly_visible_products = "$productCount".Trim()
    containers = @(docker ps --format '{{.Names}}' | Where-Object { $_ -match 'diyar-kvm2-test' })
} | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $Out 'environment-cert.json') -Encoding utf8
Write-Host "Environment -> $Out/environment-cert.json"
