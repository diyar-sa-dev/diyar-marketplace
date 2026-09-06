<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = User::query()->where('email', 'customer@diyar.local')->first();
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
    $media = app(MediaUploadService::class);
    $path = $media->storeUserAvatar($user, $file);
    $url = $media->url($path);
    echo "stored={$path}\n";
    echo "url={$url}\n";
    echo 'exists='.(Storage::disk($media->diskName())->exists($path) ? 'yes' : 'no')."\n";
} catch (Throwable $e) {
    fwrite(STDERR, get_class($e).': '.$e->getMessage()."\n");
    exit(2);
} finally {
    @unlink($tmp);
}
