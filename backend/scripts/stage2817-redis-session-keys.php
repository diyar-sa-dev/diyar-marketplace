<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$redis = Illuminate\Support\Facades\Redis::connection(config('session.connection'));
$prefix = config('database.redis.options.prefix', '').config('session.prefix', '');

echo "session prefix={$prefix}\n";
$keys = $redis->keys('*');
echo 'key_count='.count($keys)."\n";
foreach (array_slice($keys, 0, 20) as $key) {
    $ttl = $redis->ttl($key);
    $len = strlen((string) $redis->get($key));
    echo "{$key} ttl={$ttl} bytes={$len}\n";
}
