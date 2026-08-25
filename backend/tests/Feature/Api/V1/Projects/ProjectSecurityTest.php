<?php

namespace Tests\Feature\Api\V1\Projects;

use App\Enums\ProjectPublicationStatus;
use App\Enums\RoleName;
use App\Models\Project;
use Database\Seeders\ProjectContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProjectSecurityTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(ProjectContentSeeder::class);
    }

    #[Test]
    public function draft_projects_are_not_public(): void
    {
        $this->getJson('/api/v1/projects/draft-showroom-concept')
            ->assertNotFound();

        $response = $this->getJson('/api/v1/projects')->assertOk();

        foreach ($response->json('data.items') as $item) {
            $this->assertNotSame('draft-showroom-concept', $item['slug']);
        }
    }

    #[Test]
    public function customer_is_denied_admin_project_routes(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($customer)->getJson('/api/v1/admin/projects')->assertUnauthorized();
        $this->actingAs($customer)->postJson('/api/v1/admin/projects', [
            'title' => 'Blocked',
            'category' => 'تصميم وتجهيز كلي',
        ])->assertUnauthorized();
        $this->actingAs($customer, 'admin')->getJson('/api/v1/admin/projects')->assertForbidden();
    }

    #[Test]
    public function caps_invalid_per_page_on_public_listing(): void
    {
        for ($i = 0; $i < 5; $i++) {
            Project::query()->create([
                'slug' => 'security-project-'.$i,
                'title' => 'Security Project '.$i,
                'category' => 'تصميم وتجهيز كلي',
                'status' => ProjectPublicationStatus::Published,
                'published_at' => now()->subDays($i + 1),
            ]);
        }

        $this->getJson('/api/v1/projects?per_page=999')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 48);

        $this->getJson('/api/v1/projects?per_page=abc')
            ->assertStatus(422);
    }

    #[Test]
    public function rejects_overlong_search_query(): void
    {
        $this->getJson('/api/v1/projects?q='.str_repeat('a', 150))
            ->assertStatus(422);
    }

    #[Test]
    public function rejects_invalid_sort_parameter(): void
    {
        $this->getJson('/api/v1/projects?sort=invalid')
            ->assertStatus(422);
    }
}
