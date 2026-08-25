<?php

namespace Tests\Feature\Api\V1\B2b;

use App\Enums\RoleName;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\User;
use Database\Seeders\AdminPermissionSeeder;
use Database\Seeders\B2bContentSeeder;
use Database\Seeders\ProjectContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminB2bCompanyTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(AdminPermissionSeeder::class);
        $this->seed(ProjectContentSeeder::class);
        $this->seed(B2bContentSeeder::class);
    }

    #[Test]
    public function admin_can_create_update_publish_and_verify_company(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $create = $this->actingAs($admin, 'admin')
            ->postJson('/api/v1/admin/b2b/companies', [
                'name' => 'Admin Created B2B Co',
                'slug' => 'admin-created-b2b',
                'b2b_category_id' => $category->id,
                'description' => 'Created via admin API.',
                'about' => '<p>Safe about content</p>',
                'location' => 'جدة',
                'services' => [
                    ['name' => 'Bulk supply'],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.company.slug', 'admin-created-b2b')
            ->assertJsonPath('data.company.publication_status', 'draft');

        $companyId = $create->json('data.company.id');

        $this->getJson('/api/v1/b2b/companies/admin-created-b2b')->assertNotFound();

        $this->actingAs($admin, 'admin')
            ->patchJson('/api/v1/admin/b2b/companies/'.$companyId, [
                'description' => 'Updated description.',
            ])
            ->assertOk()
            ->assertJsonPath('data.company.description', 'Updated description.');

        $this->actingAs($admin, 'admin')
            ->postJson('/api/v1/admin/b2b/companies/'.$companyId.'/publish')
            ->assertOk()
            ->assertJsonPath('data.company.publication_status', 'published');

        $this->getJson('/api/v1/b2b/companies/admin-created-b2b')
            ->assertOk()
            ->assertJsonPath('data.company.slug', 'admin-created-b2b');

        $this->actingAs($admin, 'admin')
            ->postJson('/api/v1/admin/b2b/companies/'.$companyId.'/verify')
            ->assertOk()
            ->assertJsonPath('data.company.verification_status', 'verified');
    }

    #[Test]
    public function customer_cannot_access_admin_b2b_routes(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($customer)->getJson('/api/v1/admin/b2b/companies')->assertUnauthorized();
        $this->actingAs($customer, 'admin')->getJson('/api/v1/admin/b2b/companies')->assertForbidden();
    }

    #[Test]
    public function admin_list_does_not_expose_admin_notes_in_card_payload(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $company = B2bCompany::query()->where('slug', 'modernwood')->firstOrFail();
        $company->update(['admin_notes' => 'Internal moderation note']);

        $response = $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/b2b/companies')
            ->assertOk();

        $payload = json_encode($response->json());
        $this->assertStringNotContainsString('Internal moderation note', $payload);
    }

    #[Test]
    public function public_company_listing_avoids_n_plus_one_queries(): void
    {
        DB::enableQueryLog();

        $this->getJson('/api/v1/b2b/companies?per_page=12')->assertOk();

        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertLessThanOrEqual(12, $queryCount);
    }

    #[Test]
    public function public_company_detail_avoids_n_plus_one_queries(): void
    {
        DB::enableQueryLog();

        $this->getJson('/api/v1/b2b/companies/modernwood')->assertOk();

        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertLessThanOrEqual(22, $queryCount);
    }

    #[Test]
    public function duplicate_lead_submission_is_rejected(): void
    {
        $user = User::factory()->create();

        $payload = [
            'project_type' => 'تأثيث مكتب',
            'details' => 'نحتاج تأثيث مكتب كامل بمعايير عالية للاختبار.',
        ];

        $this->actingAs($user)
            ->postJson('/api/v1/b2b/companies/modernwood/leads', $payload)
            ->assertCreated();

        $this->actingAs($user)
            ->postJson('/api/v1/b2b/companies/modernwood/leads', $payload)
            ->assertStatus(429);
    }

    #[Test]
    public function public_list_caps_per_page(): void
    {
        $this->getJson('/api/v1/b2b/companies?per_page=999')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 48);
    }

    #[Test]
    public function draft_company_visible_to_admin_but_not_public(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $draft = B2bCompany::query()->where('slug', 'draft-b2b-company')->firstOrFail();

        $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/b2b/companies/'.$draft->id)
            ->assertOk()
            ->assertJsonPath('data.company.slug', 'draft-b2b-company');

        $this->getJson('/api/v1/b2b/companies/draft-b2b-company')->assertNotFound();
    }

    #[Test]
    public function customer_can_view_own_lead_only(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $company = B2bCompany::query()->where('slug', 'modernwood')->firstOrFail();

        $createResponse = $this->actingAs($owner)
            ->postJson('/api/v1/b2b/companies/modernwood/leads', [
                'project_type' => 'Unique project type '.uniqid(),
                'details' => 'Lead details long enough for validation rules.',
            ])
            ->assertCreated();

        $leadId = $createResponse->json('data.lead.id');

        $this->actingAs($owner)
            ->getJson('/api/v1/b2b/leads/'.$leadId)
            ->assertOk();

        $this->actingAs($other)
            ->getJson('/api/v1/b2b/leads/'.$leadId)
            ->assertForbidden();
    }
}
