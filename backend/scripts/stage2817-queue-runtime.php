<?php

declare(strict_types=1);

/**
 * Queue runtime gate: duplicate ProcessPaymentWebhookJob with two workers.
 * Run inside container: php scripts/stage2817-queue-runtime.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Enums\PaymentWebhookProcessingStatus;
use App\Jobs\Payments\ProcessPaymentWebhookJob;
use App\Models\PaymentWebhookEvent;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

echo "=== Queue runtime duplicate gate ===\n";

$event = PaymentWebhookEvent::query()->create([
    'gateway' => 'fake',
    'event_type' => 'PaymentStatusChanged',
    'webhook_version' => 'v2',
    'signature_valid' => false,
    'payload_hash' => hash('sha256', 'runtime-queue-'.Str::uuid()),
    'payload' => ['reference' => 'missing-ref-'.Str::random(8)],
    'processing_status' => PaymentWebhookProcessingStatus::Pending,
]);

echo "event_id={$event->id}\n";

ProcessPaymentWebhookJob::dispatch($event->id);
ProcessPaymentWebhookJob::dispatch($event->id);

echo "dispatched duplicate jobs; waiting for workers...\n";
sleep(8);

Artisan::call('queue:work', [
    '--once' => true,
    '--queue' => 'critical,default',
    '--tries' => 3,
]);

$event->refresh();

echo "status={$event->processing_status->value} attempts={$event->processing_attempts}\n";

$pass = $event->processing_attempts <= 1
    && in_array($event->processing_status, [PaymentWebhookProcessingStatus::Failed, PaymentWebhookProcessingStatus::Processed, PaymentWebhookProcessingStatus::Ignored], true);

echo $pass ? "RESULT: PASS (single logical processing attempt)\n" : "RESULT: FAIL\n";
exit($pass ? 0 : 1);
