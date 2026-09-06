<?php

namespace Tests\Feature\Api\V1\Projects;

use App\Enums\ProjectPublicationStatus;
use App\Models\Project;
use Database\Seeders\ProjectContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(ProjectContentSeeder::class);
    }

    #[Test]
    public function lists_only_published_projects(): void
    {
        $response = $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'items' => [
                        ['id', 'slug', 'title', 'category', 'cover_image'],
                    ],
                    'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                ],
            ]);

        $this->assertSame(3, $response->json('data.pagination.total'));

        foreach ($response->json('data.items') as $item) {
            $this->assertNotSame('draft-showroom-concept', $item['slug']);
        }
    }

    #[Test]
    public function shows_published_project_by_slug_with_images(): void
    {
        $this->getJson('/api/v1/projects/alfursan-luxury-majlis')
            ->assertOk()
            ->assertJsonPath('data.project.slug', 'alfursan-luxury-majlis')
            ->assertJsonPath('data.project.title', 'مجلس الفرسان الفاخر')
            ->assertJsonCount(1, 'data.project.images');
    }

    #[Test]
    public function hides_draft_projects_from_public_detail(): void
    {
        $this->getJson('/api/v1/projects/draft-showroom-concept')
            ->assertNotFound();
    }

    #[Test]
    public function filters_projects_by_category(): void
    {
        Project::query()->create([
            'slug' => 'extra-design-project',
            'title' => 'Extra Design Project',
            'description' => 'Published project.',
            'category' => 'تصميم وتجهيز كلي',
            'status' => ProjectPublicationStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $this->getJson('/api/v1/projects?category='.urlencode('تصميم وتجهيز كلي'))
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 2);
    }

    #[Test]
    public function respects_pagination_limits(): void
    {
        for ($i = 0; $i < 15; $i++) {
            Project::query()->create([
                'slug' => 'pagination-project-'.$i,
                'title' => 'Pagination Project '.$i,
                'category' => 'تصميم وتجهيز كلي',
                'status' => ProjectPublicationStatus::Published,
                'published_at' => now()->subDays($i + 1),
            ]);
        }

        $this->getJson('/api/v1/projects?per_page=12')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 12);

        $this->getJson('/api/v1/projects?per_page=999')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 48);
    }
}
