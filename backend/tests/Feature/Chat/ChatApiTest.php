<?php

namespace Tests\Feature\Chat;

use App\Enums\NotificationType;
use App\Enums\ProviderAccountStatus;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Events\Broadcast\ConversationMessageCreated;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\ProviderAccount;
use App\Models\Role;
use App\Models\UserNotification;
use App\Models\VendorAccount;
use App\Services\Chat\ChatAuthorizationService;
use App\Services\Chat\ChatPresenceService;
use App\Support\SlugGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_customer_can_create_vendor_conversation_and_exchange_messages(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $create = $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
            'subject' => 'Order question',
        ])->assertCreated();

        $conversationId = (string) $create->json('data.conversation.id');
        $this->assertNotEmpty($conversationId);

        $this->getJsonAsUser('/api/v1/profile/conversations', $customer)
            ->assertOk()
            ->assertJsonPath('data.conversations.0.id', $conversationId);

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Hello vendor',
            'idempotency_key' => 'msg-1',
        ])->assertCreated()
            ->assertJsonPath('data.message.body', 'Hello vendor');

        $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $vendor)
            ->assertOk()
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Hello vendor');

        $this->getJsonAsUser('/api/v1/profile/conversations/unread-count', $vendor)
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1);

        $this->patchJsonAsUser("/api/v1/profile/conversations/{$conversationId}/read", $vendor)
            ->assertOk();

        $this->getJsonAsUser('/api/v1/profile/conversations/unread-count', $vendor)
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);
    }

    public function test_conversation_display_name_is_the_other_party(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer, ['name' => 'Sara Customer']);
        $vendor = $this->createUserWithRole(RoleName::Vendor, ['name' => 'Omar Owner']);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();
        $vendorAccount->update(['business_name' => 'Diyar Majlis']);

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Hello vendor',
            'idempotency_key' => 'display-name-1',
        ])->assertCreated();

        $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}", $customer)
            ->assertOk()
            ->assertJsonPath('data.conversation.display_name', 'Diyar Majlis');

        $vendorView = $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}", $vendor)
            ->assertOk();

        $vendorView->assertJsonPath('data.conversation.display_name', 'Sara Customer');

        $participantNames = collect($vendorView->json('data.conversation.participants'))
            ->pluck('name')
            ->all();
        $this->assertContains('Sara Customer', $participantNames);
        $this->assertContains('Diyar Majlis', $participantNames);
    }

    public function test_non_participant_cannot_read_or_send_messages(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $intruder = $this->createUserWithRole(RoleName::Customer);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}", $intruder)
            ->assertForbidden();

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $intruder, [
            'body' => 'Intrusion attempt',
            'idempotency_key' => 'intruder-attempt-1',
        ])->assertForbidden();
    }

    public function test_message_idempotency_key_prevents_duplicate_messages(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $payload = ['body' => 'Retry safe', 'idempotency_key' => 'idem-abc'];

        $firstId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, $payload)
            ->assertCreated()
            ->json('data.message.id');

        $secondId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, $payload)
            ->assertCreated()
            ->json('data.message.id');

        $this->assertSame($firstId, $secondId);
        $this->assertSame(1, Message::query()->where('conversation_id', $conversationId)->count());
    }

    public function test_message_pagination_returns_cursor_for_older_messages(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        foreach (range(1, 5) as $index) {
            $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
                'body' => "Message {$index}",
                'idempotency_key' => "msg-{$index}",
            ])->assertCreated();

            $this->travel(1)->seconds();
        }

        $pageOne = $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages?limit=2", $customer)
            ->assertOk();

        $this->assertCount(2, $pageOne->json('data.messages'));
        $cursor = $pageOne->json('data.next_cursor');
        $this->assertNotEmpty($cursor);

        $pageTwo = $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages?limit=2&cursor={$cursor}", $customer)
            ->assertOk();

        $this->assertCount(2, $pageTwo->json('data.messages'));
        $this->assertNotSame(
            $pageOne->json('data.messages.0.id'),
            $pageTwo->json('data.messages.0.id'),
        );
    }

    public function test_message_created_notifies_recipient_but_not_sender(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Ping',
            'idempotency_key' => 'notify-1',
        ])->assertCreated();

        $this->assertSame(1, UserNotification::query()->where('user_id', $vendor->id)->count());
        $this->assertSame(0, UserNotification::query()->where('user_id', $customer->id)->count());

        $notification = UserNotification::query()->where('user_id', $vendor->id)->firstOrFail();
        $this->assertSame(NotificationType::ChatMessageReceived, $notification->type);
        $this->assertSame('💬 رسالة جديدة', $notification->title);
        $this->assertStringContainsString('لديك رسالة جديدة من', $notification->body);
        $this->assertSame($customer->name, $notification->data['sender_name'] ?? null);
    }

    public function test_each_chat_message_creates_a_distinct_notification(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'First ping',
            'idempotency_key' => 'notify-multi-1',
        ])->assertCreated();

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Second ping',
            'idempotency_key' => 'notify-multi-2',
        ])->assertCreated();

        $this->assertSame(2, UserNotification::query()->where('user_id', $vendor->id)->count());
    }

    public function test_message_created_skips_in_app_notification_when_recipient_is_viewing_conversation(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        app(ChatPresenceService::class)->touch($vendor, $conversationId);

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Ping while vendor is active in chat',
            'idempotency_key' => 'notify-active-1',
        ])->assertCreated();

        $this->assertSame(0, UserNotification::query()->where('user_id', $vendor->id)->count());
    }

    public function test_user_can_remove_conversation_from_inbox_without_affecting_other_participant(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Hello vendor',
            'idempotency_key' => 'hide-1',
        ])->assertCreated();

        $this->deleteJsonAsUser("/api/v1/profile/conversations/{$conversationId}", $vendor)
            ->assertOk();

        $this->assertCount(
            0,
            $this->getJsonAsUser('/api/v1/profile/conversations', $vendor)->json('data.conversations'),
        );
        $this->assertCount(
            1,
            $this->getJsonAsUser('/api/v1/profile/conversations', $customer)->json('data.conversations'),
        );

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Are you there?',
            'idempotency_key' => 'hide-2',
        ])->assertCreated();

        $this->assertCount(
            1,
            $this->getJsonAsUser('/api/v1/profile/conversations', $vendor)->json('data.conversations'),
        );
    }

    public function test_conversation_channel_authorization_allows_participants_only(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $other = $this->createUserWithRole(RoleName::Customer);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $auth = app(ChatAuthorizationService::class);

        $this->assertTrue($auth->canSubscribe($customer, $conversationId));
        $this->assertTrue($auth->canSubscribe($vendor, $conversationId));
        $this->assertFalse($auth->canSubscribe($other, $conversationId));
    }

    public function test_message_created_broadcasts_to_conversation_channel(): void
    {
        Event::fake([ConversationMessageCreated::class]);
        config(['broadcasting.default' => 'log', 'diyar.chat.realtime_enabled' => true]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Realtime please',
            'idempotency_key' => 'rt-1',
        ])->assertCreated();

        Event::assertDispatched(ConversationMessageCreated::class, function (ConversationMessageCreated $event) use ($conversationId) {
            return $event->message->conversation_id === $conversationId
                && $event->broadcastAs() === 'message.created';
        });
    }

    public function test_vendor_cannot_access_another_vendors_conversation(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccountA = VendorAccount::query()->where('user_id', $vendorA->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccountA->id,
        ])->json('data.conversation.id');

        $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}", $vendorB)
            ->assertForbidden();
    }

    public function test_non_participant_cannot_download_attachment(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $intruder = $this->createUserWithRole(RoleName::Customer);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->json('data.conversation.id');

        $messageId = (string) $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Attachment message',
            'idempotency_key' => 'attach-msg',
        ])->json('data.message.id');

        $attachment = MessageAttachment::query()->create([
            'message_id' => $messageId,
            'disk' => 'local',
            'path' => 'chat/test/file.jpg',
            'original_name' => 'file.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 100,
        ]);

        $this->getJsonAsUser(
            "/api/v1/profile/conversations/{$conversationId}/attachments/{$attachment->id}",
            $intruder,
        )->assertForbidden();
    }

    public function test_multi_role_user_cannot_start_conversation_with_own_vendor_store(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor);
        $customerRole = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();
        $user->roles()->attach($customerRole->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);
        $vendorAccount = VendorAccount::query()->where('user_id', $user->id)->firstOrFail();

        $this->postJsonAsUser('/api/v1/profile/conversations', $user->fresh('roles'), [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertForbidden();
    }

    public function test_multi_role_user_can_message_other_vendors_store_as_customer(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor);
        $customerRole = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();
        $user->roles()->attach($customerRole->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);

        $otherVendor = $this->createUserWithRole(RoleName::Vendor);
        $otherVendorAccount = VendorAccount::query()->where('user_id', $otherVendor->id)->firstOrFail();

        $this->postJsonAsUser('/api/v1/profile/conversations', $user->fresh('roles'), [
            'type' => 'customer_vendor',
            'vendor_account_id' => $otherVendorAccount->id,
        ])->assertCreated();
    }

    public function test_vendor_without_customer_role_can_message_another_store(): void
    {
        $vendorOnly = $this->createUserWithRole(RoleName::Vendor);
        $otherVendor = $this->createUserWithRole(RoleName::Vendor);
        $otherVendorAccount = VendorAccount::query()->where('user_id', $otherVendor->id)->firstOrFail();

        $this->postJsonAsUser('/api/v1/profile/conversations', $vendorOnly, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $otherVendorAccount->id,
        ])->assertCreated();
    }

    public function test_self_chat_error_message_is_returned_to_client(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor);
        $customerRole = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();
        $user->roles()->attach($customerRole->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);
        $vendorAccount = VendorAccount::query()->where('user_id', $user->id)->firstOrFail();

        $this->postJsonAsUser('/api/v1/profile/conversations', $user->fresh('roles'), [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])
            ->assertForbidden()
            ->assertJsonPath('message', __('diyar.chat.self_chat_not_allowed'));
    }

    public function test_empty_conversation_is_hidden_from_recipient_until_first_message(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $conversationId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->getJsonAsUser('/api/v1/profile/conversations', $vendor)
            ->assertOk()
            ->assertJsonCount(0, 'data.conversations');

        $this->getJsonAsUser('/api/v1/profile/conversations', $customer)
            ->assertOk()
            ->assertJsonPath('data.conversations.0.id', $conversationId);

        $this->getJsonAsUser("/api/v1/profile/conversations/{$conversationId}", $vendor)
            ->assertForbidden();

        $this->postJsonAsUser("/api/v1/profile/conversations/{$conversationId}/messages", $customer, [
            'body' => 'Hello there',
            'idempotency_key' => 'draft-visible-1',
        ])->assertCreated();

        $this->getJsonAsUser('/api/v1/profile/conversations', $vendor)
            ->assertOk()
            ->assertJsonPath('data.conversations.0.id', $conversationId)
            ->assertJsonPath('data.conversations.0.last_message.body', 'Hello there');
    }

    public function test_creating_chat_reuses_existing_draft_for_same_store(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = VendorAccount::query()->where('user_id', $vendor->id)->firstOrFail();

        $firstId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $secondId = (string) $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated()->json('data.conversation.id');

        $this->assertSame($firstId, $secondId);
        $this->assertSame(1, Conversation::query()->where('vendor_account_id', $vendorAccount->id)->count());
    }

    public function test_customer_can_message_same_user_separately_as_vendor_and_provider(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $providerRole = Role::query()->where('name', RoleName::Provider->value)->firstOrFail();
        $owner->roles()->attach($providerRole->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);
        ProviderAccount::query()->create([
            'user_id' => $owner->id,
            'business_name' => $owner->name.' Services',
            'slug' => SlugGenerator::unique($owner->name.' Services', new ProviderAccount),
            'status' => ProviderAccountStatus::Active,
        ]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendorAccount = VendorAccount::query()->where('user_id', $owner->id)->firstOrFail();
        $providerAccount = ProviderAccount::query()->where('user_id', $owner->id)->firstOrFail();

        $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_vendor',
            'vendor_account_id' => $vendorAccount->id,
        ])->assertCreated();

        $this->postJsonAsUser('/api/v1/profile/conversations', $customer, [
            'type' => 'customer_provider',
            'provider_account_id' => $providerAccount->id,
        ])->assertCreated();
    }
}
