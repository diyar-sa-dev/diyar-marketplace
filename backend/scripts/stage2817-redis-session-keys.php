<?php

declare(strict_types=1);
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Redis;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$redis = Redis::connection(config('session.connection'));
$prefix = config('database.redis.options.prefix', '').config('session.prefix', '');

echo "session prefix={$prefix}\n";
$keys = $redis->keys('*');
echo 'key_count='.count($keys)."\n";
foreach (array_slice($keys, 0, 20) as $key) {
    $ttl = $redis->ttl($key);
    $len = strlen((string) $redis->get($key));
    echo "{$key} ttl={$ttl} bytes={$len}\n";
}
