<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;

final class MailTestCommand extends Command
{
    protected $signature = 'mail:test {recipient : Email address to send the test message to}';

    protected $description = 'Send a production-safe test email to verify mail configuration';

    public function handle(): int
    {
        $recipient = trim((string) $this->argument('recipient'));

        if (! filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address.');

            return self::FAILURE;
        }

        $mailer = (string) config('mail.default');
        $fromAddress = (string) config('mail.from.address');
        $fromName = (string) config('mail.from.name');

        $this->line("Mailer: {$mailer}");
        $this->line("From: {$fromName} <{$fromAddress}>");

        try {
            Mail::raw(
                'This is a test email from DIYAR marketplace to verify mail delivery configuration.',
                function (Message $message) use ($recipient, $fromAddress, $fromName): void {
                    $message->to($recipient)
                        ->subject('DIYAR Mail Test')
                        ->from($fromAddress, $fromName !== '' ? $fromName : null);
                },
            );
        } catch (\Throwable $exception) {
            $this->error('Mail delivery failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Test email queued/sent to {$recipient}.");

        return self::SUCCESS;
    }
}
