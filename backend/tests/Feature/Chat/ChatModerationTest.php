<?php

namespace Tests\Feature\Chat;

use App\Enums\RoleName;
use App\Models\ChatMessageReport;
use App\Models\VendorAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ChatModerationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_participant_can_report_message_once(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Initial question',
            'idempotency_key' => 'mod-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'Inappropriate content',
            'idempotency_key' => 'mod-vendor-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'harassment',
            'details' => 'Offensive language',
        ])->assertCreated()
            ->assertJsonPath('data.report.reason', 'harassment')
            ->assertJsonPath('data.report.status', 'pending');

        $this->assertSame(1, ChatMessageReport::query()->count());

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $customer, [
            'reason' => 'harassment',
        ])->assertConflict();

        $this->assertSame(1, ChatMessageReport::query()->count());
    }

    public function test_non_participant_cannot_report_message(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $outsider = $this->createUserWithRole(RoleName::Customer);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Hello',
            'idempotency_key' => 'mod-outsider-customer-1',
        ])->assertCreated();

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor, [
            'body' => 'Reply',
            'idempotency_key' => 'mod-outsider-vendor-1',
        ])->assertCreated()->json('data.message.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages/{$messageId}/report", $outsider, [
            'reason' => 'spam',
        ])->assertForbidden();
    }
}
