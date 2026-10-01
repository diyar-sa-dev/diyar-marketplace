<?php

use App\Core\Middleware\ApplyHttpCachePolicy;
use App\Core\Middleware\AssignRequestCorrelationId;
use App\Core\Middleware\EnsureAccountIsActive;
use App\Core\Middleware\EnsureAdminPermission;
use App\Core\Middleware\EnsureAdminUserIsActive;
use App\Core\Middleware\EnsureCleanAuthState;
use App\Core\Middleware\EnsureMarketplaceAccess;
use App\Core\Middleware\EnsureMarketplaceNotInMaintenance;
use App\Core\Middleware\EnsureRoomDesignerAiSpatialEnabled;
use App\Core\Middleware\EnsureRoomDesignerEnabled;
use App\Core\Middleware\EnsureTryInRoomEnabled;
use App\Core\Middleware\EnsureUserHasRole;
use App\Core\Middleware\SecurityHeaders;
use App\Core\Middleware\SetLocaleFromRequest;
use App\Core\Support\Api\ApiResponse;
use App\Core\Support\Http\TrustedProxies;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api/v1',
        then: function (): void {
            require __DIR__.'/../routes/channels.php';

            Broadcast::routes([
                'middleware' => ['web', 'auth:sanctum', 'account.active'],
            ]);
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(
            at: TrustedProxies::addresses(),
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_AWS_ELB,
        );

        $middleware->api(prepend: [
            EnsureCleanAuthState::class,
            AssignRequestCorrelationId::class,
            EnsureFrontendRequestsAreStateful::class,
            SetLocaleFromRequest::class,
            EnsureMarketplaceNotInMaintenance::class,
        ]);

        $middleware->web(prepend: [
            EnsureCleanAuthState::class,
        ]);

        $middleware->append([
            SecurityHeaders::class,
            ApplyHttpCachePolicy::class,
        ]);

        $middleware->alias([
            'security.headers' => SecurityHeaders::class,
            'role' => EnsureUserHasRole::class,
            'account.active' => EnsureAccountIsActive::class,
            'admin.active' => EnsureAdminUserIsActive::class,
            'admin.permission' => EnsureAdminPermission::class,
            'marketplace.access' => EnsureMarketplaceAccess::class,
            'room-designer.enabled' => EnsureRoomDesignerEnabled::class,
            'room-designer.ai-spatial.enabled' => EnsureRoomDesignerAiSpatialEnabled::class,
            'try-in-room.enabled' => EnsureTryInRoomEnabled::class,
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
                $message = trim((string) $e->getMessage());

                if ($message === '' || str_starts_with($message, 'The route ')) {
                    $message = __('diyar.errors.not_found');
                }

                return ApiResponse::error($message, 404);
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
                return ApiResponse::error($e->getMessage(), 422);
            }
        });

        $exceptions->render(function (QueryException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                report($e);

                return ApiResponse::error(__('diyar.errors.unexpected'), 500);
            }
        });
    })->create();
