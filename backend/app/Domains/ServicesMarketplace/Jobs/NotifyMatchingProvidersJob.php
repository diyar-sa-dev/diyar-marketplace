<?php

namespace App\Domains\ServicesMarketplace\Jobs;

use App\Domains\Notifications\Services\NotificationDispatcher;
use App\Enums\NotificationType;
use App\Models\ProviderAccount;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

final class NotifyMatchingProvidersJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param list<string> $categoryIds
     */
    public function __construct(
        public readonly string $serviceRequestId,
        public readonly array $categoryIds,
        public readonly ?string $excludeUserId = null,
    ) {
        $this->onQueue('notifications');
    }

    public function handle(NotificationDispatcher $dispatcher): void
    {
        $request = ServiceRequest::query()->find($this->serviceRequestId);
        if ($request === null) {
            return;
        }

        // Find active providers offering services in any of these categories
        $providerAccountIds = Service::query()
            ->where('is_active', true)
            ->whereIn('service_category_id', $this->categoryIds)
            ->whereNotNull('provider_account_id')
            ->distinct()
            ->pluck('provider_account_id')
            ->all();

        if (empty($providerAccountIds)) {
            return;
        }

        // Resolve active provider user accounts
        $providerUsers = User::query()
            ->whereHas('providerAccount', function ($q) use ($providerAccountIds) {
                $q->whereIn('id', $providerAccountIds);
            })
            ->when($this->excludeUserId, fn ($q) => $q->where('id', '!=', $this->excludeUserId))
            ->get();

        if ($providerUsers->isEmpty()) {
            return;
        }

        $frontendUrl = rtrim((string) config('diyar.frontend_url', 'http://localhost:3000'), '/');
        $actionUrl = "{$frontendUrl}/dashboard/provider/requests/{$request->id}";

        foreach ($providerUsers as $providerUser) {
            try {
                $dispatcher->dispatch(
                    type: NotificationType::SystemAlert,
                    recipients: [$providerUser],
                    payload: [
                        'title' => 'طلب خدمة جديد متطابق مع تخصصك',
                        'message' => "تم تقديم طلب خدمة جديد: {$request->title}",
                        'action_url' => $actionUrl,
                        'reference' => $request->reference,
                    ],
                    entityType: 'service_request',
                    entityId: $request->id,
                    dedupeKey: "service_request.matched:{$request->id}:{$providerUser->id}",
                );
            } catch (\Throwable $e) {
                Log::warning('Failed notifying matching provider for service request', [
                    'service_request_id' => $request->id,
                    'provider_user_id' => $providerUser->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
