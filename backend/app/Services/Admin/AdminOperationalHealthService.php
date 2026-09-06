<?php

namespace App\Services\Admin;

use App\Enums\ChatMessageReportStatus;
use App\Enums\DomainOutboxEventStatus;
use App\Enums\NotificationDeliveryStatus;
use App\Models\ChatMessageReport;
use App\Models\DomainOutboxEvent;
use App\Models\Message;
use App\Models\NotificationDelivery;
use App\Services\Infrastructure\PlatformHealthService;
use Illuminate\Support\Facades\DB;
use Throwable;

final class AdminOperationalHealthService
{
    public function __construct(
        private readonly PlatformHealthService $platformHealth,
    ) {}

    /** @return array<string, mixed> */
    public function buildPayload(): array
    {
        $platform = $this->platformHealth->buildPayload(includeEnvironment: false);
        $operational = [
            'notifications' => $this->notificationMetrics(),
            'chat' => $this->chatMetrics(),
            'outbox' => $this->outboxMetrics(),
            'queues' => $this->queueMetrics($platform['checks']['queue'] ?? []),
        ];

        $overall = $this->resolveOverallStatus($platform, $operational);

        return [
            'overall_status' => $overall,
            'platform' => $platform,
            'operational' => $operational,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function notificationMetrics(): array
    {
        try {
            $counts = NotificationDelivery::query()
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $pending = (int) ($counts[NotificationDeliveryStatus::Pending->value] ?? 0)
                + (int) ($counts[NotificationDeliveryStatus::Queued->value] ?? 0)
                + (int) ($counts[NotificationDeliveryStatus::Processing->value] ?? 0)
                + (int) ($counts[NotificationDeliveryStatus::Retrying->value] ?? 0);
            $failed = (int) ($counts[NotificationDeliveryStatus::Failed->value] ?? 0);

            return [
                'status' => $failed > 50 ? 'CRITICAL' : ($pending > 500 ? 'DEGRADED' : 'HEALTHY'),
                'pending' => $pending,
                'failed' => $failed,
                'delivered' => (int) ($counts[NotificationDeliveryStatus::Delivered->value] ?? 0),
                'suppressed' => (int) ($counts[NotificationDeliveryStatus::Suppressed->value] ?? 0),
            ];
        } catch (Throwable) {
            return ['status' => 'UNKNOWN'];
        }
    }

    /** @return array<string, mixed> */
    private function chatMetrics(): array
    {
        try {
            $pendingReports = ChatMessageReport::query()
                ->where('status', ChatMessageReportStatus::Pending)
                ->count();

            $messagesLastHour = Message::query()
                ->where('created_at', '>=', now()->subHour())
                ->whereNull('archived_at')
                ->count();

            return [
                'status' => $pendingReports > 100 ? 'DEGRADED' : 'HEALTHY',
                'pending_reports' => $pendingReports,
                'messages_last_hour' => $messagesLastHour,
            ];
        } catch (Throwable) {
            return ['status' => 'UNKNOWN'];
        }
    }

    /** @return array<string, mixed> */
    private function outboxMetrics(): array
    {
        try {
            if (! DB::getSchemaBuilder()->hasTable('domain_outbox_events')) {
                return ['status' => 'UNKNOWN', 'available' => false];
            }

            $pending = DomainOutboxEvent::query()
                ->whereIn('status', [
                    DomainOutboxEventStatus::Pending,
                    DomainOutboxEventStatus::Processing,
                    DomainOutboxEventStatus::Failed,
                ])
                ->count();
            $deadLetter = DomainOutboxEvent::query()
                ->where('status', DomainOutboxEventStatus::DeadLetter)
                ->count();

            return [
                'status' => $deadLetter > 0 ? 'DEGRADED' : ($pending > 200 ? 'DEGRADED' : 'HEALTHY'),
                'available' => true,
                'pending' => $pending,
                'dead_letter' => $deadLetter,
            ];
        } catch (Throwable) {
            return ['status' => 'UNKNOWN', 'available' => false];
        }
    }

    /**
     * @param  array<string, mixed>  $queueCheck
     * @return array<string, mixed>
     */
    private function queueMetrics(array $queueCheck): array
    {
        $pending = isset($queueCheck['pending_jobs']) ? (int) $queueCheck['pending_jobs'] : null;
        $failed = isset($queueCheck['failed_jobs']) ? (int) $queueCheck['failed_jobs'] : null;
        $ok = (bool) ($queueCheck['ok'] ?? false);

        $status = 'UNKNOWN';
        if ($ok) {
            $status = ($failed ?? 0) > 25 || ($pending ?? 0) > 1000 ? 'DEGRADED' : 'HEALTHY';
        } elseif ($queueCheck !== []) {
            $status = 'CRITICAL';
        }

        return [
            'status' => $status,
            'driver' => $queueCheck['driver'] ?? null,
            'pending_jobs' => $pending,
            'failed_jobs' => $failed,
        ];
    }

    /**
     * @param  array<string, mixed>  $platform
     * @param  array<string, mixed>  $operational
     */
    private function resolveOverallStatus(array $platform, array $operational): string
    {
        $statuses = collect([
            ($platform['status'] ?? 'degraded') === 'ok' ? 'HEALTHY' : 'DEGRADED',
            $operational['notifications']['status'] ?? 'UNKNOWN',
            $operational['chat']['status'] ?? 'UNKNOWN',
            $operational['outbox']['status'] ?? 'UNKNOWN',
            $operational['queues']['status'] ?? 'UNKNOWN',
        ]);

        if ($statuses->contains('CRITICAL')) {
            return 'CRITICAL';
        }

        if ($statuses->contains('DEGRADED')) {
            return 'DEGRADED';
        }

        if ($statuses->every(fn (string $status) => $status === 'HEALTHY')) {
            return 'HEALTHY';
        }

        return 'UNKNOWN';
    }
}
