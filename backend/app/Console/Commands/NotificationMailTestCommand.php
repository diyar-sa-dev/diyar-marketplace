<?php

namespace App\Console\Commands;

use App\Channels\Notifications\EmailNotificationChannel;
use App\Channels\Notifications\InAppChannel;
use App\Channels\Notifications\PushNotificationChannel;
use App\Channels\Notifications\SmsNotificationChannel;
use App\Enums\NotificationChannel;
use App\Enums\NotificationType;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Services\Notifications\NotificationBroadcastProgressService;
use App\Services\Notifications\NotificationCircuitBreaker;
use App\Services\Notifications\NotificationDeliveryStateMachine;
use App\Services\Notifications\NotificationDispatcher;
use App\Services\Outbox\DomainOutboxProcessor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

final class NotificationMailTestCommand extends Command
{
    protected $signature = 'notifications:mail-test
                            {recipient : Email address of an existing user account}
                            {--deliver : Process outbox and execute the delivery job synchronously}
                            {--outbox : Process pending outbox events before delivery}';

    protected $description = 'Verify notification email configuration and the full delivery pipeline';

    public function handle(
        NotificationDispatcher $dispatcher,
        DomainOutboxProcessor $outboxProcessor,
    ): int {
        $recipient = trim((string) $this->argument('recipient'));

        if (! filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address.');

            return self::FAILURE;
        }

        $this->printConfiguration();

        $user = User::query()->where('email', $recipient)->first();

        if ($user === null) {
            $this->warn("No user found with email {$recipient}.");
            $this->line('Create or register a user with this email first.');

            return self::FAILURE;
        }

        $correlationId = (string) str()->uuid();
        $dedupe = "mail-test:{$correlationId}";

        $startedAt = microtime(true);

        $dispatcher->dispatch(
            NotificationType::SystemAlert,
            [$user],
            [
                'title' => 'DIYAR Notification Mail Test',
                'body' => 'This verifies the notification email delivery pipeline.',
                'correlation_id' => $correlationId,
            ],
            'mail_test',
            $correlationId,
            $dedupe,
            [NotificationChannel::Email->value],
        );

        $delivery = NotificationDelivery::query()
            ->where('dedupe_key', 'like', "{$dedupe}%")
            ->where('channel', NotificationChannel::Email)
            ->latest('created_at')
            ->first();

        if ($delivery === null) {
            $this->error('Delivery row was not created (preference suppression or dispatch failure).');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Pipeline — enqueue');
        $this->line("Delivery ID: {$delivery->id}");
        $this->line("Status: {$delivery->status->value}");
        $this->line("Correlation ID: {$delivery->correlation_id}");

        if ((bool) config('diyar.outbox.enabled', true)) {
            $outbox = \App\Models\DomainOutboxEvent::query()
                ->where('aggregate_id', $delivery->id)
                ->latest('created_at')
                ->first();

            if ($outbox !== null) {
                $this->line("Outbox event: {$outbox->id} ({$outbox->status->value})");
            }
        }

        if ($this->option('outbox') || $this->option('deliver')) {
            Artisan::call('outbox:process', ['--limit' => 10]);
            $this->line('Outbox processed.');
        }

        if ($this->option('deliver')) {
            $delivery->refresh();
            $this->newLine();
            $this->info('Pipeline — deliver (synchronous)');

            try {
                $job = new DeliverNotificationChannelJob($delivery->id, [
                    'correlation_id' => $correlationId,
                ]);
                $job->handle(
                    app(InAppChannel::class),
                    app(EmailNotificationChannel::class),
                    app(PushNotificationChannel::class),
                    app(SmsNotificationChannel::class),
                    app(NotificationDeliveryStateMachine::class),
                    app(NotificationCircuitBreaker::class),
                    app(NotificationBroadcastProgressService::class),
                );
            } catch (\Throwable $exception) {
                $delivery->refresh();
                $this->error('Delivery failed: '.$exception->getMessage());
                $this->line("Final status: {$delivery->status->value}");
                if ($delivery->last_error) {
                    $this->line("Last error: {$delivery->last_error}");
                }

                return self::FAILURE;
            }

            $delivery->refresh();
            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            $this->line("Final status: {$delivery->status->value}");
            $this->line("Provider: SMTP (DiyarPhpMailer)");
            $this->line("Latency: {$latencyMs}ms");

            if ($delivery->status->value !== 'delivered') {
                $this->error('Delivery did not reach delivered state.');
                if ($delivery->last_error) {
                    $this->line("Last error: {$delivery->last_error}");
                }

                return self::FAILURE;
            }

            $this->info('SUCCESS — notification email delivery path verified.');
        } else {
            $this->newLine();
            $this->line('Delivery queued. Run with --outbox --deliver to execute synchronously,');
            $this->line('or start a queue worker and run: php artisan outbox:process');
        }

        return self::SUCCESS;
    }

    private function printConfiguration(): void
    {
        $enabled = config('diyar.mail.enabled', false) ? 'true' : 'false';
        $host = (string) config('diyar.mail.host');
        $port = (string) config('diyar.mail.port');
        $encryption = (string) config('diyar.mail.encryption', 'tls');
        $from = (string) config('diyar.mail.from_address');
        $username = (string) config('diyar.mail.username');
        $queue = (string) config('queue.default');
        $outbox = (bool) config('diyar.outbox.enabled', true) ? 'enabled' : 'disabled';

        $this->info('Mail configuration (secrets redacted)');
        $this->line("MAIL_ENABLED: {$enabled}");
        $this->line('MAILER: diyar-php-mailer (PHPMailer SMTP)');
        $this->line("HOST: {$host}");
        $this->line("PORT: {$port}");
        $this->line("ENCRYPTION: {$encryption}");
        $this->line("FROM: {$from}");
        $this->line('USERNAME: '.($username !== '' ? 'configured' : 'missing'));
        $this->line('PASSWORD: ********');
        $this->line("QUEUE: {$queue}");
        $this->line("OUTBOX: {$outbox}");

        if (! config('diyar.mail.enabled', false)) {
            $this->warn('DIYAR_MAIL_ENABLED is false — notification emails will fail in strict delivery mode.');
        }

        if (app()->environment('production') && (string) config('mail.default') === 'log') {
            $this->warn('MAIL_MAILER=log in production — Laravel mail facade will not use SMTP.');
        }

        $this->newLine();
    }
}
