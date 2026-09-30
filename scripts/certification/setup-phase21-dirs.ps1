#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$base = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase21-whole-platform'

$dirs = @(
    'environment',
    'baseline',
    'traffic-model',
    'frontend',
    'ingress',
    'authentication',
    'catalog',
    'search',
    'product-detail',
    'cart',
    'checkout',
    'shipping',
    'coupons',
    'orders',
    'wishlist',
    'reviews',
    'vendor',
    'admin',
    'room-designer',
    'visual-search',
    'smart-filters',
    'chat',
    'notifications',
    'affiliate',
    'queues',
    'redis',
    'mysql',
    'octane',
    'nginx',
    'resources',
    'errors',
    'security',
    'regression',
    'bottlenecks',
    'optimization',
    'before-after',
    'face2',
    'face3',
    'final'
)

foreach ($d in $dirs) {
    $p = Join-Path $base $d
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
    }
}
Write-Host "Created $($dirs.Count) Phase 21 subdirectories under $base"
