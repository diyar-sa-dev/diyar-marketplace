<?php

namespace Database\Seeders;

use App\Enums\BlogArticleStatus;
use App\Enums\ProjectPublicationStatus;
use App\Models\BlogArticle;
use App\Models\BlogCategory;
use App\Models\Project;
use App\Models\ProjectImage;
use Illuminate\Database\Seeder;

class BlogE2eSeeder extends Seeder
{
    public function run(): void
    {
        $category = BlogCategory::query()->updateOrCreate(
            ['slug' => 'e2e-blog-category'],
            [
                'name' => 'E2E Blog',
                'description' => 'Deterministic blog category for end-to-end tests.',
            ],
        );

        BlogArticle::query()->updateOrCreate(
            ['slug' => 'e2e-blog-article'],
            [
                'blog_category_id' => $category->id,
                'title' => 'E2E Blog Article',
                'excerpt' => 'Deterministic published article for end-to-end tests.',
                'content' => '<p>Deterministic E2E blog content.</p>',
                'author_name' => 'E2E Team',
                'reading_time_minutes' => 1,
                'status' => BlogArticleStatus::Published,
                'published_at' => now()->subDay(),
            ],
        );

        BlogArticle::query()->updateOrCreate(
            ['slug' => 'e2e-blog-related-article'],
            [
                'blog_category_id' => $category->id,
                'title' => 'E2E Related Blog Article',
                'excerpt' => 'Related article for end-to-end blog detail tests.',
                'content' => '<p>Related E2E blog content.</p>',
                'author_name' => 'E2E Team',
                'reading_time_minutes' => 1,
                'status' => BlogArticleStatus::Published,
                'published_at' => now()->subDays(2),
            ],
        );

        $project = Project::query()->updateOrCreate(
            ['slug' => 'e2e-showcase-project'],
            [
                'title' => 'E2E Showcase Project',
                'description' => 'Deterministic published project for end-to-end tests.',
                'category' => 'تصميم وتجهيز كلي',
                'location' => 'الرياض',
                'year' => 2025,
                'status' => ProjectPublicationStatus::Published,
                'published_at' => now()->subDay(),
            ],
        );

        ProjectImage::query()->updateOrCreate(
            [
                'project_id' => $project->id,
                'sort_order' => 0,
            ],
            [
                'image_url' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200',
                'alt' => 'E2E Showcase Project',
            ],
        );
    }
}
