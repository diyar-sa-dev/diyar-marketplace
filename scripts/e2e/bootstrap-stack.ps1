# E2E stack bootstrap (Phase 28.13)
# Run from repo root: .\scripts\e2e\bootstrap-stack.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$backend = Join-Path $repoRoot 'backend'
$frontend = Join-Path $repoRoot 'frontend'

Write-Host '==> Seeding sqlite E2E database...'
Push-Location $backend
$sqlitePath = Join-Path $backend 'database\database.sqlite'
if (Test-Path $sqlitePath) {
  Remove-Item $sqlitePath -Force
}
New-Item -ItemType File -Path $sqlitePath -Force | Out-Null
$env:APP_ENV = 'local'
$env:DB_CONNECTION = 'sqlite'
$env:DB_DATABASE = 'database/database.sqlite'
$env:CACHE_STORE = 'array'
$env:QUEUE_CONNECTION = 'sync'
$env:SESSION_DRIVER = 'database'
$env:DIYAR_LOADTEST_MODE = 'true'
$env:FRONTEND_URL = 'http://127.0.0.1:3000'
$env:SANCTUM_STATEFUL_DOMAINS = 'localhost:3000,127.0.0.1:3000,127.0.0.1:8000,localhost:8000'
php artisan migrate:fresh --seed --force
Pop-Location

Write-Host '==> Building frontend...'
Push-Location $frontend
npm run build
Pop-Location

Write-Host ''
Write-Host 'Bootstrap complete. Start servers in separate terminals:'
Write-Host "  API:     cd backend; `$env:DB_CONNECTION='sqlite'; `$env:DB_DATABASE='database/database.sqlite'; `$env:CACHE_STORE='array'; `$env:DIYAR_LOADTEST_MODE='true'; php artisan serve --host=127.0.0.1 --port=8000"
Write-Host '  Preview: cd frontend; npx vite preview --host 127.0.0.1 --port 3000'
Write-Host '  E2E:     cd frontend; npx playwright test'
