<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Jobs\Admin\RecordAdminAuditLogJob;
use App\Models\ChatMessageReport;
use App\Models\Permission;
use App\Models\UserNotification;
use App\Models\VendorAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminChatOversightTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_admin_with_chat_view_can_list_conversations_and_reports(): void
    {
        Queue::fake([RecordAdminAuditLogJob::class]);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Need help with my order',
            'idempotency_key' => 'admin-oversight-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'How can I help?',
            'idempotency_key' => 'admin-oversight-vendor-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'spam',
        ])->assertCreated();

        $this->getJsonAsAdmin('/api/v1/admin/chat/conversations', $admin)
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.conversations.0.id', $conversationId);

        $this->getJsonAsAdmin("/api/v1/admin/chat/conversations/{$conversationId}", $admin)
            ->assertOk()
            ->assertJsonPath('data.conversation.id', $conversationId)
            ->assertJsonCount(2, 'data.conversation.participants');

        $this->getJsonAsAdmin("/api/v1/admin/chat/conversations/{$conversationId}/messages", $admin)
            ->assertOk()
            ->assertJsonCount(2, 'data.messages');

        $this->getJsonAsAdmin('/api/v1/admin/chat/reports?status=pending', $admin)
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.reports.0.reason', 'spam');

        $reportId = ChatMessageReport::query()->value('id');
        $this->getJsonAsAdmin("/api/v1/admin/chat/reports/{$reportId}", $admin)
            ->assertOk()
            ->assertJsonPath('data.report.id', $reportId)
            ->assertJsonPath('data.conversation.id', $conversationId)
            ->assertJsonCount(2, 'data.messages');

        Queue::assertPushed(RecordAdminAuditLogJob::class);
    }

    public function test_admin_can_resolve_chat_report(): void
    {
        Queue::fake([RecordAdminAuditLogJob::class]);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'I need help with my order',
            'idempotency_key' => 'resolve-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'Spam content',
            'idempotency_key' => 'resolve-msg-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'spam',
        ])->assertCreated();

        $reportId = ChatMessageReport::query()->value('id');

        $this->patchJsonAsAdmin("/api/v1/admin/chat/reports/{$reportId}", $admin, [
            'status' => 'dismissed',
            'resolution_note' => 'No policy violation found.',
            'action_taken' => 'none',
        ])->assertOk()
            ->assertJsonPath('data.report.status', 'dismissed');

        $this->assertSame(
            1,
            UserNotification::query()
                ->where('user_id', $customer->id)
                ->where('type', NotificationType::ChatReportResolved->value)
                ->count(),
        );
        $this->assertSame(
            0,
            UserNotification::query()
                ->where('user_id', $vendor->id)
                ->where('type', NotificationType::ChatModerationActionTaken->value)
                ->count(),
        );

        $notification = UserNotification::query()
            ->where('user_id', $customer->id)
            ->where('type', NotificationType::ChatReportResolved->value)
            ->firstOrFail();
        $this->assertSame(NotificationType::ChatReportResolved, $notification->type);
        $this->assertSame('spam', $notification->data['reason'] ?? null);
        $this->assertSame('dismissed', $notification->data['status'] ?? null);
    }

    public function test_admin_actioned_report_notifies_reporter_and_reported_sender(): void
    {
        Queue::fake([RecordAdminAuditLogJob::class]);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Context message',
            'idempotency_key' => 'warn-action-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'Offensive content',
            'idempotency_key' => 'warn-action-vendor-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'harassment',
        ])->assertCreated();

        $reportId = ChatMessageReport::query()->value('id');

        $this->patchJsonAsAdmin("/api/v1/admin/chat/reports/{$reportId}", $admin, [
            'status' => 'actioned',
            'resolution_note' => 'Repeated harassment violates community guidelines.',
            'action_taken' => 'warn_sender',
        ])->assertOk();

        $this->assertSame(
            1,
            UserNotification::query()
                ->where('user_id', $customer->id)
                ->where('type', NotificationType::ChatReportResolved->value)
                ->count(),
        );
        $this->assertSame(
            1,
            UserNotification::query()
                ->where('user_id', $vendor->id)
                ->where('type', NotificationType::ChatModerationActionTaken->value)
                ->count(),
        );

        $reporterNotification = UserNotification::query()
            ->where('user_id', $customer->id)
            ->where('type', NotificationType::ChatReportResolved->value)
            ->firstOrFail();
        $senderNotification = UserNotification::query()
            ->where('user_id', $vendor->id)
            ->where('type', NotificationType::ChatModerationActionTaken->value)
            ->firstOrFail();

        $this->assertSame(NotificationType::ChatReportResolved, $reporterNotification->type);
        $this->assertSame(NotificationType::ChatModerationActionTaken, $senderNotification->type);
        $this->assertSame('harassment', $reporterNotification->data['reason'] ?? null);
        $this->assertSame('actioned', $reporterNotification->data['status'] ?? null);
        $this->assertSame('warn_sender', $senderNotification->data['action_taken'] ?? null);
        $this->assertSame(
            'Repeated harassment violates community guidelines.',
            $senderNotification->data['resolution_note'] ?? null,
        );
    }

    public function test_admin_can_mark_report_under_review(): void
    {
        Queue::fake([RecordAdminAuditLogJob::class]);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Context message',
            'idempotency_key' => 'review-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'Suspicious link',
            'idempotency_key' => 'review-vendor-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'scam',
        ])->assertCreated();

        $reportId = ChatMessageReport::query()->value('id');

        $this->patchJsonAsAdmin("/api/v1/admin/chat/reports/{$reportId}", $admin, [
            'status' => 'under_review',
            'resolution_note' => 'Report appears legitimate — investigating.',
            'action_taken' => 'none',
        ])->assertOk()
            ->assertJsonPath('data.report.status', 'under_review');

        $this->assertSame(
            1,
            UserNotification::query()
                ->where('user_id', $customer->id)
                ->where('type', NotificationType::ChatReportResolved->value)
                ->count(),
        );
        $this->assertSame(
            0,
            UserNotification::query()
                ->where('user_id', $vendor->id)
                ->where('type', NotificationType::ChatModerationActionTaken->value)
                ->count(),
        );

        $this->patchJsonAsAdmin("/api/v1/admin/chat/reports/{$reportId}", $admin, [
            'status' => 'actioned',
            'resolution_note' => 'Confirmed scam attempt — message removed.',
            'action_taken' => 'delete_message',
        ])->assertOk()
            ->assertJsonPath('data.report.status', 'actioned');

        $this->assertNotNull(
            \App\Models\Message::query()->find($messageId)?->deleted_at,
        );
        $this->assertSame(
            1,
            UserNotification::query()
                ->where('user_id', $vendor->id)
                ->where('type', NotificationType::ChatModerationActionTaken->value)
                ->count(),
        );
    }

    public function test_admin_suspend_account_action_suspends_vendor_and_products(): void
    {
        Queue::fake([RecordAdminAuditLogJob::class]);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Context message',
            'idempotency_key' => 'suspend-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'Scam link here',
            'idempotency_key' => 'suspend-vendor-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'scam',
        ])->assertCreated();

        $reportId = ChatMessageReport::query()->value('id');

        $this->patchJsonAsAdmin("/api/v1/admin/chat/reports/{$reportId}", $admin, [
            'status' => 'actioned',
            'resolution_note' => 'Confirmed scam activity — account suspended.',
            'action_taken' => 'suspend_account',
        ])->assertOk()
            ->assertJsonPath('data.report.status', 'actioned')
            ->assertJsonPath('data.report.action_taken', 'suspend_account');

        $vendor->refresh();
        $vendorAccount->refresh();

        $this->assertSame('suspended', $vendor->status->value);
        $this->assertSame('suspended', $vendorAccount->status->value);
        $this->assertNotNull(\App\Models\Message::query()->find($messageId)?->deleted_at);

        $senderNotification = UserNotification::query()
            ->where('user_id', $vendor->id)
            ->where('type', NotificationType::ChatModerationActionTaken->value)
            ->firstOrFail();

        $this->assertSame('suspend_account', $senderNotification->data['action_taken'] ?? null);
    }

    public function test_admin_actioned_report_can_delete_reported_message(): void
    {
        Queue::fake([RecordAdminAuditLogJob::class]);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Context message',
            'idempotency_key' => 'delete-action-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'Offensive content',
            'idempotency_key' => 'delete-action-vendor-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'inappropriate',
        ])->assertCreated();

        $reportId = ChatMessageReport::query()->value('id');

        $this->patchJsonAsAdmin("/api/v1/admin/chat/reports/{$reportId}", $admin, [
            'status' => 'actioned',
            'resolution_note' => 'Message violates community guidelines.',
            'action_taken' => 'delete_message',
        ])->assertOk()
            ->assertJsonPath('data.report.status', 'actioned')
            ->assertJsonPath('data.report.action_taken', 'delete_message');

        $this->assertNotNull(
            \App\Models\Message::query()->find($messageId)?->deleted_at,
        );
    }

    public function test_admin_without_chat_view_permission_is_forbidden(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $permission = Permission::query()->where('key', 'chat.view')->firstOrFail();
        $admin->roles()->first()?->permissions()->detach($permission->id);

        $this->getJsonAsAdmin('/api/v1/admin/chat/conversations', $admin)->assertForbidden();
        $this->getJsonAsAdmin('/api/v1/admin/chat/reports', $admin)->assertForbidden();
    }

    public function test_customer_cannot_access_admin_chat_endpoints(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($customer)->getJson('/api/v1/admin/chat/conversations')->assertUnauthorized();
    }
}
