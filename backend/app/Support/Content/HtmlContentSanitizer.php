<?php

namespace App\Support\Content;

final class HtmlContentSanitizer
{
    /** @var list<string> */
    private const ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li',
        'h2', 'h3', 'h4', 'blockquote', 'a', 'img',
    ];

    public function sanitize(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $html = $this->stripBlockedElements($html);

        $allowed = '<'.implode('><', self::ALLOWED_TAGS).'>';
        $clean = strip_tags($html, $allowed);

        return $this->stripEventHandlers($this->sanitizeImages($this->sanitizeLinks($clean)));
    }

    private function stripBlockedElements(string $html): string
    {
        $html = (string) preg_replace('/<\s*(iframe|svg|script|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*>.*?<\s*\/\s*\1\s*>/is', '', $html);
        $html = (string) preg_replace('/<\s*(iframe|svg|script|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*\/?>/i', '', $html);

        return $html;
    }

    private function sanitizeLinks(string $html): string
    {
        return (string) preg_replace_callback(
            '/<a\s+([^>]*href\s*=\s*["\'])([^"\']*)(["\'][^>]*)>/i',
            static function (array $matches): string {
                $url = trim($matches[2]);
                if ($url === '' || ! self::isSafeHttpUrl($url)) {
                    return '<span>';
                }

                return '<a href="'.htmlspecialchars($url, ENT_QUOTES, 'UTF-8').'" rel="noopener noreferrer" target="_blank">';
            },
            $html,
        );
    }

    private function sanitizeImages(string $html): string
    {
        return (string) preg_replace_callback(
            '/<img\s+([^>]*src\s*=\s*["\'])([^"\']*)(["\'][^>]*)>/i',
            static function (array $matches): string {
                $url = trim($matches[2]);
                if ($url === '' || ! self::isSafeHttpUrl($url)) {
                    return '';
                }

                return '<img src="'.htmlspecialchars($url, ENT_QUOTES, 'UTF-8').'">';
            },
            $html,
        );
    }

    private function stripEventHandlers(string $html): string
    {
        $html = (string) preg_replace('/\s(on\w+)\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html);
        $html = (string) preg_replace('/javascript\s*:/i', '', $html);
        $html = (string) preg_replace('/\sdata\s*:/i', '', $html);

        return $html;
    }

    private static function isSafeHttpUrl(string $url): bool
    {
        if (preg_match('#^data:#i', $url) === 1) {
            return false;
        }

        return preg_match('#^https?://#i', $url) === 1;
    }
}
