<?php

namespace App\Services\Platform;

use App\Services\Mail\DiyarMailContent;
use App\Services\Mail\DiyarPhpMailer;
use Illuminate\Support\Facades\Log;

final class PlatformInboundMailService
{
    public function __construct(
        private readonly DiyarPhpMailer $mailer,
        private readonly DiyarMailContent $mailContent,
    ) {}

    /**
     * @param  array{name: string, phone: string, email?: string|null, message: string}  $payload
     */
    public function sendConsultation(array $payload, string $locale = 'ar'): void
    {
        $supportEmail = (string) config('diyar.platform.support_email', 'support@diyar.com');
        $subject = $locale === 'ar'
            ? 'طلب استشارة جديد — ديار'
            : 'New consultation request — Diyar';

        $title = $locale === 'ar' ? 'طلب استشارة جديد' : 'New consultation request';

        $body = $this->mailContent->consultationInboundBody(
            $locale,
            $payload['name'],
            $payload['phone'],
            $payload['email'] ?? null,
            $payload['message'],
        );

        $this->mailer->send($supportEmail, $subject, $locale, $title, $body);

        Log::info('diyar.platform.consultation_received', [
            'name' => $payload['name'],
            'phone' => $payload['phone'],
            'email' => $payload['email'] ?? null,
        ]);
    }

    public function sendNewsletterSubscription(string $email, string $locale = 'ar'): void
    {
        $supportEmail = (string) config('diyar.platform.support_email', 'support@diyar.com');
        $subject = $locale === 'ar'
            ? 'اشتراك جديد في النشرة — ديار'
            : 'New newsletter subscription — Diyar';

        $title = $locale === 'ar' ? 'اشتراك في النشرة البريدية' : 'Newsletter subscription';

        $body = $this->mailContent->newsletterInboundBody($locale, $email);

        $this->mailer->send($supportEmail, $subject, $locale, $title, $body);

        Log::info('diyar.platform.newsletter_subscribed', [
            'email' => $email,
        ]);
    }
}
