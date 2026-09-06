<?php

namespace Tests\Feature\Api\V1\B2b;

use App\Enums\B2bPublicationStatus;
use App\Enums\RoleName;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\B2bLead;
use Database\Seeders\AdminPermissionSeeder;
use Database\Seeders\B2bContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PartnerB2bLeadTest extends TestCase
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
    public function published_vendor_can_list_and_respond_to_quote_requests(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $create = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Vendor Quote Inbox Co',
                'b2b_category_id' => $category->id,
                'description' => 'Wholesale furniture partner.',
                'location' => 'الرياض',
            ])
            ->assertCreated();

        $company = B2bCompany::query()->findOrFail($create->json('data.company.id'));
        $company->forceFill([
            'publication_status' => B2bPublicationStatus::Published,
            'published_at' => now()->subDay(),
        ])->save();

        $this->actingAs($customer)
            ->postJson('/api/v1/b2b/companies/'.$company->slug.'/leads', [
                'project_type' => 'Hotel furnishing',
                'estimated_quantity' => '50 sofa sets',
                'details' => 'Need wholesale quote for a hotel project.',
                'budget_range' => '50k_200k',
            ])
            ->assertCreated();

        $lead = B2bLead::query()->where('b2b_company_id', $company->id)->firstOrFail();

        $this->actingAs($vendor)
            ->getJson('/api/v1/dashboard/vendor/b2b/leads')
            ->assertOk()
            ->assertJsonPath('data.summary.new', 1)
            ->assertJsonPath('data.items.0.id', $lead->id)
            ->assertJsonPath('data.items.0.requester.name', $customer->name);

        $this->actingAs($vendor)
            ->patchJson('/api/v1/dashboard/vendor/b2b/leads/'.$lead->id, [
                'status' => 'accepted',
            ])
            ->assertOk()
            ->assertJsonPath('data.lead.status', 'accepted');

        $this->actingAs($vendor)
            ->patchJson('/api/v1/dashboard/vendor/b2b/leads/'.$lead->id, [
                'status' => 'rejected',
            ])
            ->assertStatus(409);
    }

    #[Test]
    public function draft_company_cannot_access_partner_leads_inbox(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Draft Quote Inbox Co',
                'b2b_category_id' => $category->id,
            ])
            ->assertCreated();

        $this->actingAs($vendor)
            ->getJson('/api/v1/dashboard/vendor/b2b/leads')
            ->assertForbidden();
    }
}
