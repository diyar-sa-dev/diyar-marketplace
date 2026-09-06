<?php

namespace Tests\Feature\Api\V1\B2b;

use App\Enums\B2bPublicationStatus;
use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\B2bLead;
use App\Models\UserNotification;
use App\Services\B2b\AdminB2bService;
use Database\Seeders\AdminPermissionSeeder;
use Database\Seeders\B2bContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class B2bNotificationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(AdminPermissionSeeder::class);
        $this->seed(B2bContentSeeder::class);
    }

    #[Test]
    public function publishing_b2b_company_notifies_owner(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $admin = $this->createUserWithRole(RoleName::Admin);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $create = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Notify Publish Co',
                'b2b_category_id' => $category->id,
                'description' => 'Wholesale partner.',
                'location' => 'الرياض',
            ])
            ->assertCreated();

        $company = B2bCompany::query()->findOrFail($create->json('data.company.id'));

        app(AdminB2bService::class)->publishCompany($company, $admin);

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $vendor->id,
            'type' => NotificationType::B2bCompanyPublished->value,
            'entity_type' => 'b2b_company',
            'entity_id' => $company->id,
        ]);
    }

    #[Test]
    public function submitting_b2b_lead_notifies_company_owner(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $create = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Lead Notify Co',
                'b2b_category_id' => $category->id,
                'description' => 'Wholesale partner.',
                'location' => 'جدة',
            ])
            ->assertCreated();

        $company = B2bCompany::query()->findOrFail($create->json('data.company.id'));
        $company->forceFill([
            'publication_status' => B2bPublicationStatus::Published,
            'published_at' => now()->subDay(),
        ])->save();

        $this->actingAs($customer)
            ->postJson('/api/v1/b2b/companies/'.$company->slug.'/leads', [
                'project_type' => 'Office fit-out',
                'details' => 'Need a wholesale quote for 120 desks.',
                'budget_range' => '50k_200k',
            ])
            ->assertCreated();

        $lead = B2bLead::query()->where('b2b_company_id', $company->id)->firstOrFail();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $vendor->id,
            'type' => NotificationType::B2bLeadReceived->value,
            'entity_type' => 'b2b_lead',
            'entity_id' => $lead->id,
        ]);
    }

    #[Test]
    public function accepting_or_rejecting_lead_notifies_requester(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $create = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Respond Notify Co',
                'b2b_category_id' => $category->id,
                'description' => 'Wholesale partner.',
                'location' => 'الدمام',
            ])
            ->assertCreated();

        $company = B2bCompany::query()->findOrFail($create->json('data.company.id'));
        $company->forceFill([
            'publication_status' => B2bPublicationStatus::Published,
            'published_at' => now()->subDay(),
        ])->save();

        $this->actingAs($customer)
            ->postJson('/api/v1/b2b/companies/'.$company->slug.'/leads', [
                'project_type' => 'Retail shelving',
                'details' => 'Need shelving units for 8 stores.',
                'budget_range' => '10k_50k',
            ])
            ->assertCreated();

        $lead = B2bLead::query()->where('b2b_company_id', $company->id)->firstOrFail();

        $this->actingAs($vendor)
            ->patchJson('/api/v1/dashboard/vendor/b2b/leads/'.$lead->id, [
                'status' => 'accepted',
            ])
            ->assertOk();

        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $customer->id)
                ->where('type', NotificationType::B2bLeadAccepted->value)
                ->where('entity_id', $lead->id)
                ->exists()
        );

        $lead2 = B2bLead::query()->create([
            'b2b_company_id' => $company->id,
            'user_id' => $customer->id,
            'project_type' => 'Warehouse racking',
            'details' => 'Second request for testing rejection.',
            'budget_range' => 'unspecified',
            'status' => 'new',
        ]);

        $this->actingAs($vendor)
            ->patchJson('/api/v1/dashboard/vendor/b2b/leads/'.$lead2->id, [
                'status' => 'rejected',
            ])
            ->assertOk();

        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $customer->id)
                ->where('type', NotificationType::B2bLeadRejected->value)
                ->where('entity_id', $lead2->id)
                ->exists()
        );
    }
}
