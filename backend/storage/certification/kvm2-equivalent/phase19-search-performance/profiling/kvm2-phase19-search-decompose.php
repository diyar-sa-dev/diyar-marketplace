<?php

declare(strict_types=1);

require '/var/www/html/vendor/autoload.php';

$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\Catalog\CatalogSearchService;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use Illuminate\Support\Facades\DB;

$normalizer = $app->make(CatalogFilterNormalizer::class);
$search = $app->make(CatalogSearchService::class);

$scenarios = [
    'q_sofa_all' => ['q' => 'sofa', 'type' => 'all', 'per_page' => 12, 'product_page' => 1, 'service_page' => 1],
    'q_chair_all' => ['q' => 'chair', 'type' => 'all', 'per_page' => 12, 'product_page' => 1, 'service_page' => 1],
    'q_sofa_products' => ['q' => 'sofa', 'type' => 'products', 'per_page' => 12, 'product_page' => 1],
    'no_q' => ['type' => 'all', 'per_page' => 12, 'product_page' => 1, 'service_page' => 1],
];

$out = [];

foreach ($scenarios as $name => $rawFilters) {
    $filters = $normalizer->normalizeForCatalogSearch($rawFilters);
    foreach (['cold', 'warm'] as $phase) {
        if ($phase === 'cold') {
            Illuminate\Support\Facades\Artisan::call('cache:clear');
        } else {
            for ($i = 0; $i < 10; $i++) {
                $search->search($filters, null);
            }
        }

        DB::flushQueryLog();
        DB::enableQueryLog();
        $started = hrtime(true);
        $payload = $search->search($filters, null);
        $wallMs = (hrtime(true) - $started) / 1_000_000;
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $out[] = [
            'scenario' => $name,
            'phase' => $phase,
            'wall_ms' => round($wallMs, 3),
            'sql_count' => count($queries),
            'result_product_total' => $payload['products']['pagination']['total'] ?? null,
            'result_service_total' => $payload['services']['pagination']['total'] ?? null,
            'payload_bytes' => strlen(json_encode($payload, JSON_THROW_ON_ERROR)),
        ];
    }
}

echo json_encode(['captured_at_utc' => gmdate('c'), 'rows' => $out], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR).PHP_EOL;
