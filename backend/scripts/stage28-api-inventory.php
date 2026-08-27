<?php

declare(strict_types=1);

/**
 * Stage 28.3 — API route inventory by domain (read-only).
 * Usage: php scripts/stage28-api-inventory.php [--output=path.json]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Route;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$domainPatterns = [
    'health' => '#^api/v1/health#',
    'auth' => '#^api/v1/auth#',
    'profile' => '#^api/v1/profile|api/v1/addresses|api/v1/notifications#',
    'catalog' => '#^api/v1/products|api/v1/categories|api/v1/catalog|api/v1/vendors#',
    'cart' => '#^api/v1/cart#',
    'checkout' => '#^api/v1/checkout#',
    'orders' => '#^api/v1/orders#',
    'payments' => '#^api/v1/orders/.+/payment|api/v1/payments|api/v1/webhooks#',
    'shipping' => '#^api/v1/shipping|api/v1/vendor/shipping|api/v1/vendor/orders#',
    'returns' => '#^api/v1/returns|api/v1/refunds#',
    'services' => '#^api/v1/services|api/v1/provider/services|api/v1/service#',
    'bookings' => '#^api/v1/bookings|api/v1/provider/bookings#',
    'reviews' => '#^api/v1/reviews|api/v1/store-reviews|api/v1/product-reviews#',
    'coupons' => '#^api/v1/coupons|api/v1/vendor/coupons#',
    'notifications' => '#^api/v1/notifications#',
    'chat' => '#^api/v1/chat|api/v1/conversations|api/v1/messages#',
    'affiliate' => '#^api/v1/affiliate#',
    'b2b' => '#^api/v1/b2b#',
    'loyalty' => '#^api/v1/loyalty#',
    'analytics' => '#^api/v1/analytics|api/v1/vendor/analytics|api/v1/provider/analytics|api/v1/admin/analytics#',
    'admin' => '#^api/v1/admin#',
    'blog_cms' => '#^api/v1/blog|api/v1/projects#',
    'vendor_dashboard' => '#^api/v1/vendor/#',
    'provider_dashboard' => '#^api/v1/provider/#',
    'platform' => '#^api/v1/platform|api/v1/contact#',
];

$routes = collect(Route::getRoutes())
    ->filter(fn ($r) => str_starts_with($r->uri(), 'api/v1'))
    ->map(function ($route) {
        $middleware = collect($route->gatherMiddleware())->values()->all();
        $auth = in_array('auth:sanctum', $middleware, true)
            || in_array('auth', $middleware, true)
            || collect($middleware)->contains(fn ($m) => str_contains($m, 'auth'));

        return [
            'methods' => array_values(array_filter($route->methods(), fn ($m) => $m !== 'HEAD')),
            'uri' => $route->uri(),
            'name' => $route->getName(),
            'action' => $route->getActionName(),
            'middleware' => $middleware,
            'auth_required' => $auth,
        ];
    })
    ->values();

$byDomain = [];
$unclassified = [];

foreach ($routes as $route) {
    $uri = $route['uri'];
    $matched = false;
    foreach ($domainPatterns as $domain => $pattern) {
        if (preg_match($pattern, $uri)) {
            $byDomain[$domain][] = $route;
            $matched = true;
            break;
        }
    }
    if (! $matched) {
        $unclassified[] = $route;
    }
}

$authRequired = $routes->where('auth_required', true)->count();
$publicRoutes = $routes->where('auth_required', false)->count();

$result = [
    'timestamp_utc' => gmdate('c'),
    'total_routes' => $routes->count(),
    'auth_required_count' => $authRequired,
    'public_count' => $publicRoutes,
    'domains' => collect($byDomain)->map(fn ($items) => [
        'route_count' => count($items),
        'sample_uris' => array_slice(array_column($items, 'uri'), 0, 8),
    ])->sortKeys()->all(),
    'unclassified' => [
        'count' => count($unclassified),
        'uris' => array_column($unclassified, 'uri'),
    ],
    'routes' => $routes->all(),
];

$outputArg = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--output=')) {
        $outputArg = substr($arg, 9);
    }
}

$json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($outputArg) {
    file_put_contents($outputArg, $json);
    echo "Wrote API inventory ({$result['total_routes']} routes) to {$outputArg}".PHP_EOL;
} else {
    echo $json.PHP_EOL;
}
