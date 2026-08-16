<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleFromRequest
{
    /** @var list<string> */
    private const SUPPORTED = ['ar', 'en'];

    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale($this->resolveLocale($request));

        return $next($request);
    }

    private function resolveLocale(Request $request): string
    {
        $candidates = [];

        $explicit = $request->header('X-Locale');
        if (is_string($explicit) && $explicit !== '') {
            $candidates[] = strtolower(trim($explicit));
        }

        $acceptLanguage = $request->header('Accept-Language');
        if (is_string($acceptLanguage) && $acceptLanguage !== '') {
            foreach (explode(',', $acceptLanguage) as $part) {
                $tag = strtolower(trim(explode(';', $part)[0]));
                $candidates[] = $tag;

                if (str_contains($tag, '-')) {
                    $candidates[] = explode('-', $tag)[0];
                }
            }
        }

        foreach ($candidates as $candidate) {
            if (in_array($candidate, self::SUPPORTED, true)) {
                return $candidate;
            }
        }

        return (string) config('app.locale', 'ar');
    }
}
