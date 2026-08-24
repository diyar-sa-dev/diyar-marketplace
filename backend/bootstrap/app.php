<?php

use App\Http\Middleware\AssignRequestCorrelationId;
use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\EnsureAdminPermission;
use App\Http\Middleware\EnsureAdminUserIsActive;
use App\Http\Middleware\EnsureFrontendRequestsAreStateful;
use App\Http\Middleware\EnsureMarketplaceAccess;
use App\Http\Middleware\EnsureMarketplaceNotInMaintenance;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocaleFromRequest;
use App\Http\Middleware\TrustForwardedHost;
use App\Support\Api\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        apiPrefix: 'api/v1',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->web(prepend: [
            TrustForwardedHost::class,
        ]);

        $middleware->api(prepend: [
            AssignRequestCorrelationId::class,
            TrustForwardedHost::class,
            EnsureFrontendRequestsAreStateful::class,
            SetLocaleFromRequest::class,
            EnsureMarketplaceNotInMaintenance::class,
        ]);

        $middleware->append([
            SecurityHeaders::class,
        ]);

        $middleware->alias([
            'security.headers' => SecurityHeaders::class,
            'role' => EnsureUserHasRole::class,
            'account.active' => EnsureAccountIsActive::class,
            'admin.active' => EnsureAdminUserIsActive::class,
            'admin.permission' => EnsureAdminPermission::class,
            'marketplace.access' => EnsureMarketplaceAccess::class,
        ]);

        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            return null;
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error(__('diyar.auth.not_found'), 404);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error(__('diyar.auth.unauthenticated'), 401);
            }
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error(
                    $e->getMessage() !== '' ? $e->getMessage() : __('diyar.auth.forbidden'),
                    403,
                );
            }
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error(
                    $e->getMessage() !== '' ? $e->getMessage() : __('diyar.auth.forbidden'),
                    403,
                );
            }
        });

        $exceptions->render(function (ConflictHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error(
                    $e->getMessage() !== '' ? $e->getMessage() : __('diyar.errors.conflict'),
                    409,
                );
            }
        });

        $exceptions->render(function (InvalidArgumentException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error($e->getMessage(), 400);
            }
        });

        $exceptions->render(function (QueryException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                report($e);

                return ApiResponse::error(__('diyar.errors.unexpected'), 500);
            }
        });
    })->create();
