<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateTrafficSource;

final class AffiliateTrafficSourceResolver
{
    public function resolve(?string $explicitSource, ?string $referrerUrl, ?string $linkDefaultSource = null): AffiliateTrafficSource
    {
        $fromExplicit = AffiliateTrafficSource::tryFromLoose($explicitSource);
        if ($fromExplicit !== null) {
            return $fromExplicit;
        }

        $fromReferrer = $this->resolveFromReferrer($referrerUrl);
        if ($fromReferrer !== null) {
            return $fromReferrer;
        }

        $fromLink = AffiliateTrafficSource::tryFromLoose($linkDefaultSource);
        if ($fromLink !== null) {
            return $fromLink;
        }

        return $referrerUrl !== null && trim($referrerUrl) !== ''
            ? AffiliateTrafficSource::Website
            : AffiliateTrafficSource::Direct;
    }

    private function resolveFromReferrer(?string $referrerUrl): ?AffiliateTrafficSource
    {
        if ($referrerUrl === null || trim($referrerUrl) === '') {
            return null;
        }

        $host = strtolower((string) parse_url($referrerUrl, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host) ?? $host;

        if ($host === '') {
            return null;
        }

        return match (true) {
            str_contains($host, 'instagram.com') => AffiliateTrafficSource::Instagram,
            str_contains($host, 'youtube.com'), str_contains($host, 'youtu.be') => AffiliateTrafficSource::Youtube,
            str_contains($host, 'facebook.com'), str_contains($host, 'fb.com') => AffiliateTrafficSource::Facebook,
            str_contains($host, 'twitter.com'), str_contains($host, 'x.com'), str_contains($host, 't.co') => AffiliateTrafficSource::X,
            str_contains($host, 'messenger.com'), str_contains($host, 'm.me') => AffiliateTrafficSource::Messenger,
            str_contains($host, 'whatsapp.com'), str_contains($host, 'wa.me') => AffiliateTrafficSource::Whatsapp,
            str_contains($host, 'telegram.org'), str_contains($host, 't.me') => AffiliateTrafficSource::Telegram,
            str_contains($host, 'tiktok.com') => AffiliateTrafficSource::Tiktok,
            str_contains($host, 'snapchat.com') => AffiliateTrafficSource::Snapchat,
            $this->isAiReferrer($host) => AffiliateTrafficSource::Ai,
            str_contains($host, 'mail.google.com'), str_contains($host, 'outlook.live.com'), str_contains($host, 'mail.') => AffiliateTrafficSource::Email,
            default => null,
        };
    }

    private function isAiReferrer(string $host): bool
    {
        $aiHosts = [
            'chatgpt.com',
            'openai.com',
            'perplexity.ai',
            'claude.ai',
            'anthropic.com',
            'gemini.google.com',
            'copilot.microsoft.com',
            'bing.com',
            'you.com',
            'poe.com',
        ];

        foreach ($aiHosts as $needle) {
            if ($host === $needle || str_ends_with($host, '.'.$needle)) {
                return true;
            }
        }

        return false;
    }
}
