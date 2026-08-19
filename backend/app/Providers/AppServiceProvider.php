<?php

namespace App\Providers;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Contracts\Payments\PaymentGatewayInterface;
use App\Contracts\Sms\SmsProvider;
use App\Infrastructure\Sms\SmsProviderFactory;
use App\Services\Checkout\AssemblyCalculator;
use App\Services\Checkout\StubAssemblyCalculator;
use App\Services\Identity\SecureOtpCodeGenerator;
use App\Services\Payments\Gateways\LocalPaymentGateway;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahGateway;
use App\Services\Payments\PaymentGatewayManager;
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

        $this->app->singleton(AssemblyCalculator::class, StubAssemblyCalculator::class);

        $this->app->singleton(MyFatoorahGateway::class);
        $this->app->singleton(PaymentGatewayInterface::class, function ($app) {
            if (config('diyar.payments.use_fake_gateway')) {
                return new LocalPaymentGateway;
            }

            return $app->make(MyFatoorahGateway::class);
        });
        $this->app->singleton(PaymentGatewayManager::class, fn ($app) => new PaymentGatewayManager(
            $app->make(PaymentGatewayInterface::class),
        ));
    }

    public function boot(): void
    {
        $caBundle = storage_path('cacert.pem');
        if (is_file($caBundle)) {
            ini_set('curl.cainfo', $caBundle);
            ini_set('openssl.cafile', $caBundle);
        }

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

        RateLimiter::for('wishlist-toggle', function (Request $request) {
            $limit = (int) config('diyar.rate_limits.wishlist_toggle_per_minute', 60);

            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip());
        });
    }
}
