<?php

namespace App\Enums;

enum AffiliateTrafficSource: string
{
    case Instagram = 'instagram';
    case Youtube = 'youtube';
    case Facebook = 'facebook';
    case X = 'x';
    case Messenger = 'messenger';
    case Whatsapp = 'whatsapp';
    case Telegram = 'telegram';
    case Tiktok = 'tiktok';
    case Snapchat = 'snapchat';
    case Ai = 'ai';
    case Email = 'email';
    case Sms = 'sms';
    case Website = 'website';
    case Direct = 'direct';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function tryFromLoose(?string $value): ?self
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $normalized = strtolower(trim(str_replace([' ', '-'], '_', $value)));

        return match ($normalized) {
            'instagram', 'insta', 'ig' => self::Instagram,
            'youtube', 'yt' => self::Youtube,
            'facebook', 'fb' => self::Facebook,
            'x', 'twitter' => self::X,
            'messenger', 'fb_messenger' => self::Messenger,
            'whatsapp', 'wa' => self::Whatsapp,
            'telegram', 'tg' => self::Telegram,
            'tiktok', 'tt' => self::Tiktok,
            'snapchat', 'snap' => self::Snapchat,
            'ai', 'chatgpt', 'openai', 'perplexity', 'claude', 'gemini', 'copilot' => self::Ai,
            'email', 'mail' => self::Email,
            'sms', 'text' => self::Sms,
            'website', 'web', 'link', 'blog' => self::Website,
            'direct', 'organic' => self::Direct,
            'other', 'unknown' => self::Other,
            default => self::tryFrom($normalized),
        };
    }
}
