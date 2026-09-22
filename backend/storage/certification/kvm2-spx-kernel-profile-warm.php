<?php

declare(strict_types=1);

require '/var/www/html/vendor/autoload.php';

$app = require '/var/www/html/bootstrap/app.php';

/** @var Illuminate\Contracts\Http\Kernel $kernel */
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$path = getenv('KVM2_PROFILE_PATH') ?: '/api/v1/catalog/search?q=sofa&type=all&per_page=12&product_page=1&service_page=1';
$server = [
    'HTTP_ACCEPT' => 'application/json',
    'HTTP_ACCEPT_LANGUAGE' => 'ar',
    'REMOTE_ADDR' => '127.0.0.1',
];

$warm = (int) (getenv('KVM2_WARM_ITERATIONS') ?: 8);
for ($i = 0; $i < $warm; $i++) {
    $request = Illuminate\Http\Request::create($path, 'GET', [], [], [], $server);
    $response = $kernel->handle($request);
    $kernel->terminate($request, $response);
}

if (function_exists('spx_profiler_start')) {
    spx_profiler_start();
}

$request = Illuminate\Http\Request::create($path, 'GET', [], [], [], $server);
$response = $kernel->handle($request);
fwrite(STDOUT, 'status='.$response->getStatusCode().PHP_EOL);
$kernel->terminate($request, $response);

if (function_exists('spx_profiler_stop')) {
    spx_profiler_stop();
}
