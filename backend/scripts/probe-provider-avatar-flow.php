<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\ServiceMarketplace\ProviderSettingsService;
use Illuminate\Http\UploadedFile;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = User::query()->where('email', 'eiwan@diyar.local')->first();
if ($user === null) {
    fwrite(STDERR, "User not found\n");
    exit(1);
}

$png = base64_decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    true,
);
$tmp = tempnam(sys_get_temp_dir(), 'avatar');
file_put_contents($tmp, (string) $png);
$file = new UploadedFile($tmp, 'avatar.png', 'image/png', null, true);

try {
    $settings = app(ProviderSettingsService::class);
    $payload = $settings->uploadAvatar($user, $file);
    echo 'avatar_url='.$payload['profile']['avatar_url']."\n";
    echo "ok\n";
} catch (Throwable $e) {
    fwrite(STDERR, get_class($e).': '.$e->getMessage()."\n");
    exit(2);
} finally {
    @unlink($tmp);
}
