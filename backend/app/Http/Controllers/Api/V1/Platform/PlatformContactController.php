<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\PlatformConsultationRequest;
use App\Http\Requests\Platform\PlatformNewsletterRequest;
use App\Services\Platform\PlatformInboundMailService;
use App\Services\Platform\PlatformNewsletterService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Throwable;

class PlatformContactController extends Controller
{
    public function consultation(
        PlatformConsultationRequest $request,
        PlatformInboundMailService $mail,
    ): JsonResponse {
        $validated = $request->validated();
        $locale = is_string($validated['locale'] ?? null) ? $validated['locale'] : app()->getLocale();

        try {
            $mail->sendConsultation([
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'email' => $validated['email'] ?? null,
                'message' => $validated['message'],
            ], $locale);
        } catch (Throwable) {
            return ApiResponse::error(__('diyar.platform.contact_failed'), 502);
        }

        return ApiResponse::success(
            null,
            __('diyar.platform.consultation_sent'),
        );
    }

    public function newsletter(
        PlatformNewsletterRequest $request,
        PlatformNewsletterService $newsletter,
    ): JsonResponse {
        $validated = $request->validated();
        $user = $request->user();

        if ($user === null) {
            return ApiResponse::error(__('diyar.platform.newsletter_auth_required'), 401);
        }

        if (strcasecmp((string) $user->email, $validated['email']) !== 0) {
            return ApiResponse::error(__('diyar.platform.newsletter_email_mismatch'), 422);
        }

        $newsletter->subscribe($user);

        return ApiResponse::success(
            null,
            __('diyar.platform.newsletter_subscribed'),
        );
    }
}
