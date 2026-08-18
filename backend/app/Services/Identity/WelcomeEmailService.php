<?php

namespace App\Services\Identity;

use App\Enums\RoleName;
use App\Models\User;
use App\Services\Mail\DiyarMailContent;
use App\Services\Mail\DiyarPhpMailer;
use App\Support\User\UserNotificationPreferences;

final class WelcomeEmailService
{
    public function __construct(
        private readonly DiyarPhpMailer $mailer,
        private readonly DiyarMailContent $mailContent,
    ) {}

    public function sendIfEligible(User $user, ?string $locale = null): void
    {
        if ($user->email === null || $user->email_verified_at === null) {
            return;
        }

        if ($user->welcome_email_sent_at !== null) {
            return;
        }

        if (! UserNotificationPreferences::emailEnabled($user)) {
            return;
        }

        $locale = UserNotificationPreferences::mailLocale($user, $locale);

        $user->loadMissing('roles');
        $roles = $user->roles
            ->map(fn ($role) => $role->name)
            ->filter(fn (RoleName $role) => $role !== RoleName::Admin)
            ->values()
            ->all();

        if ($roles === []) {
            $roles = [RoleName::Customer];
        }

        $title = $locale === 'ar' ? 'مرحباً بك في ديار' : 'Welcome to Diyar';
        $subject = $locale === 'ar'
            ? 'مرحباً بك في رحلتك مع ديار'
            : 'Welcome to your Diyar journey';

        $body = $this->mailContent->welcomeBody($locale, $user, $roles);

        $frontendUrl = rtrim((string) config('diyar.frontend_url', 'http://localhost:5173'), '/');

        $this->mailer->send(
            $user->email,
            $subject,
            $locale,
            $title,
            $body,
            [
                'cta_label' => $locale === 'ar' ? 'ابدأ الآن' : 'Get started',
                'cta_url' => $frontendUrl,
            ],
        );

        $user->forceFill(['welcome_email_sent_at' => now()])->save();
    }
}
