<?php

namespace App\Providers;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Contracts\Payments\PaymentGatewayInterface;
use App\Contracts\Sms\SmsProvider;
use App\Infrastructure\Sms\SmsProviderFactory;
use App\Services\Checkout\AssemblyCalculator;
use App\Services\Checkout\StubAssemblyCalculator;
use App\Services\Identity\SecureOtpCodeGenerator;
use App\Services\Infrastructure\EnvironmentSafetyValidator;
use App\Services\Payments\Gateways\LocalPaymentGateway;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahGateway;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\DevCommands;
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

        RateLimiter::for('catalog-search', function (Request $request) {
            $limit = (int) config('diyar.rate_limits.catalog_search_per_minute', 60);

            return Limit::perMinute($limit)
                ->by($request->ip());
        });

        RateLimiter::for('catalog-search-suggestions', function (Request $request) {
            $limit = (int) config('diyar.rate_limits.catalog_search_suggestions_per_minute', 90);

            return Limit::perMinute($limit)
                ->by($request->ip());
        });

        RateLimiter::for('webhooks', function (Request $request) {
            return Limit::perMinute((int) config('diyar.rate_limits.webhooks_per_minute', 120))
                ->by($request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute((int) config('diyar.rate_limits.auth_per_minute', 20))
                ->by($request->ip());
        });

        RateLimiter::for('otp', function (Request $request) {
            $phone = (string) $request->input('phone', 'unknown');

            return Limit::perMinute((int) config('diyar.rate_limits.otp_per_minute', 10))
                ->by($phone.'|'.$request->ip());
        });

        RateLimiter::for('wishlist-toggle', function (Request $request) {
            $limit = (int) config('diyar.rate_limits.wishlist_toggle_per_minute', 60);

            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('notification-devices', function (Request $request) {
            return Limit::perMinute(20)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('notification-preferences', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('chat-messages', function (Request $request) {
            $limit = (int) config('diyar.chat.rate_limits.messages_per_minute', 30);

            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('chat-conversations', function (Request $request) {
            $limit = (int) config('diyar.chat.rate_limits.conversations_per_minute', 10);

            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('chat-typing', function (Request $request) {
            $limit = (int) config('diyar.chat.rate_limits.typing_per_minute', 60);

            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('chat-attachments', function (Request $request) {
            $limit = (int) config('diyar.chat.rate_limits.attachments_per_minute', 10);

            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('affiliate-click', function (Request $request) {
            $limit = (int) config('diyar.affiliate.click_rate_limit_per_minute', 30);

            return Limit::perMinute($limit)
                ->by($request->ip());
        });

        RateLimiter::for('affiliate-resolve', function (Request $request) {
            $limit = (int) config('diyar.affiliate.resolve_rate_limit_per_minute', 30);

            return Limit::perMinute($limit)
                ->by($request->ip());
        });

        RateLimiter::for('affiliate-link', function (Request $request) {
            $limit = (int) config('diyar.affiliate.link_rate_limit_per_minute', 20);

            return Limit::perMinute($limit)
                ->by($request->user()?->id ?: $request->ip());
        });

        if (in_array($this->app->environment(), ['production', 'staging'], true) && ! $this->app->runningUnitTests()) {
            $this->assertProductionInfrastructure();
            app(EnvironmentSafetyValidator::class)->assertSafe();
        }

        if ($this->app->runningInConsole()) {
            $this->configureDevCommands();
        }
    }

    private function configureDevCommands(): void
    {
        DevCommands::except('vite');

        DevCommands::artisan('reverb:start', 'reverb');

        DevCommands::artisan(
            'queue:listen --queue=notifications-high,notifications,notifications-low,chat-low,default --tries=1 --timeout=0',
            'queue',
        );

        DevCommands::artisan('diyar:dev-frontend', 'frontend');
    }

    private function assertProductionInfrastructure(): void
    {
        if (! config('diyar.infrastructure.enforce_redis_in_production', true)) {
            return;
        }

        $cache = (string) config('cache.default');
        $queue = (string) config('queue.default');

        if ($cache !== 'redis' || $queue !== 'redis') {
            throw new \RuntimeException(
                'Production requires CACHE_STORE=redis and QUEUE_CONNECTION=redis. '.
                'Set DIYAR_ENFORCE_REDIS_IN_PRODUCTION=false only for controlled maintenance windows.'
            );
        }
    }
}
