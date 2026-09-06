@echo off
setlocal
set EVIDENCE=..\conception\Stages\Stage 28\Phase 28.17 - Enterprise Concurrency ^& Octane Hardening\_raw
set TS=%date:~-4%%date:~-10,2%%date:~-7,2%-cert

echo === DIYAR Phase 28 Certification Runner === > "%EVIDENCE%\cert-run-%TS%.txt"
echo Started: %date% %time% >> "%EVIDENCE%\cert-run-%TS%.txt"

docker cp scripts\stage2817-controlled-load.php diyar-marketplace-api-a-1:/var/www/html/scripts/ 2>nul
docker cp scripts\stage2817-db-explain.php diyar-marketplace-api-a-1:/var/www/html/scripts/ 2>nul
docker cp scripts\stage2817-runtime-seed-payout.php diyar-marketplace-api-a-1:/var/www/html/scripts/ 2>nul
docker cp app\Services\Infrastructure\PlatformHealthService.php diyar-marketplace-api-a-1:/var/www/html/app/Services/Infrastructure/PlatformHealthService.php 2>nul
docker exec diyar-marketplace-api-a-1 php artisan octane:reload 2>nul

echo. >> "%EVIDENCE%\cert-run-%TS%.txt"
echo --- checkout x5 --- >> "%EVIDENCE%\cert-run-%TS%.txt"
for /L %%i in (1,1,5) do (
  docker exec diyar-marketplace-api-a-1 sh -c "php scripts/stage2817-runtime-seed-checkout.php > /tmp/co.json" 2>nul
  docker cp diyar-marketplace-api-a-1:/tmp/co.json "%EVIDENCE%\co-%%i.json" 2>nul
  php scripts\stage2817-http-checkout-concurrency.php --base=http://127.0.0.1:8088 --fixture="%EVIDENCE%\co-%%i.json" >> "%EVIDENCE%\cert-run-%TS%.txt" 2>&1
)

echo. >> "%EVIDENCE%\cert-run-%TS%.txt"
echo --- multinode auth --- >> "%EVIDENCE%\cert-run-%TS%.txt"
php scripts\stage2817-multinode-auth.php --base=http://127.0.0.1:8088 >> "%EVIDENCE%\cert-run-%TS%.txt" 2>&1

echo. >> "%EVIDENCE%\cert-run-%TS%.txt"
echo --- controlled load --- >> "%EVIDENCE%\cert-run-%TS%.txt"
php scripts\stage2817-controlled-load.php --base=http://127.0.0.1:8088 --endpoint=/api/v1/categories --concurrency=10 --duration=10 >> "%EVIDENCE%\cert-run-%TS%.txt" 2>&1
php scripts\stage2817-controlled-load.php --base=http://127.0.0.1:8088 --endpoint=/api/v1/catalog/search?q=bed --concurrency=25 --duration=15 >> "%EVIDENCE%\cert-run-%TS%.txt" 2>&1

echo Done >> "%EVIDENCE%\cert-run-%TS%.txt"
