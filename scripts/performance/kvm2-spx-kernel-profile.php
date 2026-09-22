<?php

declare(strict_types=1);

/**
 * Local KVM2 profiling only — run inside app container with SPX env vars.
 * Simulates one HTTP catalog search through Laravel HTTP kernel (not Swoole worker).
 */

require __DIR__.'/../../backend/vendor/autoload.php';

$app = require __DIR__.'/../../backend/bootstrap/app.php';

/** @var Illuminate\Contracts\Http\Kernel $kernel */
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$path = '/api/v1/catalog/search?q=sofa&type=all&per_page=12&product_page=1&service_page=1';
$request = Illuminate\Http\Request::create($path, 'GET', [], [], [], [
    'HTTP_ACCEPT' => 'application/json',
    'HTTP_ACCEPT_LANGUAGE' => 'ar',
    'REMOTE_ADDR' => '127.0.0.1',
]);

$response = $kernel->handle($request);
fwrite(STDOUT, 'status='.$response->getStatusCode().PHP_EOL);
$kernel->terminate($request, $response);
