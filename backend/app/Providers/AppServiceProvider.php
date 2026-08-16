<?php

namespace App\Providers;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Contracts\Sms\SmsProvider;
use App\Infrastructure\Sms\SmsProviderFactory;
use App\Services\Identity\SecureOtpCodeGenerator;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OtpCodeGenerator::class, SecureOtpCodeGenerator::class);

        $this->app->singleton(SmsProvider::class, fn () => SmsProviderFactory::make());
    }

    public function boot(): void
    {
        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute((int) env('API_RATE_LIMIT_PER_MINUTE', 60))
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute((int) env('DIYAR_AUTH_RATE_LIMIT', 20))
                ->by($request->ip());
        });

        RateLimiter::for('otp', function (Request $request) {
            $phone = (string) $request->input('phone', 'unknown');

            return Limit::perMinute((int) env('DIYAR_OTP_RATE_LIMIT', 10))
                ->by($phone.'|'.$request->ip());
        });
    }
}
