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

class B2bCompanyReviewTest extends TestCase
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
    public function accepted_b2b_lead_creates_pending_review_and_submission_updates_company_rating(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $create = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Review Target Co',
                'b2b_category_id' => $category->id,
                'description' => 'Wholesale furniture partner.',
                'location' => 'الرياض',
            ])
            ->assertCreated();

        $company = B2bCompany::query()->findOrFail($create->json('data.company.id'));
        $company->forceFill([
            'publication_status' => B2bPublicationStatus::Published,
            'published_at' => now()->subDay(),
            'rating' => 0,
            'reviews_count' => 0,
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
            ->patchJson('/api/v1/dashboard/vendor/b2b/leads/'.$lead->id, [
                'status' => 'accepted',
            ])
            ->assertOk();

        $this->actingAs($customer)
            ->getJson('/api/v1/profile/reviews?status=pending&type=b2b')
            ->assertOk()
            ->assertJsonPath('data.summary.pending_by_type.b2b', 1)
            ->assertJsonPath('data.items.0.type', 'b2b')
            ->assertJsonPath('data.items.0.b2b_lead_id', $lead->id);

        $this->actingAs($customer)
            ->postJson('/api/v1/b2b/companies/'.$company->slug.'/reviews', [
                'b2b_lead_id' => $lead->id,
                'rating' => 5,
                'comment' => 'Excellent partner to work with.',
            ])
            ->assertOk()
            ->assertJsonPath('data.review.rating', 5);

        $company->refresh();
        $this->assertSame(1, $company->reviews_count);
        $this->assertSame(5.0, (float) $company->rating);

        $this->actingAs($customer)
            ->getJson('/api/v1/profile/reviews?status=published&type=b2b')
            ->assertOk()
            ->assertJsonPath('data.summary.published_by_type.b2b', 1);

        $this->actingAs($customer)
            ->getJson('/api/v1/profile/reviews?status=pending&type=b2b')
            ->assertOk()
            ->assertJsonPath('data.summary.pending_by_type.b2b', 0);

        $this->getJson('/api/v1/b2b/companies/'.$company->slug)
            ->assertOk()
            ->assertJsonPath('data.company.reviews_count', 1)
            ->assertJsonCount(1, 'data.company.customer_reviews');

        $this->actingAs($vendor)
            ->getJson('/api/v1/dashboard/vendor/b2b/reviews')
            ->assertOk()
            ->assertJsonCount(1, 'data.items');
    }

    #[Test]
    public function customer_cannot_review_before_lead_is_accepted(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $create = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Pending Review Co',
                'b2b_category_id' => $category->id,
                'description' => 'Wholesale furniture partner.',
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
                'details' => 'Need a quote for office furniture supply.',
                'budget_range' => '10k_50k',
            ])
            ->assertCreated();

        $lead = B2bLead::query()->where('b2b_company_id', $company->id)->firstOrFail();

        $this->actingAs($customer)
            ->getJson('/api/v1/profile/reviews?status=pending&type=b2b')
            ->assertOk()
            ->assertJsonPath('data.summary.pending_by_type.b2b', 0);

        $this->actingAs($customer)
            ->postJson('/api/v1/b2b/companies/'.$company->slug.'/reviews', [
                'b2b_lead_id' => $lead->id,
                'rating' => 4,
            ])
            ->assertStatus(422);
    }
}
