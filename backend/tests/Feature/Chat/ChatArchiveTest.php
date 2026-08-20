<?php

namespace Tests\Feature\Chat;

use App\Enums\ChatArchiveBatchStatus;
use App\Enums\RoleName;
use App\Models\ChatArchiveBatch;
use App\Models\Message;
use App\Models\VendorAccount;
use App\Services\Chat\ChatArchiveService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ChatArchiveTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_archive_skips_business_critical_conversations(): void
    {
        Storage::fake('local');
        config([
            'diyar.chat.retention.archive_enabled' => true,
            'diyar.chat.retention.archive_after_days' => 1,
            'diyar.chat.retention.purge_after_archive' => false,
            'diyar.chat.retention.batch_size' => 50,
        ]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $standardConversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $criticalConversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
            'context_type' => 'order',
            'context_id' => '00000000-0000-4000-8000-000000000001',
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$standardConversationId}/messages", $customer, [
            'body' => 'Standard old message',
            'idempotency_key' => 'std-old',
        ])->assertCreated();

        $this->postJsonAsUser("/api/v1/profile/conversations/{$criticalConversationId}/messages", $customer, [
            'body' => 'Critical old message',
            'idempotency_key' => 'crit-old',
        ])->assertCreated();

        Message::query()->where('conversation_id', $standardConversationId)->update(['created_at' => now()->subDays(10)]);
        Message::query()->where('conversation_id', $criticalConversationId)->update(['created_at' => now()->subDays(10)]);

        $result = app(ChatArchiveService::class)->archiveEligibleMessages();

        $this->assertSame(1, $result['archived']);
        $this->assertSame(1, $result['verified']);
        $this->assertSame(1, Message::query()->where('conversation_id', $standardConversationId)->whereNotNull('archived_at')->count());
        $this->assertSame(0, Message::query()->where('conversation_id', $criticalConversationId)->whereNotNull('archived_at')->count());
    }

    public function test_archive_is_idempotent_for_already_archived_messages(): void
    {
        Storage::fake('local');
        config([
            'diyar.chat.retention.archive_enabled' => true,
            'diyar.chat.retention.archive_after_days' => 1,
            'diyar.chat.retention.purge_after_archive' => false,
        ]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Old message',
            'idempotency_key' => 'archive-1',
        ])->assertCreated();

        Message::query()->where('conversation_id', $conversationId)->update(['created_at' => now()->subDays(10)]);

        $service = app(ChatArchiveService::class);
        $first = $service->archiveEligibleMessages();
        $second = $service->archiveEligibleMessages();

        $this->assertSame(1, $first['archived']);
        $this->assertSame(0, $second['archived']);
    }

    public function test_archive_batch_is_verified_and_purge_requires_safe_to_purge(): void
    {
        Storage::fake('local');
        config([
            'diyar.chat.retention.archive_enabled' => true,
            'diyar.chat.retention.archive_after_days' => 1,
            'diyar.chat.retention.purge_after_archive' => true,
            'diyar.chat.retention.purge_requires_safe_to_purge' => true,
            'diyar.chat.retention.auto_mark_safe_to_purge' => false,
        ]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Verify me',
            'idempotency_key' => 'verify-1',
        ])->assertCreated();

        Message::query()->where('conversation_id', $conversationId)->update(['created_at' => now()->subDays(10)]);

        app(ChatArchiveService::class)->archiveEligibleMessages();

        $batch = ChatArchiveBatch::query()->firstOrFail();
        $this->assertSame(ChatArchiveBatchStatus::Verified, $batch->status);
        $this->assertNotEmpty($batch->checksum);
        $this->assertSame(1, Message::query()->where('conversation_id', $conversationId)->count());

        app(ChatArchiveService::class)->markBatchSafeToPurge($batch->id, 'qa-operator', 'staging drill');

        $this->assertSame(ChatArchiveBatchStatus::SafeToPurge, $batch->fresh()->status);
        $this->assertSame('qa-operator', $batch->fresh()->promoted_by);
    }

    public function test_promotion_refuses_non_verified_batches(): void
    {
        $batch = ChatArchiveBatch::query()->create([
            'message_count' => 1,
            'checksum' => 'abc',
            'storage_disk' => 'local',
            'storage_location' => 'chat-archives/test.jsonl',
            'status' => ChatArchiveBatchStatus::Archiving,
        ]);

        $this->expectException(\InvalidArgumentException::class);

        app(ChatArchiveService::class)->promoteBatchToSafeToPurge($batch->id, 'ops');
    }
}
