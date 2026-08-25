<?php

namespace Tests\Feature\Api\V1\B2b;

use App\Enums\B2bPublicationStatus;
use App\Models\B2bCompany;
use App\Models\B2bLead;
use App\Models\User;
use Database\Seeders\B2bContentSeeder;
use Database\Seeders\ProjectContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class B2bCompanyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(ProjectContentSeeder::class);
        $this->seed(B2bContentSeeder::class);
    }

    #[Test]
    public function lists_only_published_companies(): void
    {
        $response = $this->getJson('/api/v1/b2b/companies')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'items' => [
                        ['slug', 'name', 'rating', 'reviews_count', 'verified'],
                    ],
                    'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                    'stats' => ['verified_companies', 'published_companies'],
                ],
            ]);

        $this->assertSame(3, $response->json('data.pagination.total'));

        foreach ($response->json('data.items') as $item) {
            $this->assertNotSame('draft-b2b-company', $item['slug']);
        }
    }

    #[Test]
    public function hides_unpublished_company_from_public_detail(): void
    {
        $this->getJson('/api/v1/b2b/companies/draft-b2b-company')
            ->assertNotFound();
    }

    #[Test]
    public function shows_published_company_by_slug(): void
    {
        $this->getJson('/api/v1/b2b/companies/modernwood')
            ->assertOk()
            ->assertJsonPath('data.company.slug', 'modernwood')
            ->assertJsonStructure([
                'data' => [
                    'company' => ['stats', 'services', 'testimonials', 'portfolio'],
                    'related',
                ],
            ]);
    }

    #[Test]
    public function filters_companies_by_category(): void
    {
        $response = $this->getJson('/api/v1/b2b/companies?category=interior-design')
            ->assertOk();

        $this->assertSame(1, $response->json('data.pagination.total'));
        $this->assertSame('rowad-decor', $response->json('data.items.0.slug'));
    }

    #[Test]
    public function authenticated_customer_can_submit_lead(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/b2b/companies/modernwood/leads', [
                'project_type' => 'تأثيث فندق',
                'estimated_quantity' => '50 طقم',
                'details' => 'نحتاج تأثيث 50 غرفة فندقية بمعايير 5 نجوم خلال 90 يوماً.',
                'budget_range' => '50k_200k',
            ])
            ->assertCreated()
            ->assertJsonPath('data.lead.project_type', 'تأثيث فندق');

        $this->assertDatabaseHas('b2b_leads', [
            'user_id' => $user->id,
            'project_type' => 'تأثيث فندق',
        ]);
    }

    #[Test]
    public function guest_cannot_submit_lead(): void
    {
        $this->postJson('/api/v1/b2b/companies/modernwood/leads', [
            'project_type' => 'تأثيث فندق',
            'details' => 'تفاصيل كافية للطلب التجريبي.',
        ])->assertUnauthorized();
    }

    #[Test]
    public function customer_cannot_view_another_users_lead(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $company = B2bCompany::query()->where('slug', 'modernwood')->firstOrFail();

        $lead = B2bLead::query()->create([
            'b2b_company_id' => $company->id,
            'user_id' => $owner->id,
            'project_type' => 'طلب خاص',
            'details' => 'تفاصيل سرية لا يجب مشاهدتها.',
            'budget_range' => 'unspecified',
            'status' => 'new',
        ]);

        $this->actingAs($other)
            ->getJson('/api/v1/b2b/leads/'.$lead->id)
            ->assertForbidden();
    }

    #[Test]
    public function unpublished_company_cannot_receive_leads(): void
    {
        $user = User::factory()->create();
        $draft = B2bCompany::query()->where('slug', 'draft-b2b-company')->firstOrFail();
        $this->assertSame(B2bPublicationStatus::Draft, $draft->publication_status);

        $this->actingAs($user)
            ->postJson('/api/v1/b2b/companies/'.$draft->slug.'/leads', [
                'project_type' => 'طلب تجريبي',
                'details' => 'محاولة إرسال لشركة غير منشورة.',
            ])
            ->assertNotFound();
    }
}
