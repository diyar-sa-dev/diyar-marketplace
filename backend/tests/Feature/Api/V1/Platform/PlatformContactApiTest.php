<?php

namespace Tests\Feature\Api\V1\Platform;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PlatformContactApiTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    public function test_consultation_request_is_accepted_with_valid_payload(): void
    {
        $response = $this->postJson('/api/v1/platform/consultation', [
            'name' => 'فيصل بن سلمان',
            'phone' => '0501234567',
            'email' => 'faisal@example.com',
            'message' => 'أرغب في معاينة مجانية لمشروع مجلس فخم في الرياض.',
            'locale' => 'ar',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['message']);
    }

    public function test_consultation_request_rejects_invalid_phone(): void
    {
        $this->postJson('/api/v1/platform/consultation', [
            'name' => 'Test User',
            'phone' => '12345',
            'email' => 'test@example.com',
            'message' => 'Need help with a majlis project please.',
            'locale' => 'en',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_newsletter_subscription_requires_authentication(): void
    {
        $this->postJson('/api/v1/platform/newsletter', [
            'email' => 'subscriber@example.com',
            'locale' => 'ar',
        ])->assertUnauthorized();
    }

    public function test_newsletter_subscription_enables_notification_preferences(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'subscriber@example.com',
        ]);

        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $notifications = is_array($preferences['notifications'] ?? null) ? $preferences['notifications'] : [];
        $matrix = is_array($notifications['matrix'] ?? null) ? $notifications['matrix'] : [];
        $matrix['promotions']['email'] = false;
        $notifications['email'] = false;
        $notifications['matrix'] = $matrix;
        $preferences['notifications'] = $notifications;
        $user->forceFill(['preferences' => $preferences])->save();

        $this->postJsonAsUser('/api/v1/platform/newsletter', $user, [
            'email' => 'subscriber@example.com',
            'locale' => 'ar',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['message']);

        $user->refresh();
        $updated = is_array($user->preferences) ? $user->preferences : [];
        $updatedNotifications = is_array($updated['notifications'] ?? null) ? $updated['notifications'] : [];

        $this->assertTrue($updatedNotifications['email'] ?? false);
        $this->assertTrue($updatedNotifications['matrix']['promotions']['email'] ?? false);
    }

    public function test_newsletter_subscription_rejects_mismatched_email(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'account@example.com',
        ]);

        $this->postJsonAsUser('/api/v1/platform/newsletter', $user, [
            'email' => 'other@example.com',
        ])->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    public function test_newsletter_subscription_rejects_invalid_email(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'account@example.com',
        ]);

        $this->postJsonAsUser('/api/v1/platform/newsletter', $user, [
            'email' => 'not-an-email',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }
}
