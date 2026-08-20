<?php

namespace App\Console\Commands;

use App\Enums\NotificationType;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

final class GenerateTestNotificationsCommand extends Command
{
    protected $signature = 'diyar:notifications:test {user : User UUID} {--cleanup : Remove notifications created by this command}';

    protected $description = 'Generate or cleanup test notifications for a user via the notification dispatcher';

    private const MARKER = 'stage16.test';

    public function handle(NotificationDispatcher $dispatcher): int
    {
        $userId = (string) $this->argument('user');

        if ($this->option('cleanup')) {
            $deleted = UserNotification::query()
                ->where('user_id', $userId)
                ->where('dedupe_key', 'like', self::MARKER.':%')
                ->delete();

            $this->info("Removed {$deleted} test notifications for user {$userId}.");

            return self::SUCCESS;
        }

        $user = User::query()->with('roles')->find($userId);
        if ($user === null) {
            $this->error('User not found.');

            return self::FAILURE;
        }

        $scenarios = [
            [NotificationType::OrderCreated, ['order_number' => 'TEST-1001', 'total' => '250.00', 'products' => 'Test Product x1'], 'order', Str::uuid()->toString()],
            [NotificationType::PaymentSuccess, ['order_number' => 'TEST-1001', 'amount' => '250.00'], 'payment', Str::uuid()->toString()],
            [NotificationType::BookingCreated, ['reference' => 'BK-TEST-1', 'service_title' => 'Test Service', 'provider_name' => 'Test Provider'], 'booking', Str::uuid()->toString()],
            [NotificationType::OfferReceived, ['provider_name' => 'Test Provider', 'price' => '120.00'], 'offer', Str::uuid()->toString()],
            [NotificationType::ReviewCreated, [
                'product_name' => 'Test Product',
                'rating' => '5',
                'reviewer_name' => 'Test Customer',
                'store_name' => 'Test Store',
            ], 'review', Str::uuid()->toString()],
            [NotificationType::ProductStockLow, ['product_name' => 'Test Product', 'quantity' => '2'], 'product', Str::uuid()->toString()],
            [NotificationType::CouponActivated, ['coupon_code' => 'TEST50'], 'coupon', Str::uuid()->toString()],
            [NotificationType::TeamInvitation, ['store_name' => 'Test Store', 'role' => 'manager'], 'team', Str::uuid()->toString()],
            [NotificationType::SystemAlert, ['message' => 'Test system alert'], 'system', Str::uuid()->toString()],
        ];

        foreach ($scenarios as [$type, $payload, $entityType, $entityId]) {
            $dedupe = self::MARKER.":{$type->value}:{$entityId}";
            $dispatcher->dispatch($type, [$user], $payload, $entityType, $entityId, $dedupe);
        }

        $this->info('Generated '.count($scenarios)." test notifications for user {$userId}.");
        $this->line('Run with --cleanup to remove test notifications only.');

        return self::SUCCESS;
    }
}
