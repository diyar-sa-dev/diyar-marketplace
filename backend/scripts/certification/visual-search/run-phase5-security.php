<?php

declare(strict_types=1);

/**
 * Isolated Phase 5 §5 security runner — clears rate limiter before adversarial cases.
 */

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$baseDir = $argv[1] ?? storage_path('certification/visual-search/phase5/'.gmdate('Y-m-d_His').'/05-security');
if (! is_dir($baseDir)) {
    mkdir($baseDir, 0777, true);
}

$apiBase = rtrim((string) env('APP_URL', 'http://nginx'), '/');

function makePng(int $w, int $h, int $r = 80, int $g = 120, int $b = 160): string
{
    $img = imagecreatetruecolor($w, $h);
    $color = imagecolorallocate($img, $r, $g, $b);
    imagefill($img, 0, 0, $color);
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);

    return (string) $bytes;
}

$cases = [];
$caseIndex = 0;
$post = function (string $id, string $filename, string $bytes, string $mime) use (&$cases, &$caseIndex, $apiBase): void {
    $caseIndex++;
    $response = Http::withHeaders(['X-Forwarded-For' => "198.51.100.{$caseIndex}"])
        ->attach('image', $bytes, $filename, ['Content-Type' => $mime])
        ->acceptJson()
        ->post("{$apiBase}/api/v1/search/visual");
    $cases[] = [
        'case' => $id,
        'status' => $response->status(),
        'message' => $response->json('message') ?? ($response->json('errors.image.0') ?? null),
    ];
};

$post('valid_png', 'ok.png', makePng(64, 64), 'image/png');
$post('corrupt_binary', 'bad.jpg', random_bytes(512), 'image/jpeg');
$post('mime_spoof_html', 'fake.jpg', '<html>not an image</html>', 'image/jpeg');
$post('svg', 'icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>', 'image/svg+xml');
$post('oversized_2mb_plus', 'big.png', str_repeat('x', (2048 * 1024) + 1), 'image/png');
$post('dimension_2048_ok', 'ok2048.png', makePng(2048, 2048), 'image/png');
$post('dimension_2049', 'bad2049.png', makePng(2049, 100), 'image/png');
$post('pixels_over_4m', 'badpixels.png', makePng(3000, 2000), 'image/png');

file_put_contents("{$baseDir}/adversarial-results.json", json_encode($cases, JSON_PRETTY_PRINT));
echo "Security cases written to {$baseDir}/adversarial-results.json\n";
