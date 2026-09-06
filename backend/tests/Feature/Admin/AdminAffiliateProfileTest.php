<?php

namespace Tests\Feature\Admin;

use App\Enums\AffiliateProfileStatus;
use App\Enums\RoleName;
use App\Services\Affiliate\AffiliateProfileService;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminAffiliateProfileTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_admin_can_list_show_and_suspend_affiliate_profiles(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $marketer = $this->createUserWithRole(RoleName::Marketer);
        $profile = app(AffiliateProfileService::class)->resolveOrCreateForUser($marketer);
        $profile->update(['display_name' => 'Diyar Marketer']);

        $this->actingAsAdmin($admin);

        $this->getJson('/api/v1/admin/affiliate/profiles')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.affiliate_profiles.0.id', $profile->id)
            ->assertJsonPath('data.affiliate_profiles.0.display_name', 'Diyar Marketer')
            ->assertJsonPath('data.affiliate_profiles.0.user.id', $marketer->id);

        $this->getJson("/api/v1/admin/affiliate/profiles/{$profile->id}")
            ->assertOk()
            ->assertJsonPath('data.affiliate_profile.id', $profile->id)
            ->assertJsonPath('data.affiliate_profile.user.name', $marketer->name);

        $this->postJson("/api/v1/admin/affiliate/profiles/{$profile->id}/suspend")
            ->assertOk()
            ->assertJsonPath('data.affiliate_profile.status', AffiliateProfileStatus::Suspended->value);

        $this->postJson("/api/v1/admin/affiliate/profiles/{$profile->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.affiliate_profile.status', AffiliateProfileStatus::Active->value);
    }
}
